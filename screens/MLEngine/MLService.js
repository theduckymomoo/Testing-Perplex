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
      samplingMode: 'daily',
      hoursPerSample: 24,
      contextWindow: 3,
    };
  }

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
    
    if (!this.userEngines.has(userId)) {
      this.currentEngine = new MLEngine(userId, {
        minDataPoints: 7, // Days
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
  }

  getCurrentEngine() {
    if (!this.currentEngine || !this.currentUserId) {
      console.warn('⚠️ No user selected for ML engine. Call setCurrentUser first.');
      return null;
    }
    return this.currentEngine;
  }

  // FIXED: Single data collection method that creates BOTH dayPatterns AND hourly data
  async collectData(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) { 
      console.warn('⚠️ ML Engine not available for data collection');
      return; 
    }
    
    try {
      const deviceList = Array.isArray(appliances) ? appliances : [];
      
      // Always collect as day pattern - this fixes the main issue
      await engine.collectDayPattern(deviceList);
      
      const min = this.simulationEnabled ? 
        Math.max(3, engine.config.minDataPoints * 0.5) : // 3-4 days minimum
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

  // FIXED: Fast-forward creates dayPatterns correctly
  async fastForwardSimulation(days = 7, onProgress = null) {
    if (!this.simulationEnabled) return { success: false, error: 'Simulation not enabled' };
    if (!this.hasCurrentUser()) return { success: false, error: 'No user selected for simulation' };
    
    console.log(`⏩ ML Fast-forwarding ${days} days with full day patterns...`);
    
    let daysGenerated = 0;
    
    for (let day = 0; day < days; day++) {
      const dayPattern = this.generateFullDayPattern(day);
      
      // CRITICAL FIX: Use injectDayPattern instead of injectSimulationData
      await this.injectDayPattern(dayPattern);
      
      daysGenerated++;
      
      if (onProgress) {
        onProgress({
          day: day + 1,
          totalDays: days,
          dayPatterns: daysGenerated, // Show day patterns, not samples
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
      dayPatternsGenerated: daysGenerated, // FIXED: Return day patterns count
      simulatedDays: days, 
      status: this.getSimulationStatus() 
    };
  }

  generateFullDayPattern(dayOffset = 0) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - dayOffset);
    
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const dayType = isWeekend ? 'weekend' : 'weekday';
    
    const hourlySnapshots = []; // FIXED: Use correct property name
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
          hourlySnapshots[hour - 1] // Previous hour for context
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

    // FIXED: Return correct day pattern structure
    return {
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek: currentDate.getDay(),
      isWeekend,
      dayType,
      collectedAt: new Date().toISOString(),
      realData: false, // This is simulated
      hourlySnapshots, // FIXED: Use correct property name
      summary: {
        totalEnergyKwh: hourlySnapshots.reduce((sum, hour) => sum + hour.totalPower, 0) / 1000,
        peakHour: hourlySnapshots.reduce((max, hour, index) => 
          hour.totalPower > hourlySnapshots[max]?.totalPower ? index : max, 0),
        averagePower: hourlySnapshots.reduce((sum, hour) => sum + hour.totalPower, 0) / 24,
        activeDeviceHours: hourlySnapshots.reduce((sum, hour) => sum + hour.activeDeviceCount, 0),
      },
      dayEvents
    };
  }

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
      refrigerator: {
        probability: 1.0,
        reason: 'Essential appliance - always running'
      },
      
      router: {
        probability: 1.0,
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

  // CRITICAL FIX: Inject day patterns correctly without duplication
  async injectDayPattern(dayPattern) {
    const engine = this.getCurrentEngine();
    if (!engine || !dayPattern) return;
    
    try {
      // FIXED: Only store in dayPatterns, no duplication
      if (!engine.trainingData.dayPatterns) {
        engine.trainingData.dayPatterns = [];
      }
      
      engine.trainingData.dayPatterns.push(dayPattern);
      
      // Keep data manageable
      if (engine.trainingData.dayPatterns.length > 100) {
        engine.trainingData.dayPatterns = engine.trainingData.dayPatterns.slice(-50);
      }
      
      console.log(`📥 Injected day pattern for ${dayPattern.date} (${dayPattern.hourlySnapshots.length} hours)`);
      
      await engine.saveTrainingData();
      console.log(`📊 Total day patterns: ${engine.trainingData.dayPatterns.length}`);
    } catch (error) {
      console.error('Error injecting day pattern:', error);
    }
  }

  // FIXED: Get training progress based on days correctly
  getTrainingProgress() {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for training progress');
      return { 
        progress: 0, 
        status: 'not_initialized', 
        current: 0,
        required: 7,
        canTrain: false,
        userId: this.currentUserId,
        simulation: { enabled: this.simulationEnabled }
      };
    }
    
    // FIXED: Use ONLY dayPatterns for counting, no fallback math
    const currentDays = engine.trainingData.dayPatterns?.length || 0;
    const requiredDays = this.simulationEnabled ? 5 : 10;
      
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

  // FIXED: injectSimulationData now creates day patterns
  async injectSimulationData(simulationData) {
    const engine = this.getCurrentEngine();
    if (!engine || !simulationData) return;
    
    try {
      const { deviceUsage, userActions, plannedData } = simulationData;
      
      if (deviceUsage?.length) {
        // CRITICAL FIX: Group hourly samples into day patterns
        const dayGroups = this.groupSamplesByDay(deviceUsage);
        
        for (const [date, hourlySamples] of dayGroups) {
          if (hourlySamples.length === 24) { // Only complete days
            const dayPattern = this.createDayPatternFromSamples(hourlySamples, date);
            
            // Store in dayPatterns array (not deviceUsage)
            if (!engine.trainingData.dayPatterns) {
              engine.trainingData.dayPatterns = [];
            }
            engine.trainingData.dayPatterns.push(dayPattern);
          }
        }
        
        console.log(`📥 Created ${dayGroups.size} day patterns from simulation data`);
      }
      
      if (userActions?.length) {
        engine.trainingData.userActions.push(...userActions);
        console.log(`📥 Injected ${userActions.length} user actions`);
      }
      
      await engine.saveTrainingData();
      console.log(`📊 Total day patterns: ${engine.trainingData.dayPatterns?.length || 0}`);
    } catch (error) { 
      console.error('Error injecting simulation data:', error); 
    }
  }

  // NEW: Group hourly samples into days
  groupSamplesByDay(samples) {
    const dayGroups = new Map();
    
    samples.forEach(sample => {
      const date = sample.timestamp.split('T')[0]; // Get YYYY-MM-DD
      if (!dayGroups.has(date)) {
        dayGroups.set(date, []);
      }
      dayGroups.get(date).push(sample);
    });
    
    return dayGroups;
  }

  // NEW: Create day pattern from hourly samples
  createDayPatternFromSamples(hourlySamples, date) {
    // Sort by hour to ensure correct order
    const sortedSamples = hourlySamples.sort((a, b) => a.hour - b.hour);
    
    const dayPattern = {
      date: date,
      dayOfWeek: new Date(date).getDay(),
      isWeekend: [0, 6].includes(new Date(date).getDay()),
      collectedAt: new Date().toISOString(),
      realData: false, // This is simulated
      hourlySnapshots: sortedSamples,
      summary: {
        totalEnergyKwh: sortedSamples.reduce((sum, hour) => sum + hour.totalPower, 0) / 1000,
        peakHour: sortedSamples.reduce((max, hour, index) => 
          hour.totalPower > sortedSamples[max]?.totalPower ? index : max, 0),
        averagePower: sortedSamples.reduce((sum, hour) => sum + hour.totalPower, 0) / 24,
        activeDeviceHours: sortedSamples.reduce((sum, hour) => sum + hour.activeDeviceCount, 0),
      }
    };
    
    return dayPattern;
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
          accuracy: result.accuracy, 
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

  // Add missing getAllPredictions method
  async getAllPredictions(appliances, horizon = 24) {
    return await this.getPredictions(appliances, horizon);
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
        dayPatterns: 0, // FIXED: Add dayPatterns count
        dataSamples: 0,
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
        dayPatterns: 0,
        dataSamples: 0,
      };
    }
  }

  getEnergyForecast(appliances, hours = 12) {
    const engine = this.getCurrentEngine();
    if (!engine) {
      return { 
        success: false, 
        forecast: [], 
        totalExpectedEnergy: 0, 
        totalExpectedCost: 0 
      };
    }

    return engine.getEnergyForecast(appliances, hours);
  }

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

  // FIXED: Clear user data method
  async clearUserData() {
    const engine = this.getCurrentEngine();
    if (!engine) {
      return { success: false, error: 'ML Engine not available' };
    }
    
    try {
      console.log('🗑️ Clearing all ML training data...');
      
      this.stopBackgroundCollection();
      
      // FIXED: Clear both dayPatterns and deviceUsage
      engine.trainingData = {
        deviceUsage: [],
        userActions: [],
        contextData: [],
        costData: [],
        dayPatterns: [], // Make sure this is cleared
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
      this.initialized = false;
      
      await AsyncStorage.multiRemove([engine.storageKey, engine.dataKey, engine.settingsKey]);
      
      console.log('✅ All ML data cleared successfully');
      return { success: true, message: 'All training data cleared' };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error: error.message };
    }
  }
}

const mlService = new MLService();
export default mlService;
