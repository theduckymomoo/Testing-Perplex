import MLEngine from './MLEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';

class MLService {
  constructor() {
    this.userEngines = new Map();
    this.currentUserId = null;
    this.currentEngine = null;
    this.initialized = false;
    this.dataCollectionInterval = null;
    this.currentAppliances = [];
    
    // Operation locks to prevent conflicts
    this.operationLocks = {
      training: false,
      dataCollection: false,
      simulation: false,
      cleanup: false
    };
    
    // Enhanced error tracking
    this.errorHistory = [];
    this.maxErrorHistory = 50;

    this.simulationEnabled = true;
    this.minSimulatedData = 100;
    this.isSimulating = false;

    this.config = {
      autoCollectInterval: 300000,
      autoTrainEnabled: true,
      enableBackgroundCollection: true,
      useSimulatedData: true,
      simulationDataWeight: 0.7,
      cloudSyncEnabled: true,
      samplingMode: 'daily',
      hoursPerSample: 24,
      contextWindow: 3,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB limit
      maxTrainingDataSize: 1000,
      dataArchiveThreshold: 500,
    };

    // Bind cleanup methods
    this.cleanup = this.cleanup.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  // FIXED: Enhanced error logging with history
  logError(operation, error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      operation,
      error: error.message || error,
      context,
      userId: this.currentUserId
    };
    
    this.errorHistory.unshift(errorEntry);
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
    }
    
    console.error(`❌ MLService[${operation}]:`, error, context);
  }

  // FIXED: Operation lock management to prevent conflicts
  async acquireLock(operation, timeout = 30000) {
    const startTime = Date.now();
    
    while (this.operationLocks[operation]) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Operation lock timeout for: ${operation}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.operationLocks[operation] = true;
    console.log(`🔒 Acquired lock: ${operation}`);
  }

  releaseLock(operation) {
    this.operationLocks[operation] = false;
    console.log(`🔓 Released lock: ${operation}`);
  }

  // FIXED: Enhanced user management with proper cleanup
  async setCurrentUser(userId, supabase = null) {
    try {
      if (!userId) {
        console.warn('⚠️ Cannot set ML engine: No user ID provided');
        await this.cleanup();
        return { success: false, error: 'No user ID provided' };
      }

      if (this.currentUserId === userId && this.currentEngine) {
        console.log(`✅ Already using ML engine for user: ${userId}`);
        return { success: true, existing: true };
      }

      // Cleanup previous user
      if (this.currentUserId && this.currentUserId !== userId) {
        await this.cleanup(false); // Don't clear data, just cleanup operations
      }

      console.log(`👤 Switching to user ML engine: ${userId}`);
      this.currentUserId = userId;
      
      if (!this.userEngines.has(userId)) {
        this.currentEngine = new MLEngine(userId, {
          minDataPoints: 7,
          predictionHorizon: 24,
          retrainInterval: 3600000,
          confidenceThreshold: 0.7,
          samplingMode: 'daily',
        });
        
        if (supabase && this.config.cloudSyncEnabled) {
          this.currentEngine.setSupabaseClient(supabase);
        }
        
        this.userEngines.set(userId, this.currentEngine);
        console.log(`✅ Created new ML engine for user: ${userId}`);
      } else {
        this.currentEngine = this.userEngines.get(userId);
        console.log(`✅ Loaded existing ML engine for user: ${userId}`);
      }
      
      this.initialized = false;
      return { success: true, existing: false };
    } catch (error) {
      this.logError('setCurrentUser', error, { userId });
      return { success: false, error: error.message };
    }
  }

  getCurrentEngine() {
    if (!this.currentEngine || !this.currentUserId) {
      console.warn('⚠️ No user selected for ML engine. Call setCurrentUser first.');
      return null;
    }
    return this.currentEngine;
  }

  // FIXED: Enhanced data validation and schema consistency
  validateDeviceData(appliances) {
    if (!Array.isArray(appliances)) {
      throw new Error('Appliances must be an array');
    }

    const requiredFields = ['id', 'name', 'type', 'status'];
    for (const appliance of appliances) {
      for (const field of requiredFields) {
        if (!appliance.hasOwnProperty(field)) {
          throw new Error(`Missing required field '${field}' in appliance: ${JSON.stringify(appliance)}`);
        }
      }
      
      if (!['on', 'off'].includes(appliance.status)) {
        throw new Error(`Invalid status '${appliance.status}' for device ${appliance.id}`);
      }
    }

    return true;
  }

  // FIXED: Coordinated data collection with locks and validation
  async collectData(appliances) {
    if (this.operationLocks.dataCollection) {
      console.warn('⚠️ Data collection already in progress, skipping');
      return { success: false, error: 'Collection in progress' };
    }

    try {
      await this.acquireLock('dataCollection');
      
      const engine = this.getCurrentEngine();
      if (!engine) { 
        throw new Error('ML Engine not available for data collection');
      }
      
      this.validateDeviceData(appliances);
      const deviceList = Array.isArray(appliances) ? appliances : [];
      
      // Always collect as day pattern for consistency
      await engine.collectDayPattern(deviceList);
      
      const min = this.simulationEnabled ? 
        Math.max(3, engine.config.minDataPoints * 0.5) : 
        engine.config.minDataPoints;
        
      if (this.config.autoTrainEnabled && 
          engine.trainingData.dayPatterns.length >= min && 
          engine.shouldRetrain() &&
          !this.operationLocks.training) {
        console.log('🔄 Auto-retraining triggered');
        // Don't await to prevent blocking
        this.trainModels().catch(error => 
          this.logError('autoTrain', error)
        );
      }

      return { success: true, collected: true };
    } catch (error) { 
      this.logError('collectData', error, { applianceCount: appliances?.length });
      return { success: false, error: error.message };
    } finally {
      this.releaseLock('dataCollection');
    }
  }

  // FIXED: Enhanced simulation with proper progress tracking and validation
  async fastForwardSimulation(days = 7, onProgress = null) {
    if (!this.simulationEnabled) {
      return { success: false, error: 'Simulation not enabled' };
    }
    if (!this.hasCurrentUser()) {
      return { success: false, error: 'No user selected for simulation' };
    }
    
    try {
      await this.acquireLock('simulation');
      
      console.log(`⏩ ML Fast-forwarding ${days} days with full day patterns...`);
      this.isSimulating = true;
      
      const generatedPatterns = [];
      let daysGenerated = 0;
      
      for (let day = 0; day < days; day++) {
        try {
          const dayPattern = this.generateFullDayPattern(day);
          
          // Validate pattern before injection
          if (!this.validateDayPattern(dayPattern)) {
            throw new Error(`Invalid day pattern generated for day ${day}`);
          }
          
          await this.injectDayPattern(dayPattern);
          generatedPatterns.push(dayPattern);
          daysGenerated++;
          
          if (onProgress) {
            const progressData = {
              day: day + 1,
              totalDays: days,
              dayPatterns: daysGenerated,
              progress: Math.round(((day + 1) / days) * 100),
              currentDate: dayPattern.date,
              totalEnergy: dayPattern.summary.totalEnergyKwh
            };
            
            try {
              onProgress(progressData);
            } catch (progressError) {
              console.warn('Progress callback error:', progressError);
            }
          }
          
          // Prevent blocking with small delays
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (dayError) {
          this.logError('simulationDay', dayError, { day });
          // Continue with next day instead of failing completely
          continue;
        }
      }
      
      // Auto-train if sufficient data
      if (this.currentEngine.trainingData.dayPatterns.length >= this.currentEngine.config.minDataPoints) {
        console.log('🎓 Auto-training with day patterns...');
        try {
          await this.trainModels();
        } catch (trainError) {
          this.logError('simulationTraining', trainError);
          // Don't fail the simulation if training fails
        }
      }
      
      return { 
        success: true, 
        dayPatternsGenerated: daysGenerated,
        simulatedDays: days, 
        status: this.getSimulationStatus(),
        generatedPatterns: generatedPatterns.length
      };
    } catch (error) {
      this.logError('fastForwardSimulation', error, { days });
      return { success: false, error: error.message };
    } finally {
      this.isSimulating = false;
      this.releaseLock('simulation');
    }
  }

  // FIXED: Enhanced day pattern validation
  validateDayPattern(dayPattern) {
    if (!dayPattern || typeof dayPattern !== 'object') {
      return false;
    }

    const requiredFields = ['date', 'dayOfWeek', 'hourlySnapshots', 'summary'];
    for (const field of requiredFields) {
      if (!dayPattern.hasOwnProperty(field)) {
        console.error(`Missing required field in day pattern: ${field}`);
        return false;
      }
    }

    if (!Array.isArray(dayPattern.hourlySnapshots) || dayPattern.hourlySnapshots.length !== 24) {
      console.error('Day pattern must have exactly 24 hourly snapshots');
      return false;
    }

    // Validate each hourly snapshot
    for (let i = 0; i < dayPattern.hourlySnapshots.length; i++) {
      const snapshot = dayPattern.hourlySnapshots[i];
      if (!snapshot.timestamp || !Array.isArray(snapshot.devices) || typeof snapshot.hour !== 'number') {
        console.error(`Invalid hourly snapshot at index ${i}`);
        return false;
      }
    }

    return true;
  }

  // Existing pattern generation methods remain the same but with enhanced error handling
  generateFullDayPattern(dayOffset = 0) {
    try {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - dayOffset);
      
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const dayType = isWeekend ? 'weekend' : 'weekday';
      
      const hourlySnapshots = [];
      const dayEvents = this.generateDayEvents(isWeekend);
      
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(currentDate);
        timestamp.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
        
        const devices = this.currentAppliances.map(appliance => {
          const devicePattern = this.getRealisticDeviceState(
            appliance, 
            hour, 
            isWeekend, 
            dayEvents,
            hourlySnapshots[hour - 1]
          );
          
          return {
            id: appliance.id,
            type: appliance.type,
            room: appliance.room,
            status: devicePattern.isActive ? 'on' : 'off',
            power: devicePattern.power,
            isActive: devicePattern.isActive,
            transitionReason: devicePattern.reason,
            context: devicePattern.context,
          };
        });

        const totalPower = devices
          .filter(device => device.isActive)
          .reduce((sum, device) => sum + device.power, 0);

        hourlySnapshots.push({
          timestamp: timestamp.toISOString(),
          hour,
          dayOfWeek: currentDate.getDay(),
          isWeekend,
          devices,
          totalPower,
          activeDeviceCount: devices.filter(d => d.isActive).length,
          dayEvents: dayEvents.filter(event => event.hour === hour),
        });
      }

      return {
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: currentDate.getDay(),
        isWeekend,
        dayType,
        collectedAt: new Date().toISOString(),
        realData: false,
        hourlySnapshots,
        summary: {
          totalEnergyKwh: hourlySnapshots.reduce((sum, hour) => sum + hour.totalPower, 0) / 1000,
          peakHour: hourlySnapshots.reduce((max, hour, index) => 
            hour.totalPower > hourlySnapshots[max]?.totalPower ? index : max, 0),
          averagePower: hourlySnapshots.reduce((sum, hour) => sum + hour.totalPower, 0) / 24,
          activeDeviceHours: hourlySnapshots.reduce((sum, hour) => sum + hour.activeDeviceCount, 0),
        },
        dayEvents
      };
    } catch (error) {
      this.logError('generateFullDayPattern', error, { dayOffset });
      throw error;
    }
  }

  // [All the existing generation methods remain the same...]
  generateDayEvents(isWeekend) {
    const events = [];
    
    if (Math.random() < 0.8) {
      const wakeUpHour = isWeekend ? 7 + Math.floor(Math.random() * 3) : 6 + Math.floor(Math.random() * 2);
      events.push({
        hour: wakeUpHour,
        type: 'wake_up',
        impact: 'increased_activity',
        description: 'Morning wake up routine',
        deviceTypes: ['light', 'kettle', 'tv', 'computer']
      });
    }
    
    [7, 12, 18].forEach(mealHour => {
      if (Math.random() < 0.7) {
        events.push({
          hour: mealHour + Math.floor(Math.random() * 2),
          type: 'meal_time',
          impact: 'kitchen_activity',
          description: 'Meal preparation',
          deviceTypes: ['microwave', 'kettle', 'light']
        });
      }
    });
    
    if (!isWeekend) {
      events.push({
        hour: 8 + Math.floor(Math.random() * 2),
        type: 'work_start',
        impact: 'work_activity',
        description: 'Start working from home',
        deviceTypes: ['computer', 'light']
      });
      
      events.push({
        hour: 17 + Math.floor(Math.random() * 2),
        type: 'work_end',
        impact: 'relaxation_activity',
        description: 'End of work day',
        deviceTypes: ['tv', 'computer']
      });
    }
    
    if (Math.random() < 0.9) {
      const eveningHour = 18 + Math.floor(Math.random() * 4);
      events.push({
        hour: eveningHour,
        type: 'evening_routine',
        impact: 'comfort_activity',
        description: 'Evening relaxation',
        deviceTypes: ['tv', 'light', 'air conditioner', 'heater']
      });
    }
    
    if (Math.random() < 0.8) {
      const bedtimeHour = isWeekend ? 23 + Math.floor(Math.random() * 2) : 22 + Math.floor(Math.random() * 2);
      events.push({
        hour: bedtimeHour,
        type: 'bedtime',
        impact: 'decreased_activity',
        description: 'Getting ready for bed',
        deviceTypes: ['light', 'tv', 'computer']
      });
    }
    
    return events;
  }

  getRealisticDeviceState(appliance, hour, isWeekend, dayEvents, previousHourData) {
    const basePattern = this.getDeviceHourlyProbability(appliance.type, hour, isWeekend);
    let probability = basePattern.probability;
    let reason = basePattern.reason;
    
    const relevantEvents = dayEvents.filter(event => 
      Math.abs(event.hour - hour) <= 1 && 
      event.deviceTypes.includes(appliance.type)
    );
    
    relevantEvents.forEach(event => {
      switch (event.impact) {
        case 'increased_activity':
          probability *= 1.5;
          reason = `${event.description} - ${reason}`;
          break;
        case 'decreased_activity':
          probability *= 0.3;
          reason = `${event.description} - ${reason}`;
          break;
        case 'kitchen_activity':
          if (['microwave', 'kettle'].includes(appliance.type)) {
            probability *= 2.0;
            reason = `${event.description}`;
          }
          break;
        case 'work_activity':
          if (appliance.type === 'computer') {
            probability *= 1.8;
            reason = `${event.description}`;
          }
          break;
        case 'comfort_activity':
          if (['tv', 'air conditioner', 'heater'].includes(appliance.type)) {
            probability *= 1.4;
            reason = `${event.description}`;
          }
          break;
      }
    });
    
    if (previousHourData) {
      const prevDevice = previousHourData.devices.find(d => d.id === appliance.id);
      if (prevDevice?.isActive) {
        probability *= 1.3;
        reason += ' (continuation)';
      }
    }
    
    probability = Math.min(0.95, probability);
    
    const isActive = Math.random() < probability;
    const power = isActive ? (appliance.normal_usage || 100) : 0;
    
    return {
      isActive,
      power,
      probability,
      reason,
      context: {
        basePattern: basePattern.reason,
        dayEvents: relevantEvents.map(e => e.type),
        hour,
        dayType: isWeekend ? 'weekend' : 'weekday',
      }
    };
  }

  getDeviceHourlyProbability(deviceType, hour, isWeekend) {
    const patterns = {
      refrigerator: { probability: 1.0, reason: 'Essential appliance - always running' },
      router: { probability: 1.0, reason: 'Network essential - always running' },
      light: { probability: this.getLightProbability(hour, isWeekend), reason: this.getLightReason(hour, isWeekend) },
      tv: { probability: this.getTVProbability(hour, isWeekend), reason: this.getTVReason(hour, isWeekend) },
      computer: { probability: this.getComputerProbability(hour, isWeekend), reason: this.getComputerReason(hour, isWeekend) },
      'air conditioner': { probability: this.getACProbability(hour, isWeekend), reason: this.getACReason(hour, isWeekend) },
      heater: { probability: this.getHeaterProbability(hour, isWeekend), reason: this.getHeaterReason(hour, isWeekend) },
      microwave: { probability: this.getMicrowaveProbability(hour, isWeekend), reason: this.getMicrowaveReason(hour, isWeekend) },
      kettle: { probability: this.getKettleProbability(hour, isWeekend), reason: this.getKettleReason(hour, isWeekend) },
      'washing machine': { probability: this.getWashingMachineProbability(hour, isWeekend), reason: this.getWashingMachineReason(hour, isWeekend) },
      default: { probability: this.getDefaultProbability(hour, isWeekend), reason: 'General usage pattern' }
    };
    
    return patterns[deviceType.toLowerCase()] || patterns.default;
  }

  getLightProbability(hour, isWeekend) {
    if (hour >= 22 || hour <= 6) return 0.8;
    if (hour >= 7 && hour <= 9) return 0.6;
    if (hour >= 18 && hour <= 21) return 0.9;
    return 0.1;
  }

  getLightReason(hour, isWeekend) {
    if (hour >= 22 || hour <= 6) return 'Night lighting for safety/comfort';
    if (hour >= 7 && hour <= 9) return 'Morning routine lighting';
    if (hour >= 18 && hour <= 21) return 'Evening activity lighting';
    return 'Minimal daytime lighting';
  }

  getTVProbability(hour, isWeekend) {
    if (isWeekend) {
      if (hour >= 10 && hour <= 14) return 0.5;
      if (hour >= 19 && hour <= 23) return 0.8;
      return 0.2;
    } else {
      if (hour >= 19 && hour <= 22) return 0.7;
      if (hour >= 7 && hour <= 8) return 0.3;
      return 0.1;
    }
  }

  getTVReason(hour, isWeekend) {
    if (isWeekend && hour >= 10 && hour <= 14) return 'Weekend entertainment/relaxation';
    if (hour >= 19 && hour <= 23) return 'Evening entertainment';
    if (hour >= 7 && hour <= 8) return 'Morning news/weather';
    return 'Occasional viewing';
  }

  getComputerProbability(hour, isWeekend) {
    if (isWeekend) {
      if (hour >= 14 && hour <= 20) return 0.4;
      return 0.1;
    } else {
      if (hour >= 8 && hour <= 17) return 0.8;
      if (hour >= 19 && hour <= 21) return 0.3;
      return 0.05;
    }
  }

  getComputerReason(hour, isWeekend) {
    if (!isWeekend && hour >= 8 && hour <= 17) return 'Work hours - high probability';
    if (isWeekend && hour >= 14 && hour <= 20) return 'Weekend personal projects';
    if (hour >= 19 && hour <= 21) return 'Evening personal use';
    return 'Minimal usage outside work/personal time';
  }

  getACProbability(hour, isWeekend) {
    if (hour >= 12 && hour <= 18) return 0.6;
    if (hour >= 22 || hour <= 6) return 0.4;
    return 0.1;
  }

  getACReason(hour, isWeekend) {
    if (hour >= 12 && hour <= 18) return 'Hot afternoon - cooling needed';
    if (hour >= 22 || hour <= 6) return 'Night cooling for sleep comfort';
    return 'Minimal cooling needs';
  }

  getHeaterProbability(hour, isWeekend) {
    if (hour >= 6 && hour <= 9) return 0.7;
    if (hour >= 18 && hour <= 22) return 0.6;
    return 0.1;
  }

  getHeaterReason(hour, isWeekend) {
    if (hour >= 6 && hour <= 9) return 'Morning warmup for comfort';
    if (hour >= 18 && hour <= 22) return 'Evening warmth for relaxation';
    return 'Minimal heating needs';
  }

  getMicrowaveProbability(hour, isWeekend) {
    if ([7, 12, 18, 19].includes(hour)) return 0.6;
    return 0.05;
  }

  getMicrowaveReason(hour, isWeekend) {
    if ([7, 12, 18, 19].includes(hour)) return 'Meal preparation time';
    return 'Occasional heating/reheating';
  }

  getKettleProbability(hour, isWeekend) {
    if ([7, 10, 15, 20].includes(hour)) return 0.5;
    return 0.1;
  }

  getKettleReason(hour, isWeekend) {
    if ([7, 10, 15, 20].includes(hour)) return 'Hot beverage preparation';
    return 'Occasional hot drinks';
  }

  getWashingMachineProbability(hour, isWeekend) {
    if (isWeekend && hour >= 9 && hour <= 15) return 0.3;
    if (!isWeekend && hour >= 7 && hour <= 9) return 0.2;
    return 0.02;
  }

  getWashingMachineReason(hour, isWeekend) {
    if (isWeekend && hour >= 9 && hour <= 15) return 'Weekend laundry time';
    if (!isWeekend && hour >= 7 && hour <= 9) return 'Morning laundry before work';
    return 'Occasional laundry';
  }

  getDefaultProbability(hour, isWeekend) {
    if (hour >= 18 && hour <= 22) return 0.4;
    if (hour >= 8 && hour <= 17) return 0.3;
    return 0.1;
  }

  // FIXED: Enhanced pattern injection with validation and memory management
  async injectDayPattern(dayPattern) {
    try {
      const engine = this.getCurrentEngine();
      if (!engine || !dayPattern) {
        throw new Error('Engine or day pattern not available');
      }
      
      // Validate pattern before injection
      if (!this.validateDayPattern(dayPattern)) {
        throw new Error('Invalid day pattern structure');
      }
      
      if (!engine.trainingData.dayPatterns) {
        engine.trainingData.dayPatterns = [];
      }
      
      engine.trainingData.dayPatterns.push(dayPattern);
      
      // FIXED: Memory management - archive old data if needed
      if (engine.trainingData.dayPatterns.length > this.config.maxTrainingDataSize) {
        await this.archiveOldData(engine);
      }
      
      console.log(`📥 Injected day pattern for ${dayPattern.date} (${dayPattern.hourlySnapshots.length} hours)`);
      
      await engine.saveTrainingData();
      console.log(`📊 Total day patterns: ${engine.trainingData.dayPatterns.length}`);
      
      return { success: true, totalPatterns: engine.trainingData.dayPatterns.length };
    } catch (error) {
      this.logError('injectDayPattern', error, { date: dayPattern?.date });
      throw error;
    }
  }

  // FIXED: Data archiving for memory management
  async archiveOldData(engine) {
    try {
      const threshold = this.config.dataArchiveThreshold;
      const patterns = engine.trainingData.dayPatterns;
      
      if (patterns.length > threshold) {
        // Keep most recent data, archive older
        const toKeep = patterns.slice(-threshold);
        const toArchive = patterns.slice(0, patterns.length - threshold);
        
        // Store archived data
        const archiveKey = `${engine.storageKey}_archive_${Date.now()}`;
        await AsyncStorage.setItem(archiveKey, JSON.stringify({
          archived: true,
          timestamp: new Date().toISOString(),
          data: toArchive,
          userId: this.currentUserId
        }));
        
        engine.trainingData.dayPatterns = toKeep;
        console.log(`📦 Archived ${toArchive.length} old day patterns, kept ${toKeep.length} recent ones`);
      }
    } catch (error) {
      this.logError('archiveOldData', error);
      // Don't throw - archiving failure shouldn't break the main operation
    }
  }

  // FIXED: Enhanced training progress with validation
  getTrainingProgress() {
    try {
      const engine = this.getCurrentEngine();
      if (!engine) {
        return { 
          progress: 0, 
          status: 'not_initialized', 
          current: 0,
          required: 7,
          canTrain: false,
          userId: this.currentUserId,
          simulation: { enabled: this.simulationEnabled },
          error: 'No ML engine available'
        };
      }
      
      const currentDays = engine.trainingData.dayPatterns?.length || 0;
      const requiredDays = this.simulationEnabled ? 5 : 10;
        
      const progress = Math.min(100, (currentDays / requiredDays) * 100);
      
      return {
        progress: Math.round(progress),
        current: currentDays,
        required: requiredDays,
        status: progress >= 100 ? 'ready' : 'collecting',
        canTrain: currentDays >= requiredDays && !this.operationLocks.training,
        userId: this.currentUserId,
        samplingMode: 'daily',
        dataSize: this.getDataSize(),
        simulation: {
          enabled: this.simulationEnabled,
          isSimulating: this.isSimulating,
          simulatedDays: currentDays,
          totalSamples: engine.trainingData.deviceUsage?.length || 0,
        },
        locks: { ...this.operationLocks }
      };
    } catch (error) {
      this.logError('getTrainingProgress', error);
      return {
        progress: 0,
        status: 'error',
        current: 0,
        required: 7,
        canTrain: false,
        error: error.message
      };
    }
  }

  // FIXED: Memory usage tracking
  getDataSize() {
    try {
      const engine = this.getCurrentEngine();
      if (!engine) return 0;
      
      const dataString = JSON.stringify(engine.trainingData);
      return dataString.length * 2; // Approximate bytes (UTF-16)
    } catch (error) {
      return 0;
    }
  }

  // FIXED: Enhanced simulation data injection with validation
  async injectSimulationData(simulationData) {
    try {
      await this.acquireLock('simulation', 10000);
      
      const engine = this.getCurrentEngine();
      if (!engine || !simulationData) {
        throw new Error('Engine or simulation data not available');
      }
      
      const { deviceUsage, userActions, plannedData } = simulationData;
      
      if (deviceUsage?.length) {
        const dayGroups = this.groupSamplesByDay(deviceUsage);
        let patternsCreated = 0;
        
        for (const [date, hourlySamples] of dayGroups) {
          if (hourlySamples.length === 24) {
            const dayPattern = this.createDayPatternFromSamples(hourlySamples, date);
            
            if (this.validateDayPattern(dayPattern)) {
              if (!engine.trainingData.dayPatterns) {
                engine.trainingData.dayPatterns = [];
              }
              engine.trainingData.dayPatterns.push(dayPattern);
              patternsCreated++;
            }
          }
        }
        
        console.log(`📥 Created ${patternsCreated} day patterns from simulation data`);
      }
      
      if (userActions?.length) {
        if (!engine.trainingData.userActions) {
          engine.trainingData.userActions = [];
        }
        engine.trainingData.userActions.push(...userActions);
        console.log(`📥 Injected ${userActions.length} user actions`);
      }
      
      await engine.saveTrainingData();
      console.log(`📊 Total day patterns: ${engine.trainingData.dayPatterns?.length || 0}`);
      
      return { 
        success: true, 
        patternsCreated: dayGroups?.size || 0,
        actionsAdded: userActions?.length || 0
      };
    } catch (error) {
      this.logError('injectSimulationData', error, { 
        deviceUsageCount: simulationData?.deviceUsage?.length,
        userActionsCount: simulationData?.userActions?.length
      });
      return { success: false, error: error.message };
    } finally {
      this.releaseLock('simulation');
    }
  }

  groupSamplesByDay(samples) {
    const dayGroups = new Map();
    
    samples.forEach(sample => {
      const date = sample.timestamp.split('T')[0];
      if (!dayGroups.has(date)) {
        dayGroups.set(date, []);
      }
      dayGroups.get(date).push(sample);
    });
    
    return dayGroups;
  }

  createDayPatternFromSamples(hourlySamples, date) {
    const sortedSamples = hourlySamples.sort((a, b) => a.hour - b.hour);
    
    return {
      date: date,
      dayOfWeek: new Date(date).getDay(),
      isWeekend: [0, 6].includes(new Date(date).getDay()),
      collectedAt: new Date().toISOString(),
      realData: false,
      hourlySnapshots: sortedSamples,
      summary: {
        totalEnergyKwh: sortedSamples.reduce((sum, hour) => sum + hour.totalPower, 0) / 1000,
        peakHour: sortedSamples.reduce((max, hour, index) => 
          hour.totalPower > sortedSamples[max]?.totalPower ? index : max, 0),
        averagePower: sortedSamples.reduce((sum, hour) => sum + hour.totalPower, 0) / 24,
        activeDeviceHours: sortedSamples.reduce((sum, hour) => sum + hour.activeDeviceCount, 0),
      }
    };
  }

  // FIXED: Enhanced initialization with proper error handling
  async initialize(userId = null, supabase = null) {
    try {
      await this.acquireLock('initialization');
      
      if (userId) {
        const userResult = await this.setCurrentUser(userId, supabase);
        if (!userResult.success) {
          throw new Error(userResult.error);
        }
      }
      
      if (!this.currentEngine) {
        throw new Error('No user selected for ML engine');
      }

      if (this.initialized) {
        console.log('✅ ML Service already initialized');
        return { success: true, existing: true };
      }

      console.log(`🚀 Starting ML Service for user: ${this.currentUserId}...`);

      const result = await this.currentEngine.initialize();
      if (result.success) {
        this.initialized = true;
        if (this.config.enableBackgroundCollection) {
          this.startBackgroundCollection();
        }
        console.log('✅ ML Service ready with user-specific engine');
        return { success: true, existing: false };
      }
      
      throw new Error(result.error || 'ML Engine initialization failed');
    } catch (error) {
      this.logError('initialize', error, { userId });
      return { success: false, error: error.message };
    } finally {
      this.releaseLock('initialization');
    }
  }

  // FIXED: Enhanced model training with locks and validation
  async trainModels() {
    if (this.operationLocks.training) {
      return { success: false, error: 'Training already in progress' };
    }

    try {
      await this.acquireLock('training');
      
      const engine = this.getCurrentEngine();
      if (!engine) {
        throw new Error('ML Engine not available');
      }
      
      // Validate training data
      const dayPatterns = engine.trainingData.dayPatterns || [];
      if (dayPatterns.length < engine.config.minDataPoints) {
        throw new Error(`Insufficient data: ${dayPatterns.length}/${engine.config.minDataPoints} day patterns`);
      }
      
      console.log('🎓 Starting ML model training with day patterns...');
      const startTime = Date.now();
      
      const result = await engine.trainModels();
      const trainingTime = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ ML models trained successfully in ${trainingTime}ms`);
        await engine.saveModels();
        return { 
          success: true, 
          accuracy: result.accuracy, 
          modelInfo: result,
          trainingTime,
          dataPoints: dayPatterns.length
        };
      }
      
      throw new Error(result.error || 'Training failed');
    } catch (error) {
      this.logError('trainModels', error);
      return { success: false, error: error.message };
    } finally {
      this.releaseLock('training');
    }
  }

  // FIXED: Enhanced predictions with error handling
  async getPredictions(appliances, horizon = 24) {
    try {
      const engine = this.getCurrentEngine();
      if (!engine) {
        return { 
          success: false, 
          error: 'ML Engine not available',
          predictions: [],
          confidence: 0,
          horizon 
        };
      }
      
      this.validateDeviceData(appliances);
      const deviceList = Array.isArray(appliances) ? appliances : [];
      
      const predictions = engine.getPredictions(deviceList);
      const confidence = engine.getPredictionConfidence ? 
        engine.getPredictionConfidence() : 0;
      
      return { 
        success: true, 
        predictions: predictions || [], 
        confidence, 
        horizon,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logError('getPredictions', error, { applianceCount: appliances?.length, horizon });
      return { 
        success: false, 
        error: error.message,
        predictions: [],
        confidence: 0,
        horizon 
      };
    }
  }

  async getAllPredictions(appliances, horizon = 24) {
    return await this.getPredictions(appliances, horizon);
  }

  // FIXED: Enhanced recommendations with error handling
  getRecommendations(appliances) {
    try {
      const engine = this.getCurrentEngine();
      if (!engine) {
        return [];
      }
      
      this.validateDeviceData(appliances);
      const deviceList = Array.isArray(appliances) ? appliances : [];
      return engine.getRecommendations(deviceList) || [];
    } catch (error) {
      this.logError('getRecommendations', error, { applianceCount: appliances?.length });
      return [];
    }
  }

  // FIXED: Enhanced anomaly detection with error handling
  detectAnomalies(appliances) {
    try {
      const engine = this.getCurrentEngine();
      if (!engine) {
        return { hasAnomaly: false, anomalies: [] };
      }
      
      this.validateDeviceData(appliances);
      const deviceList = Array.isArray(appliances) ? appliances : [];
      return engine.detectAnomalies(deviceList) || { hasAnomaly: false, anomalies: [] };
    } catch (error) {
      this.logError('detectAnomalies', error, { applianceCount: appliances?.length });
      return { hasAnomaly: false, anomalies: [] };
    }
  }

  // FIXED: Enhanced insights with comprehensive error handling
  getMLInsights(appliances) {
    try {
      const engine = this.getCurrentEngine();
      if (!engine) {
        return { 
          ready: false, 
          message: 'ML Service not available', 
          dataProgress: 0, 
          simulation: this.getSimulationStatus(),
          userId: this.currentUserId,
          predictions: [],
          recommendations: [],
          anomalies: { hasAnomaly: false, anomalies: [] },
          dayPatterns: 0,
          dataSamples: 0,
          error: 'No ML engine available'
        };
      }
      
      const deviceList = Array.isArray(appliances) ? appliances : 
                        (Array.isArray(this.currentAppliances) ? this.currentAppliances : []);
      
      if (deviceList.length > 0) {
        this.validateDeviceData(deviceList);
      }
      
      const insights = engine.getMLInsights(deviceList);
      return { 
        ...insights, 
        simulation: this.getSimulationStatus(),
        dataSize: this.getDataSize(),
        memoryUsage: this.getMemoryUsage(),
        lastError: this.errorHistory[0] || null
      };
    } catch (error) {
      this.logError('getMLInsights', error, { applianceCount: appliances?.length });
      return { 
        ready: false, 
        error: error.message, 
        simulation: this.getSimulationStatus(),
        userId: this.currentUserId,
        predictions: [],
        recommendations: [],
        anomalies: { hasAnomaly: false, anomalies: [] },
        dayPatterns: 0,
        dataSamples: 0,
      };
    }
  }

  getMemoryUsage() {
    try {
      const dataSize = this.getDataSize();
      const usagePercent = (dataSize / this.config.maxMemoryUsage) * 100;
      return {
        current: dataSize,
        max: this.config.maxMemoryUsage,
        percent: Math.min(100, usagePercent),
        status: usagePercent > 90 ? 'critical' : usagePercent > 70 ? 'warning' : 'ok'
      };
    } catch (error) {
      return { current: 0, max: this.config.maxMemoryUsage, percent: 0, status: 'ok' };
    }
  }

  getEnergyForecast(appliances, hours = 12) {
    try {
      const engine = this.getCurrentEngine();
      if (!engine) {
        return { 
          success: false, 
          forecast: [], 
          totalExpectedEnergy: 0, 
          totalExpectedCost: 0,
          error: 'ML Engine not available'
        };
      }

      this.validateDeviceData(appliances);
      return engine.getEnergyForecast(appliances, hours);
    } catch (error) {
      this.logError('getEnergyForecast', error, { applianceCount: appliances?.length, hours });
      return { 
        success: false, 
        forecast: [], 
        totalExpectedEnergy: 0, 
        totalExpectedCost: 0,
        error: error.message
      };
    }
  }

  isReadyForUser(userId) {
    return this.currentUserId === userId && this.initialized && this.currentEngine && !this.operationLocks.cleanup;
  }

  getCurrentUserId() {
    return this.currentUserId;
  }

  hasCurrentUser() {
    return !!this.currentUserId && !!this.currentEngine;
  }

  initializeSimulation(appliances) {
    try {
      if (!this.simulationEnabled) {
        return { success: false, error: 'Simulation not enabled' };
      }
      
      const engine = this.getCurrentEngine();
      if (!engine) {
        return { success: false, error: 'ML Engine not available' };
      }
      
      this.validateDeviceData(appliances);
      this.currentAppliances = Array.isArray(appliances) ? appliances : [];
      
      console.log('🎮 Day-based simulation initialized for ML training');
      return { 
        success: true, 
        simulatedAppliances: this.currentAppliances, 
        status: { enabled: true, isSimulating: false } 
      };
    } catch (error) {
      this.logError('initializeSimulation', error, { applianceCount: appliances?.length });
      return { success: false, error: error.message };
    }
  }

  getSimulationStatus() {
    try {
      const engine = this.getCurrentEngine();
      const days = engine?.trainingData?.dayPatterns?.length || 0;
      const samples = engine?.trainingData?.deviceUsage?.length || 0;
      
      return { 
        enabled: this.simulationEnabled, 
        isSimulating: this.isSimulating,
        simulatedDays: days,
        simulatedSamples: samples,
        samplingMode: 'daily',
        userId: this.currentUserId,
        memoryUsage: this.getMemoryUsage(),
        locks: { ...this.operationLocks }
      };
    } catch (error) {
      return {
        enabled: this.simulationEnabled,
        isSimulating: false,
        simulatedDays: 0,
        simulatedSamples: 0,
        error: error.message
      };
    }
  }

  stopSimulation() {
    try {
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }
      this.isSimulating = false;
      this.releaseLock('simulation');
      return { success: true, status: this.getSimulationStatus() };
    } catch (error) {
      this.logError('stopSimulation', error);
      return { success: false, error: error.message };
    }
  }

  resetSimulation() {
    try {
      this.stopSimulation();
      return { success: true, status: this.getSimulationStatus() };
    } catch (error) {
      this.logError('resetSimulation', error);
      return { success: false, error: error.message };
    }
  }

  setSimulationEnabled(enabled) {
    try {
      this.simulationEnabled = enabled;
      if (!enabled) this.stopSimulation();
      return { success: true, simulationEnabled: this.simulationEnabled };
    } catch (error) {
      this.logError('setSimulationEnabled', error, { enabled });
      return { success: false, error: error.message };
    }
  }

  async forceCollection(appliances) {
    try {
      const engine = this.getCurrentEngine();
      if (!engine) { 
        throw new Error('ML Engine not available for force collection');
      }
      
      this.validateDeviceData(appliances);
      const deviceList = Array.isArray(appliances) ? appliances : [];
      
      await engine.collectDayPattern(deviceList);
      console.log('📊 Force collected current day pattern');
      return { success: true, collected: true };
    } catch (error) { 
      this.logError('forceCollection', error, { applianceCount: appliances?.length });
      return { success: false, error: error.message };
    }
  }

  updateAppliances(appliances) {
    try {
      this.validateDeviceData(appliances);
      this.currentAppliances = Array.isArray(appliances) ? appliances : [];
      
      if (this.simulationEnabled && this.currentAppliances.length > 0) {
        this.initializeSimulation(this.currentAppliances);
      }
      
      console.log(`📝 Updated appliances list: ${this.currentAppliances.length} devices`);
      return { success: true, count: this.currentAppliances.length };
    } catch (error) {
      this.logError('updateAppliances', error, { applianceCount: appliances?.length });
      return { success: false, error: error.message };
    }
  }

  startBackgroundCollection() {
    try {
      if (this.dataCollectionInterval) return { success: true, existing: true };
      
      this.dataCollectionInterval = setInterval(async () => {
        if (this.currentAppliances.length > 0 && this.hasCurrentUser() && !this.operationLocks.dataCollection) {
          try {
            await this.collectData(this.currentAppliances);
          } catch (error) {
            this.logError('backgroundCollection', error);
          }
        }
      }, this.config.autoCollectInterval);
      
      console.log(`🔄 Background day pattern collection started (${this.config.autoCollectInterval}ms interval)`);
      return { success: true, existing: false };
    } catch (error) {
      this.logError('startBackgroundCollection', error);
      return { success: false, error: error.message };
    }
  }

  stopBackgroundCollection() {
    try {
      if (this.dataCollectionInterval) {
        clearInterval(this.dataCollectionInterval);
        this.dataCollectionInterval = null;
        console.log('🛑 Background data collection stopped');
      }
      return { success: true };
    } catch (error) {
      this.logError('stopBackgroundCollection', error);
      return { success: false, error: error.message };
    }
  }

  // FIXED: Enhanced cleanup with proper resource management
  async cleanup(clearData = false) {
    try {
      await this.acquireLock('cleanup');
      
      console.log('🧹 Starting ML Service cleanup...');
      
      // Stop all running operations
      this.stopBackgroundCollection();
      this.stopSimulation();
      
      // Clear operation locks
      Object.keys(this.operationLocks).forEach(key => {
        if (key !== 'cleanup') this.operationLocks[key] = false;
      });
      
      if (clearData) {
        const engine = this.getCurrentEngine();
        if (engine) {
          engine.trainingData = {
            deviceUsage: [],
            userActions: [],
            contextData: [],
            costData: [],
            dayPatterns: [],
          };
          
          engine.models = {
            usagePatterns: null,
            userBehavior: null,
            costOptimization: null,
            anomalyDetection: null,
            dayPatterns: null,
          };
          
          engine.metrics = {
            accuracy: 0,
            lastTrainedAt: null,
            predictionsMade: 0,
            correctPredictions: 0,
            userId: this.currentUserId,
            dayPatternsTrained: 0,
            averageDayAccuracy: 0,
          };
          
          engine.initialized = false;
          
          // Clear storage
          await AsyncStorage.multiRemove([engine.storageKey, engine.dataKey, engine.settingsKey]);
        }
      }
      
      // Reset state
      this.currentUserId = null;
      this.currentEngine = null;
      this.initialized = false;
      this.currentAppliances = [];
      this.isSimulating = false;
      
      console.log('✅ ML Service cleanup completed');
      return { success: true, cleared: clearData };
    } catch (error) {
      this.logError('cleanup', error, { clearData });
      return { success: false, error: error.message };
    } finally {
      this.releaseLock('cleanup');
    }
  }

  async clearUserData() {
    return await this.cleanup(true);
  }

  // App state change handler for proper cleanup
  handleAppStateChange(nextAppState) {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.stopBackgroundCollection();
    } else if (nextAppState === 'active' && this.initialized && this.config.enableBackgroundCollection) {
      this.startBackgroundCollection();
    }
  }

  // Get error history for debugging
  getErrorHistory() {
    return [...this.errorHistory];
  }

  // Health check method
  getHealthStatus() {
    const engine = this.getCurrentEngine();
    const memoryUsage = this.getMemoryUsage();
    
    return {
      initialized: this.initialized,
      hasUser: this.hasCurrentUser(),
      engineReady: !!engine,
      dataSize: this.getDataSize(),
      memoryUsage,
      locks: { ...this.operationLocks },
      errorCount: this.errorHistory.length,
      lastError: this.errorHistory[0] || null,
      backgroundCollection: !!this.dataCollectionInterval,
      simulation: {
        enabled: this.simulationEnabled,
        running: this.isSimulating
      }
    };
  }
}

const mlService = new MLService();

// Export singleton instance
export default mlService;