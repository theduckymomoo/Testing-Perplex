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
      // NEW: Day-based sampling configuration
      samplingMode: 'daily', // 'hourly' or 'daily'
      hoursPerSample: 24, // Full day samples
      contextWindow: 3, // Hours of context around each sample
    };
  }

  // Set the current user and switch to their ML engine
  setCurrentUser(userId, supabase = null) {
    if (!userId) {
      console.warn('⚠️ Cannot set ML engine: No user ID provided');
      this.currentUserId = null;
      this.currentEngine = null;
      this.initialized = false;
      return;
    }

    if (this.currentUserId === userId && this.currentEngine) {
      console.log(`✅ Already using ML engine for user: ${userId}`);
      return;
    }

    console.log(`👤 Switching to user ML engine: ${userId}`);
    this.currentUserId = userId;
    
    // Get or create user's ML engine
    if (!this.userEngines.has(userId)) {
      this.currentEngine = new MLEngine(userId, {
        minDataPoints: 30,
        predictionHorizon: 24,
        retrainInterval: 3600000,
        confidenceThreshold: 0.7,
        samplingMode: 'daily', // Pass sampling mode to engine
      });
      
      // Set Supabase client for cloud sync
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
  }

  // Get current user's engine with safety check
  getCurrentEngine() {
    if (!this.currentEngine || !this.currentUserId) {
      console.warn('⚠️ No user selected for ML engine. Call setCurrentUser first.');
      return null;
    }
    return this.currentEngine;
  }

  // UPDATED: Day-based data collection
  async collectData(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) { 
      console.warn('⚠️ ML Engine not available for data collection');
      return; 
    }
    
    try {
      const deviceList = Array.isArray(appliances) ? appliances : [];
      
      // Collect full day pattern instead of single point
      await engine.collectDayPattern(deviceList);
      
      const min = this.simulationEnabled ? 
        Math.max(7, engine.config.minDataPoints * 0.3) : // Days instead of hours
        engine.config.minDataPoints;
        
      if (this.config.autoTrainEnabled && 
          engine.trainingData.dayPatterns.length >= min && 
          engine.shouldRetrain()) {
        console.log('🔄 Auto-retraining triggered');
        await this.trainModels();
      }
    } catch (error) { 
      console.error('Error collecting data:', error); 
    }
  }

  // UPDATED: Fast-forward simulation with day-based approach
  async fastForwardSimulation(days = 7, onProgress = null) {
    if (!this.simulationEnabled) return { success: false, error: 'Simulation not enabled' };
    if (!this.hasCurrentUser()) return { success: false, error: 'No user selected for simulation' };
    
    console.log(`⏩ ML Fast-forwarding ${days} days with full day patterns...`);
    
    let daysGenerated = 0;
    
    for (let day = 0; day < days; day++) {
      const dayPattern = this.generateFullDayPattern(day);
      
      await this.injectDayPattern(dayPattern);
      
      daysGenerated++;
      
      if (onProgress) {
        onProgress({
          day: day + 1,
          totalDays: days,
          samples: daysGenerated,
          progress: Math.round(((day + 1) / days) * 100)
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.currentEngine.trainingData.dayPatterns.length >= this.currentEngine.config.minDataPoints) {
      console.log('🎓 Auto-training with day patterns...');
      await this.trainModels();
    }
    
    return { 
      success: true, 
      samplesGenerated: daysGenerated, 
      simulatedDays: days, 
      status: this.getSimulationStatus() 
    };
  }

  // NEW: Generate full day pattern with realistic transitions
  generateFullDayPattern(dayOffset = 0) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - dayOffset);
    
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const dayType = isWeekend ? 'weekend' : 'weekday';
    
    // Generate full 24-hour pattern with context and transitions
    const hourlyData = [];
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
          hourlyData[hour - 1] // Previous hour for context
        );
        
        return {
          id: appliance.id,
          type: appliance.type,
          room: appliance.room,
          status: devicePattern.isActive ? 'on' : 'off',
          power: devicePattern.power,
          isActive: devicePattern.isActive,
          transitionReason: devicePattern.reason, // Why it changed
          context: devicePattern.context,
        };
      });

      const totalPower = devices
        .filter(device => device.isActive)
        .reduce((sum, device) => sum + device.power, 0);

      hourlyData.push({
        timestamp: timestamp.toISOString(),
        hour,
        dayOfWeek: currentDate.getDay(),
        isWeekend,
        devices,
        totalPower,
        activeDeviceCount: devices.filter(d => d.isActive).length,
        dayEvents: dayEvents.filter(event => event.hour === hour),
        context: {
          previousHourPower: hour > 0 ? hourlyData[hour - 1].totalPower : 0,
          powerTrend: this.calculatePowerTrend(hourlyData, hour),
          timeOfDay: this.getTimeOfDayContext(hour),
        }
      });
    }

    // Generate user actions based on device transitions
    const userActions = this.extractUserActionsFromDay(hourlyData, currentDate);
    
    return {
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek: currentDate.getDay(),
      isWeekend,
      dayType,
      hourlyData,
      userActions,
      dayEvents,
      summary: {
        totalEnergyKwh: hourlyData.reduce((sum, hour) => sum + hour.totalPower, 0) / 1000,
        peakHour: hourlyData.reduce((max, hour) => hour.totalPower > max.totalPower ? hour : max, hourlyData[0]),
        averagePower: hourlyData.reduce((sum, hour) => sum + hour.totalPower, 0) / 24,
        activeDeviceHours: hourlyData.reduce((sum, hour) => sum + hour.activeDeviceCount, 0),
      }
    };
  }

  // NEW: Generate realistic day events that affect device usage
  generateDayEvents(isWeekend) {
    const events = [];
    
    // Morning routine
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
    
    // Meal times
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
    
    // Work hours (if weekday)
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
    
    // Evening routine
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
    
    // Bedtime
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

  // NEW: Get realistic device state based on full day context
  getRealisticDeviceState(appliance, hour, isWeekend, dayEvents, previousHourData) {
    const basePattern = this.getDeviceHourlyProbability(appliance.type, hour, isWeekend);
    let probability = basePattern.probability;
    let reason = basePattern.reason;
    
    // Adjust based on day events
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
    
    // Consider previous hour state for continuity
    if (previousHourData) {
      const prevDevice = previousHourData.devices.find(d => d.id === appliance.id);
      if (prevDevice?.isActive) {
        // Device was on - more likely to stay on
        probability *= 1.3;
        reason += ' (continuation)';
      }
    }
    
    // Cap probability
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

  // NEW: Device probability patterns based on type and time
  getDeviceHourlyProbability(deviceType, hour, isWeekend) {
    const patterns = {
      refrigerator: {
        probability: 1.0, // Always on
        reason: 'Essential appliance - always running'
      },
      
      router: {
        probability: 1.0, // Always on
        reason: 'Network essential - always running'
      },
      
      light: {
        probability: this.getLightProbability(hour, isWeekend),
        reason: this.getLightReason(hour, isWeekend)
      },
      
      tv: {
        probability: this.getTVProbability(hour, isWeekend),
        reason: this.getTVReason(hour, isWeekend)
      },
      
      computer: {
        probability: this.getComputerProbability(hour, isWeekend),
        reason: this.getComputerReason(hour, isWeekend)
      },
      
      'air conditioner': {
        probability: this.getACProbability(hour, isWeekend),
        reason: this.getACReason(hour, isWeekend)
      },
      
      heater: {
        probability: this.getHeaterProbability(hour, isWeekend),
        reason: this.getHeaterReason(hour, isWeekend)
      },
      
      microwave: {
        probability: this.getMicrowaveProbability(hour, isWeekend),
        reason: this.getMicrowaveReason(hour, isWeekend)
      },
      
      kettle: {
        probability: this.getKettleProbability(hour, isWeekend),
        reason: this.getKettleReason(hour, isWeekend)
      },
      
      'washing machine': {
        probability: this.getWashingMachineProbability(hour, isWeekend),
        reason: this.getWashingMachineReason(hour, isWeekend)
      },
      
      default: {
        probability: this.getDefaultProbability(hour, isWeekend),
        reason: 'General usage pattern'
      }
    };
    
    return patterns[deviceType.toLowerCase()] || patterns.default;
  }

  // Device-specific probability functions
  getLightProbability(hour, isWeekend) {
    if (hour >= 22 || hour <= 6) return 0.8; // Night
    if (hour >= 7 && hour <= 9) return 0.6; // Morning
    if (hour >= 18 && hour <= 21) return 0.9; // Evening
    return 0.1; // Daytime
  }

  getLightReason(hour, isWeekend) {
    if (hour >= 22 || hour <= 6) return 'Night lighting for safety/comfort';
    if (hour >= 7 && hour <= 9) return 'Morning routine lighting';
    if (hour >= 18 && hour <= 21) return 'Evening activity lighting';
    return 'Minimal daytime lighting';
  }

  getTVProbability(hour, isWeekend) {
    if (isWeekend) {
      if (hour >= 10 && hour <= 14) return 0.5; // Weekend afternoon
      if (hour >= 19 && hour <= 23) return 0.8; // Weekend evening
      return 0.2;
    } else {
      if (hour >= 19 && hour <= 22) return 0.7; // Weekday evening
      if (hour >= 7 && hour <= 8) return 0.3; // Morning news
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
      if (hour >= 14 && hour <= 20) return 0.4; // Weekend usage
      return 0.1;
    } else {
      if (hour >= 8 && hour <= 17) return 0.8; // Work hours
      if (hour >= 19 && hour <= 21) return 0.3; // Evening personal use
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
    // Hot afternoon hours
    if (hour >= 12 && hour <= 18) return 0.6;
    // Night cooling
    if (hour >= 22 || hour <= 6) return 0.4;
    return 0.1;
  }

  getACReason(hour, isWeekend) {
    if (hour >= 12 && hour <= 18) return 'Hot afternoon - cooling needed';
    if (hour >= 22 || hour <= 6) return 'Night cooling for sleep comfort';
    return 'Minimal cooling needs';
  }

  getHeaterProbability(hour, isWeekend) {
    // Morning warmup
    if (hour >= 6 && hour <= 9) return 0.7;
    // Evening warmth
    if (hour >= 18 && hour <= 22) return 0.6;
    return 0.1;
  }

  getHeaterReason(hour, isWeekend) {
    if (hour >= 6 && hour <= 9) return 'Morning warmup for comfort';
    if (hour >= 18 && hour <= 22) return 'Evening warmth for relaxation';
    return 'Minimal heating needs';
  }

  getMicrowaveProbability(hour, isWeekend) {
    if ([7, 12, 18, 19].includes(hour)) return 0.6; // Meal times
    return 0.05;
  }

  getMicrowaveReason(hour, isWeekend) {
    if ([7, 12, 18, 19].includes(hour)) return 'Meal preparation time';
    return 'Occasional heating/reheating';
  }

  getKettleProbability(hour, isWeekend) {
    if ([7, 10, 15, 20].includes(hour)) return 0.5; // Tea/coffee times
    return 0.1;
  }

  getKettleReason(hour, isWeekend) {
    if ([7, 10, 15, 20].includes(hour)) return 'Hot beverage preparation';
    return 'Occasional hot drinks';
  }

  getWashingMachineProbability(hour, isWeekend) {
    if (isWeekend && hour >= 9 && hour <= 15) return 0.3; // Weekend laundry
    if (!isWeekend && hour >= 7 && hour <= 9) return 0.2; // Morning laundry
    return 0.02;
  }

  getWashingMachineReason(hour, isWeekend) {
    if (isWeekend && hour >= 9 && hour <= 15) return 'Weekend laundry time';
    if (!isWeekend && hour >= 7 && hour <= 9) return 'Morning laundry before work';
    return 'Occasional laundry';
  }

  getDefaultProbability(hour, isWeekend) {
    if (hour >= 18 && hour <= 22) return 0.4; // Evening usage
    if (hour >= 8 && hour <= 17) return 0.3; // Daytime usage
    return 0.1; // Night/early morning
  }

  // NEW: Calculate power trend for context
  calculatePowerTrend(hourlyData, currentHour) {
    if (currentHour < 2) return 'stable';
    
    const recentHours = hourlyData.slice(Math.max(0, currentHour - 3), currentHour);
    const powers = recentHours.map(h => h.totalPower);
    
    if (powers.length < 2) return 'stable';
    
    const trend = powers[powers.length - 1] - powers[0];
    if (trend > 100) return 'increasing';
    if (trend < -100) return 'decreasing';
    return 'stable';
  }

  // NEW: Get time of day context
  getTimeOfDayContext(hour) {
    if (hour >= 22 || hour <= 5) return 'night';
    if (hour >= 6 && hour <= 11) return 'morning';
    if (hour >= 12 && hour <= 17) return 'afternoon';
    if (hour >= 18 && hour <= 21) return 'evening';
    return 'unknown';
  }

  // NEW: Extract realistic user actions from day pattern
  extractUserActionsFromDay(hourlyData, date) {
    const actions = [];
    
    for (let hour = 1; hour < hourlyData.length; hour++) {
      const currentHour = hourlyData[hour];
      const previousHour = hourlyData[hour - 1];
      
      currentHour.devices.forEach(device => {
        const prevDevice = previousHour.devices.find(d => d.id === device.id);
        
        if (prevDevice && prevDevice.status !== device.status) {
          // Device changed state
          const actionTimestamp = new Date(currentHour.timestamp);
          actionTimestamp.setMinutes(Math.floor(Math.random() * 60));
          
          actions.push({
            timestamp: actionTimestamp.toISOString(),
            hour: currentHour.hour,
            dayOfWeek: currentHour.dayOfWeek,
            deviceId: device.id,
            deviceType: device.type,
            action: device.status === 'on' ? 'toggle_on' : 'toggle_off',
            context: {
              manual: true,
              dayBased: true,
              reason: device.transitionReason,
              timeOfDay: currentHour.context.timeOfDay,
              totalActiveDevices: currentHour.activeDeviceCount,
              totalPower: currentHour.totalPower,
              powerTrend: currentHour.context.powerTrend,
              dayEvents: currentHour.dayEvents.map(e => e.type),
            }
          });
        }
      });
    }
    
    return actions;
  }

  // NEW: Inject full day pattern
  async injectDayPattern(dayPattern) {
    const engine = this.getCurrentEngine();
    if (!engine || !dayPattern) return;
    
    try {
      // Store day pattern in new format
      if (!engine.trainingData.dayPatterns) {
        engine.trainingData.dayPatterns = [];
      }
      
      engine.trainingData.dayPatterns.push(dayPattern);
      
      // Also maintain backward compatibility with hourly data
      engine.trainingData.deviceUsage.push(...dayPattern.hourlyData);
      engine.trainingData.userActions.push(...dayPattern.userActions);
      
      console.log(`📥 Injected full day pattern for ${dayPattern.date} (${dayPattern.hourlyData.length} hours)`);
      
      await engine.saveTrainingData();
      console.log(`📊 Total day patterns: ${engine.trainingData.dayPatterns.length}`);
    } catch (error) {
      console.error('Error injecting day pattern:', error);
    }
  }

  // UPDATED: Get training progress based on days
  getTrainingProgress() {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for training progress');
      return { 
        progress: 0, 
        status: 'not_initialized', 
        current: 0,
        required: 7, // Days instead of samples
        canTrain: false,
        userId: this.currentUserId,
        simulation: { enabled: this.simulationEnabled }
      };
    }
    
    const currentDays = engine.trainingData.dayPatterns?.length || Math.floor(engine.trainingData.deviceUsage.length / 24);
    const requiredDays = this.simulationEnabled ? 7 : 14; // Fewer days needed
      
    const progress = Math.min(100, (currentDays / requiredDays) * 100);
    
    return {
      progress: Math.round(progress),
      current: currentDays,
      required: requiredDays,
      status: progress >= 100 ? 'ready' : 'collecting',
      canTrain: currentDays >= requiredDays,
      userId: this.currentUserId,
      samplingMode: 'daily',
      simulation: {
        enabled: this.simulationEnabled,
        isSimulating: this.isSimulating,
        simulatedDays: currentDays,
        totalSamples: engine.trainingData.deviceUsage.length,
      },
    };
  }

  // UPDATED: Clear user data method
  async clearUserData() {
    const engine = this.getCurrentEngine();
    if (!engine) {
      return { success: false, error: 'ML Engine not available' };
    }
    
    try {
      console.log('🗑️ Clearing all ML training data...');
      
      // Stop background collection to prevent immediate repopulation
      this.stopBackgroundCollection();
      
      // Clear engine data including new day patterns
      engine.trainingData = {
        deviceUsage: [],
        userActions: [],
        contextData: [],
        costData: [],
        dayPatterns: [], // NEW: Clear day patterns
      };
      
      // Reset models
      engine.models = {
        usagePatterns: null,
        userBehavior: null,
        costOptimization: null,
        anomalyDetection: null,
        dayPatterns: null, // NEW: Clear day pattern models
      };
      
      // Reset metrics
      engine.metrics = {
        accuracy: 0,
        lastTrainedAt: null,
        predictionsMade: 0,
        correctPredictions: 0,
        userId: this.currentUserId,
      };
      
      // Mark engine as uninitialized so it won't produce predictions
      engine.initialized = false;
      this.initialized = false;
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([engine.storageKey, engine.dataKey, engine.settingsKey]);
      
      console.log('✅ All ML data cleared successfully');
      return { success: true, message: 'All training data cleared' };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error: error.message };
    }
  }

  // Rest of existing methods remain the same...
  async initialize(userId = null, supabase = null) {
    if (userId) {
      this.setCurrentUser(userId, supabase);
    }
    
    if (!this.currentEngine) {
      console.warn('⚠️ ML Engine not initialized: No user selected');
      return { success: false, error: 'No user selected for ML engine' };
    }

    if (this.initialized) {
      console.log('✅ ML Service already initialized');
      return { success: true };
    }

    try {
      console.log(`🚀 Starting ML Service for user: ${this.currentUserId}...`);

      const result = await this.currentEngine.initialize();
      if (result.success) {
        this.initialized = true;
        if (this.config.enableBackgroundCollection) this.startBackgroundCollection();
        console.log('✅ ML Service ready with user-specific engine');
        return { success: true };
      }
      return result;
    } catch (error) {
      console.error('❌ ML Service initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async trainModels() {
    const engine = this.getCurrentEngine();
    if (!engine) return { success: false, error: 'ML Engine not available' };
    
    try {
      console.log('🎓 Starting ML model training with day patterns...');
      const result = await engine.trainModels();
      if (result.success) {
        console.log('✅ ML models trained successfully');
        await engine.saveModels();
        return { 
          success: true, 
          trainingAccuracy: result.accuracy, 
          modelInfo: result,
          trainingTime: result.trainingTime || 0
        };
      }
      console.error('❌ ML model training failed:', result.error);
      return result;
    } catch (error) {
      console.error('Error training models:', error);
      return { success: false, error: error.message };
    }
  }

  async getPredictions(appliances, horizon = 24) {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for predictions');
      return { 
        success: false, 
        error: 'ML Engine not available',
        predictions: [],
        confidence: 0,
        horizon 
      };
    }
    
    try {
      const deviceList = Array.isArray(appliances) ? appliances : [];
      const predictions = engine.getPredictions(deviceList);
      const confidence = engine.getPredictionConfidence ? 
        engine.getPredictionConfidence() : 0;
      
      return { 
        success: true, 
        predictions, 
        confidence, 
        horizon 
      };
    } catch (error) {
      console.error('Error getting predictions:', error);
      return { 
        success: false, 
        error: error.message,
        predictions: [],
        confidence: 0,
        horizon 
      };
    }
  }

  getRecommendations(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for recommendations');
      return [];
    }
    const deviceList = Array.isArray(appliances) ? appliances : [];
    return engine.getRecommendations(deviceList);
  }

  detectAnomalies(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for anomaly detection');
      return { hasAnomaly: false, anomalies: [] };
    }
    const deviceList = Array.isArray(appliances) ? appliances : [];
    return engine.detectAnomalies(deviceList);
  }

  getMLInsights(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for insights');
      return { 
        ready: false, 
        message: 'ML Service not available', 
        dataProgress: 0, 
        simulation: this.getSimulationStatus(),
        userId: this.currentUserId,
        predictions: [],
        recommendations: [],
        anomalies: { hasAnomaly: false, anomalies: [] },
      };
    }
    
    try {
      const deviceList = Array.isArray(appliances) ? appliances : (Array.isArray(this.currentAppliances) ? this.currentAppliances : []);
      const insights = engine.getMLInsights(deviceList);
      return { ...insights, simulation: this.getSimulationStatus() };
    } catch (error) {
      console.error('Error getting insights:', error);
      return { 
        ready: false, 
        error: error.message, 
        simulation: this.getSimulationStatus(),
        userId: this.currentUserId,
        predictions: [],
        recommendations: [],
        anomalies: { hasAnomaly: false, anomalies: [] },
      };
    }
  }

  // Check if ML service is ready for a specific user
  isReadyForUser(userId) {
    return this.currentUserId === userId && this.initialized && this.currentEngine;
  }

  getCurrentUserId() {
    return this.currentUserId;
  }

  hasCurrentUser() {
    return !!this.currentUserId && !!this.currentEngine;
  }

  initializeSimulation(appliances) {
    if (!this.simulationEnabled) return { success: false, error: 'Simulation not enabled' };
    
    const engine = this.getCurrentEngine();
    if (!engine) return { success: false, error: 'ML Engine not available' };
    
    this.currentAppliances = Array.isArray(appliances) ? appliances : [];
    console.log('🎮 Day-based simulation initialized for ML training');
    return { 
      success: true, 
      simulatedAppliances: this.currentAppliances, 
      status: { enabled: true, isSimulating: false } 
    };
  }

  getSimulationStatus() {
    const engine = this.getCurrentEngine();
    const days = engine?.trainingData?.dayPatterns?.length || 0;
    const samples = engine?.trainingData?.deviceUsage?.length || 0;
    
    return { 
      enabled: this.simulationEnabled, 
      isSimulating: this.isSimulating,
      simulatedDays: days,
      simulatedSamples: samples,
      samplingMode: 'daily',
      userId: this.currentUserId
    };
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating = false;
    return { success: true, status: this.getSimulationStatus() };
  }

  resetSimulation() {
    this.stopSimulation();
    return { success: true, status: this.getSimulationStatus() };
  }

  setSimulationEnabled(enabled) {
    this.simulationEnabled = enabled;
    if (!enabled) this.stopSimulation();
    return { success: true, simulationEnabled: this.simulationEnabled };
  }

  async forceCollection(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) { 
      console.warn('⚠️ ML Engine not available for force collection');
      return; 
    }
    try {
      const deviceList = Array.isArray(appliances) ? appliances : [];
      await engine.collectDayPattern(deviceList);
      console.log('📊 Force collected current day pattern');
    } catch (error) { 
      console.error('Error in force collection:', error); 
    }
  }

  async injectSimulationData(simulationData) {
    const engine = this.getCurrentEngine();
    if (!engine || !simulationData) return;
    
    try {
      const { deviceUsage, userActions } = simulationData;
      if (deviceUsage?.length) {
        const newData = deviceUsage.filter(sim => 
          !engine.trainingData.deviceUsage.some(ex => 
            ex.timestamp === sim.timestamp && 
            JSON.stringify(ex.devices) === JSON.stringify(sim.devices)
          )
        );
        engine.trainingData.deviceUsage.push(...newData);
        console.log(`📥 Injected ${newData.length} simulated device-usage samples`);
      }
      if (userActions?.length) {
        const newActions = userActions.filter(sim => 
          !engine.trainingData.userActions.some(ex => 
            ex.timestamp === sim.timestamp && 
            ex.deviceId === sim.deviceId && 
            ex.action === sim.action
          )
        );
        engine.trainingData.userActions.push(...newActions);
        console.log(`📥 Injected ${newActions.length} simulated user-actions`);
      }
      await engine.saveTrainingData();
      console.log(`📊 Total training data: ${engine.trainingData.deviceUsage.length} samples`);
    } catch (error) { 
      console.error('Error injecting simulation data:', error); 
    }
  }

  updateAppliances(appliances) {
    this.currentAppliances = Array.isArray(appliances) ? appliances : [];
    if (this.simulationEnabled && this.currentAppliances.length > 0) {
      this.initializeSimulation(this.currentAppliances);
    }
    console.log(`📝 Updated appliances list: ${this.currentAppliances.length} devices`);
  }

  startBackgroundCollection() {
    if (this.dataCollectionInterval) return;
    this.dataCollectionInterval = setInterval(() => {
      if (this.currentAppliances.length > 0 && this.hasCurrentUser()) {
        this.collectData(this.currentAppliances);
      }
    }, this.config.autoCollectInterval);
    console.log(`🔄 Background day pattern collection started (${this.config.autoCollectInterval}ms interval)`);
  }

  stopBackgroundCollection() {
    if (this.dataCollectionInterval) {
      clearInterval(this.dataCollectionInterval);
      this.dataCollectionInterval = null;
      console.log('🛑 Background data collection stopped');
    }
  }
}

const mlService = new MLService();
export default mlService;
