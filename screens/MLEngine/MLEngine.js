// MLEngine.js - User-Specific Machine Learning Engine for Smart Home Energy Management
// Enhanced with day-based sampling and realistic pattern recognition with turn on/off predictions

import AsyncStorage from '@react-native-async-storage/async-storage';

class MLEngine {
  constructor(userId, config = {}) {
    this.userId = userId;
    this.modelVersion = '3.2.0'; // Updated version for enhanced timing predictions and fixed data paths
    
    // User-specific storage keys
    this.storageKey = `@ml_models_v3_${userId}`;
    this.dataKey = `@ml_training_data_v3_${userId}`;
    this.settingsKey = `@ml_settings_v3_${userId}`;
    
    // Configuration
    this.config = {
      minDataPoints: config.minDataPoints || 5, // Days instead of samples
      predictionHorizon: config.predictionHorizon || 24,
      retrainInterval: config.retrainInterval || 86400000,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      samplingMode: config.samplingMode || 'daily',
      contextWindow: config.contextWindow || 3,
      ...config,
    };
    
    // Model storage
    this.models = {
      usagePatterns: null,
      userBehavior: null,
      costOptimization: null,
      anomalyDetection: null,
      dayPatterns: null, // Primary model for day-based predictions
    };
    
    // Enhanced training data structure
    this.trainingData = {
      deviceUsage: [], // Backward compatibility only
      userActions: [],
      contextData: [],
      costData: [],
      dayPatterns: [], // PRIMARY: Full day patterns - this is the main data store
    };
    
    // Performance metrics
    this.metrics = {
      accuracy: 0,
      lastTrainedAt: null,
      predictionsMade: 0,
      correctPredictions: 0,
      userId: userId,
      dayPatternsTrained: 0,
      averageDayAccuracy: 0,
    };
    
    this.initialized = false;
    this.supabase = null;
    this.cloudSyncEnabled = false;
  }

  // Set Supabase client for cloud storage
  setSupabaseClient(supabase) {
    this.supabase = supabase;
    this.cloudSyncEnabled = !!supabase;
  }

  async initialize() {
    try {
      console.log(`🧠 Initializing day-based ML Engine for user: ${this.userId}...`);
      
      // Try to load from cloud first, fallback to local storage
      if (this.cloudSyncEnabled) {
        await this.loadFromCloud();
      } else {
        await this.loadFromLocalStorage();
      }
      
      if (this.shouldRetrain()) {
        console.log('🔄 Retraining models with day patterns...');
        await this.trainModels();
      }
      
      this.initialized = true;
      console.log('✅ Day-based ML Engine initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ ML Engine initialization failed:', error);
      // Fallback to local storage only
      try {
        await this.loadFromLocalStorage();
        this.initialized = true;
        return { success: true };
      } catch (fallbackError) {
        return { success: false, error: error.message };
      }
    }
  }

  async loadFromLocalStorage() {
    try {
      const [storedModels, storedData, storedSettings] = await Promise.all([
        AsyncStorage.getItem(this.storageKey),
        AsyncStorage.getItem(this.dataKey),
        AsyncStorage.getItem(this.settingsKey),
      ]);
      
      if (storedModels) {
        const data = JSON.parse(storedModels);
        this.models = data.models;
        this.metrics = data.metrics;
        console.log(`📦 Loaded local models (accuracy: ${(this.metrics.accuracy * 100).toFixed(1)}%)`);
      }
      
      if (storedData) {
        const data = JSON.parse(storedData);
        this.trainingData = {
          ...this.trainingData,
          ...data,
          dayPatterns: data.dayPatterns || [], // Ensure dayPatterns exist
        };
        console.log(`📊 Loaded ${this.trainingData.dayPatterns.length} day patterns, ${this.trainingData.deviceUsage.length} hourly samples`);
      }
      
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        this.config = { ...this.config, ...settings };
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
      throw error;
    }
  }

  async loadFromCloud() {
    if (!this.supabase || !this.cloudSyncEnabled) {
      throw new Error('Cloud sync not enabled');
    }

    try {
      // Load models from cloud
      const { data: cloudModels, error: modelsError } = await this.supabase
        .from('ml_models')
        .select('*')
        .eq('user_id', this.userId);

      if (modelsError) throw modelsError;

      if (cloudModels && cloudModels.length > 0) {
        cloudModels.forEach(model => {
          this.models[model.model_type] = model.model_data;
        });
        
        const latestModel = cloudModels.reduce((latest, current) => 
          new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
        );
        
        this.metrics.accuracy = latestModel.accuracy || 0;
        this.metrics.lastTrainedAt = latestModel.last_trained_at;
        console.log(`☁️ Loaded cloud models (accuracy: ${(this.metrics.accuracy * 100).toFixed(1)}%)`);
      }

      // Load training data from cloud
      const { data: cloudData, error: dataError } = await this.supabase
        .from('ml_training_data')
        .select('*')
        .eq('user_id', this.userId);

      if (dataError) throw dataError;

      if (cloudData && cloudData.length > 0) {
        cloudData.forEach(data => {
          if (data.data_type === 'dayPatterns') {
            this.trainingData.dayPatterns = data.data_points || [];
          } else {
            this.trainingData[data.data_type] = data.data_points || [];
          }
        });
        console.log(`☁️ Loaded ${this.trainingData.dayPatterns.length} day patterns from cloud`);
      }

      // Load settings from cloud
      const { data: cloudSettings, error: settingsError } = await this.supabase
        .from('ml_engine_settings')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (!settingsError && cloudSettings) {
        this.config = {
          ...this.config,
          minDataPoints: cloudSettings.min_data_points,
          predictionHorizon: cloudSettings.prediction_horizon,
          retrainInterval: cloudSettings.retrain_interval,
          confidenceThreshold: cloudSettings.confidence_threshold,
          samplingMode: cloudSettings.sampling_mode || 'daily',
        };
      }

    } catch (error) {
      console.error('Error loading from cloud:', error);
      throw error;
    }
  }

  async saveToLocalStorage() {
    try {
      const modelsData = {
        version: this.modelVersion,
        models: this.models,
        metrics: this.metrics,
        savedAt: new Date().toISOString(),
        userId: this.userId,
      };

      await Promise.all([
        AsyncStorage.setItem(this.storageKey, JSON.stringify(modelsData)),
        AsyncStorage.setItem(this.dataKey, JSON.stringify(this.trainingData)),
        AsyncStorage.setItem(this.settingsKey, JSON.stringify(this.config)),
      ]);
      
      console.log('💾 Day patterns and models saved to local storage');
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  async saveToCloud() {
    if (!this.supabase || !this.cloudSyncEnabled) {
      return;
    }

    try {
      // Save models to cloud
      const modelPromises = Object.entries(this.models).map(([modelType, modelData]) => {
        if (!modelData) return Promise.resolve();
        
        return this.supabase
          .from('ml_models')
          .upsert({
            user_id: this.userId,
            model_type: modelType,
            model_data: modelData,
            model_version: this.modelVersion,
            accuracy: this.metrics.accuracy,
            last_trained_at: this.metrics.lastTrainedAt,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,model_type'
          });
      });

      // Save training data to cloud (including day patterns)
      const dataPromises = Object.entries(this.trainingData).map(([dataType, dataPoints]) => {
        return this.supabase
          .from('ml_training_data')
          .upsert({
            user_id: this.userId,
            data_type: dataType,
            data_points: dataPoints,
            data_count: dataPoints.length,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,data_type'
          });
      });

      await Promise.all([...modelPromises, ...dataPromises]);
      console.log('☁️ Day patterns synced to cloud');
    } catch (error) {
      console.error('Error saving to cloud:', error);
    }
  }

  async saveModels() {
    await Promise.all([
      this.saveToLocalStorage(),
      this.saveToCloud(),
    ]);
  }

  async saveTrainingData() {
    await Promise.all([
      AsyncStorage.setItem(this.dataKey, JSON.stringify(this.trainingData)),
      this.saveTrainingDataToCloud(),
    ]);
  }

  async saveTrainingDataToCloud() {
    if (!this.supabase || !this.cloudSyncEnabled) return;

    try {
      const promises = Object.entries(this.trainingData).map(([dataType, dataPoints]) => {
        return this.supabase
          .from('ml_training_data')
          .upsert({
            user_id: this.userId,
            data_type: dataType,
            data_points: dataPoints,
            data_count: dataPoints.length,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,data_type'
          });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving training data to cloud:', error);
    }
  }

  // ENHANCED: Collect full day pattern instead of single point
  async collectDayPattern(appliances) {
    try {
      console.log('📅 Collecting full day pattern...');
      
      const currentDate = new Date();
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      // Generate full day based on current time and device states
      const dayPattern = {
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: currentDate.getDay(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        collectedAt: currentDate.toISOString(),
        realData: true, // Flag to distinguish from simulated data
        hourlySnapshots: [],
        devicePatterns: {},
        summary: {
          totalEnergyKwh: 0,
          peakHour: null,
          averagePower: 0,
          activeDeviceHours: 0,
        }
      };

      // Collect current state and extrapolate day pattern
      let totalDayEnergy = 0;
      let peakPower = 0;
      let peakHour = 0;

      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(dayStart);
        timestamp.setHours(hour);
        
        const hourData = {
          timestamp: timestamp.toISOString(),
          hour,
          dayOfWeek: currentDate.getDay(),
          isWeekend: dayPattern.isWeekend,
          devices: appliances.map(device => {
            // Use current state if it's the current hour, otherwise predict based on patterns
            const isCurrentHour = hour === currentDate.getHours();
            const isActive = isCurrentHour ? 
              device.status === 'on' : 
              this.predictDeviceStateForHour(device, hour, dayPattern.isWeekend);
            
            const power = isActive ? (device.current_power || device.normal_usage || 0) : 0;
            
            return {
              id: device.id,
              type: device.type,
              room: device.room,
              status: isActive ? 'on' : 'off',
              power: power,
              isActive: isActive,
              isCurrentState: isCurrentHour,
            };
          }),
        };
        
        const hourTotalPower = hourData.devices
          .filter(device => device.isActive)
          .reduce((sum, device) => sum + device.power, 0);
        
        hourData.totalPower = hourTotalPower;
        hourData.activeDeviceCount = hourData.devices.filter(d => d.isActive).length;
        
        totalDayEnergy += hourTotalPower;
        if (hourTotalPower > peakPower) {
          peakPower = hourTotalPower;
          peakHour = hour;
        }
        
        dayPattern.hourlySnapshots.push(hourData);
      }

      // Calculate day summary
      dayPattern.summary = {
        totalEnergyKwh: totalDayEnergy / 1000,
        peakHour: peakHour,
        peakPower: peakPower,
        averagePower: totalDayEnergy / 24,
        activeDeviceHours: dayPattern.hourlySnapshots.reduce((sum, hour) => sum + hour.activeDeviceCount, 0),
      };

      // Store day pattern
      if (!this.trainingData.dayPatterns) {
        this.trainingData.dayPatterns = [];
      }
      
      this.trainingData.dayPatterns.push(dayPattern);
      
      // Keep data manageable
      if (this.trainingData.dayPatterns.length > 100) {
        this.trainingData.dayPatterns = this.trainingData.dayPatterns.slice(-50);
      }

      console.log(`📊 Collected full day pattern: ${dayPattern.summary.totalEnergyKwh.toFixed(2)} kWh`);
      
      return { success: true, dayPatterns: this.trainingData.dayPatterns.length };
    } catch (error) {
      console.error('Error collecting day pattern:', error);
      return { success: false, error: error.message };
    }
  }

  // Predict device state for specific hour based on existing patterns
  predictDeviceStateForHour(device, hour, isWeekend) {
    // Simple prediction based on device type and hour
    const patterns = {
      refrigerator: () => true,
      router: () => true,
      light: () => (hour >= 18 && hour <= 23) || (hour >= 6 && hour <= 8),
      tv: () => isWeekend ? 
        ((hour >= 10 && hour <= 14) || (hour >= 19 && hour <= 23)) :
        (hour >= 19 && hour <= 22),
      computer: () => isWeekend ?
        (hour >= 14 && hour <= 18) :
        (hour >= 8 && hour <= 17),
      'air conditioner': () => (hour >= 12 && hour <= 18) || (hour >= 22 && hour <= 6),
      heater: () => (hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 22),
      microwave: () => [7, 12, 18].includes(hour),
      kettle: () => [7, 10, 15, 20].includes(hour),
      'washing machine': () => isWeekend ? (hour >= 9 && hour <= 12) : hour === 8,
      default: () => (hour >= 18 && hour <= 22) && Math.random() < 0.4,
    };
    
    const pattern = patterns[device.type.toLowerCase()] || patterns.default;
    return pattern();
  }

  // Collect device data for training (backward compatibility)
  async collectDeviceData(appliances) {
    try {
      const timestamp = new Date().toISOString();
      const hour = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Create device usage snapshot
      const deviceUsage = {
        timestamp,
        hour,
        dayOfWeek,
        isWeekend,
        devices: appliances.map(device => ({
          id: device.id,
          type: device.type,
          room: device.room,
          status: device.status,
          power: device.current_power || device.normal_usage,
          isActive: device.status === 'on',
        })),
        totalPower: appliances
          .filter(device => device.status === 'on')
          .reduce((sum, device) => sum + (device.current_power || device.normal_usage), 0),
        activeDeviceCount: appliances.filter(device => device.status === 'on').length,
      };

      // Add to training data
      this.trainingData.deviceUsage.push(deviceUsage);

      // Keep data manageable
      if (this.trainingData.deviceUsage.length > 10000) {
        this.trainingData.deviceUsage = this.trainingData.deviceUsage.slice(-5000);
      }

      console.log(`📊 Collected data: ${this.trainingData.deviceUsage.length} samples`);
      
      return { success: true, samples: this.trainingData.deviceUsage.length };
    } catch (error) {
      console.error('Error collecting device data:', error);
      return { success: false, error: error.message };
    }
  }

  // Record user actions for behavior learning
  async recordUserAction(deviceId, action, context = {}) {
    try {
      const userAction = {
        timestamp: new Date().toISOString(),
        deviceId,
        action,
        hour: context.hour || new Date().getHours(),
        dayOfWeek: context.dayOfWeek || new Date().getDay(),
        context: {
          manual: context.manual || false,
          totalActiveDevices: context.totalActiveDevices,
          totalPower: context.totalPower,
          dayBased: context.dayBased || false,
          ...context
        }
      };

      this.trainingData.userActions.push(userAction);

      // Keep data manageable
      if (this.trainingData.userActions.length > 5000) {
        this.trainingData.userActions = this.trainingData.userActions.slice(-2500);
      }

      console.log(`📝 Recorded user action: ${action} for device ${deviceId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error recording user action:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if models should be retrained
  shouldRetrain() {
    if (!this.metrics.lastTrainedAt) {
      return true;
    }
    
    const lastTrained = new Date(this.metrics.lastTrainedAt);
    const now = new Date();
    const hoursSinceLastTrain = (now - lastTrained) / (1000 * 60 * 60);
    
    const dayPatterns = this.trainingData.dayPatterns?.length || 0;
    
    return hoursSinceLastTrain >= (this.config.retrainInterval / (1000 * 60 * 60)) ||
           dayPatterns >= this.config.minDataPoints;
  }

  // ENHANCED: Train models with day-based patterns
  async trainModels() {
    try {
      console.log('🎓 Starting day-based model training...');
      
      const dayPatterns = this.trainingData.dayPatterns?.length || 0;
      const hourlyData = this.trainingData.deviceUsage.length;
      
      if (dayPatterns < this.config.minDataPoints && hourlyData < this.config.minDataPoints * 24) {
        return { 
          success: false, 
          error: `Not enough data. Have ${dayPatterns} day patterns, need ${this.config.minDataPoints}` 
        };
      }

      const startTime = Date.now();

      // Process day patterns for better insights
      const dayInsights = this.analyzeDayPatterns();
      const patterns = this.analyzeUsagePatterns();
      const userBehavior = this.analyzeUserBehavior();
      const costPatterns = this.analyzeCostPatterns();
      
      // Build enhanced models from day-based data
      this.models.dayPatterns = {
        version: this.modelVersion,
        trainedAt: new Date().toISOString(),
        dayPatternsCount: dayPatterns,
        weekdayPatterns: dayInsights.weekdayPatterns,
        weekendPatterns: dayInsights.weekendPatterns,
        dailyEnergyProfiles: dayInsights.dailyEnergyProfiles,
        commonDayEvents: dayInsights.commonDayEvents,
        deviceTransitions: dayInsights.deviceTransitions,
      };

      this.models.usagePatterns = {
        version: this.modelVersion,
        trainedAt: new Date().toISOString(),
        dataPoints: this.trainingData.deviceUsage.length,
        dayPatternsUsed: dayPatterns,
        patterns: patterns.devicePatterns,
        hourlyPatterns: patterns.hourlyPatterns,
        dailyPatterns: patterns.dailyPatterns,
        peakHours: patterns.peakHours,
        deviceCorrelations: patterns.deviceCorrelations,
      };

      this.models.userBehavior = {
        version: this.modelVersion,
        trainedAt: new Date().toISOString(),
        actionPatterns: userBehavior.actionPatterns,
        preferredHours: userBehavior.preferredHours,
        automationOpportunities: userBehavior.automationOpportunities,
        dailyRoutines: dayInsights.dailyRoutines,
      };

      this.models.costOptimization = {
        version: this.modelVersion,
        trainedAt: new Date().toISOString(),
        costPatterns: costPatterns.hourlyCosts,
        savingsOpportunities: costPatterns.savingsOpportunities,
        optimalSchedules: costPatterns.optimalSchedules,
        dailyCostPatterns: dayInsights.dailyCostPatterns,
      };

      this.models.anomalyDetection = {
        version: this.modelVersion,
        trainedAt: new Date().toISOString(),
        normalRanges: this.calculateNormalRanges(),
        anomalyThresholds: this.calculateAnomalyThresholds(),
        dailyNormalRanges: this.calculateDailyNormalRanges(),
      };

      // FIXED: Calculate enhanced accuracy based on day patterns
      const accuracy = this.calculateDayBasedAccuracy(dayInsights, patterns);
      
      // Update metrics
      this.metrics.accuracy = accuracy;
      this.metrics.lastTrainedAt = new Date().toISOString();
      this.metrics.trainingTime = Date.now() - startTime;
      this.metrics.dayPatternsTrained = dayPatterns;
      this.metrics.averageDayAccuracy = dayInsights.averageAccuracy || 0;

      console.log(`✅ Day-based models trained with ${dayPatterns} day patterns + ${hourlyData} hourly samples (accuracy: ${(accuracy * 100).toFixed(1)}%)`);
      
      return { 
        success: true, 
        accuracy: accuracy,
        trainingTime: this.metrics.trainingTime,
        dayPatternsTrained: dayPatterns,
        patternsDiscovered: Object.keys(patterns.devicePatterns).length,
        peakHours: patterns.peakHours,
        dailyRoutines: dayInsights.dailyRoutines?.length || 0,
      };
    } catch (error) {
      console.error('Error training models:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced getPredictions with detailed turn on/off timing
  getPredictions(appliances, horizon = 24) {
    const deviceList = Array.isArray(appliances) ? appliances : [];
    
    // If engine not ready, return empty predictions
    if (!this.initialized || (!this.models?.usagePatterns && !this.models?.dayPatterns)) {
      return deviceList.map(device => ({
        deviceId: device.id,
        deviceName: device.name,
        prediction: {
          willBeActive: false,
          probability: 0,
          expectedPower: 0,
          confidence: 0,
          dailySchedule: [],
          nextStateChange: null,
        },
        timeHorizon: horizon,
        timestamp: new Date().toISOString(),
      }));
    }

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;
    
    // Use day patterns if available, fallback to hourly patterns
    const dayModel = this.models.dayPatterns;
    const hourlyModel = this.models.usagePatterns;
    
    const predictions = deviceList.map(device => {
      let baseProbability = 0.3;
      let confidence = 0.1;
      
      // Generate detailed daily schedule
      const dailySchedule = this.generateDailySchedule(device, isWeekend);
      const nextStateChange = this.findNextStateChange(device, currentHour, dailySchedule);
      
      if (dayModel) {
        // Use day-based prediction
        const dayType = isWeekend ? 'weekendPatterns' : 'weekdayPatterns';
        const dayPattern = dayModel[dayType];
        
        if (dayPattern) {
          baseProbability = this.getDayBasedProbability(device, currentHour, dayPattern);
          confidence = Math.min(0.9, this.metrics.averageDayAccuracy || 0.5);
        }
      } else if (hourlyModel && hourlyModel.patterns) {
        // Fallback to hourly prediction
        const devicePattern = hourlyModel.patterns[device.id];
        
        if (devicePattern) {
          const weekday = Array.isArray(devicePattern.weekdayProbabilities) ? devicePattern.weekdayProbabilities : Array(24).fill(0);
          const weekend = Array.isArray(devicePattern.weekendProbabilities) ? devicePattern.weekendProbabilities : Array(24).fill(0);
          
          baseProbability = isWeekend ? (weekend[currentHour] ?? 0) : (weekday[currentHour] ?? 0);
          confidence = Math.min(0.8, this.metrics.accuracy);
        }
      }
      
      const adjustedProbability = Math.max(0, Math.min(1, baseProbability));
      const willBeActive = adjustedProbability > 0.5;

      return {
        deviceId: device.id,
        deviceName: device.name,
        prediction: {
          willBeActive,
          probability: Math.round(adjustedProbability * 100),
          expectedPower: willBeActive ? (device.current_power || device.normal_usage || 0) : 0,
          confidence: confidence,
          basedOnDays: this.trainingData.dayPatterns?.length || 0,
          predictionMethod: dayModel ? 'day_based' : 'hourly_fallback',
          dailySchedule: dailySchedule,
          nextStateChange: nextStateChange,
          typicalUsageHours: this.getTypicalUsageHours(device, isWeekend),
          energyImpact: this.calculateEnergyImpact(device, dailySchedule),
        },
        timeHorizon: horizon,
        timestamp: new Date().toISOString(),
      };
    });

    this.metrics.predictionsMade += predictions.length;
    return predictions;
  }

  // Generate detailed daily schedule for device
  generateDailySchedule(device, isWeekend) {
    const schedule = [];
    const deviceType = device.type.toLowerCase();
    
    // Get device-specific patterns based on historical data
    const devicePatterns = this.getDevicePatternsByType(deviceType, isWeekend);
    
    for (let hour = 0; hour < 24; hour++) {
      const probability = this.getHourlyProbability(device, hour, isWeekend);
      const isActive = probability > 0.5;
      
      const hourData = {
        hour: hour,
        timeLabel: `${hour.toString().padStart(2, '0')}:00`,
        isActive: isActive,
        probability: probability,
        expectedPower: isActive ? (device.normal_usage || 0) : 0,
        confidence: this.calculateHourlyConfidence(device, hour),
        reason: this.getHourlyReason(device, hour, isWeekend, isActive),
        transitionType: null, // Will be set below
      };
      
      schedule.push(hourData);
    }
    
    // Identify transitions (on/off changes)
    for (let i = 1; i < schedule.length; i++) {
      const current = schedule[i];
      const previous = schedule[i - 1];
      
      if (current.isActive !== previous.isActive) {
        current.transitionType = current.isActive ? 'turn_on' : 'turn_off';
        current.transitionProbability = Math.abs(current.probability - previous.probability);
      }
    }
    
    return schedule;
  }

  // Find next state change prediction
  findNextStateChange(device, currentHour, dailySchedule) {
    const currentState = device.status === 'on';
    
    // Look for the next transition in the schedule
    for (let i = currentHour + 1; i < dailySchedule.length; i++) {
      const hourData = dailySchedule[i];
      if (hourData.isActive !== currentState) {
        return {
          hour: hourData.hour,
          timeLabel: hourData.timeLabel,
          action: hourData.isActive ? 'turn_on' : 'turn_off',
          probability: hourData.probability,
          confidence: hourData.confidence,
          reason: hourData.reason,
          hoursFromNow: i - currentHour,
          estimatedDuration: this.estimateUsageDuration(device, i, dailySchedule),
        };
      }
    }
    
    // If no change found today, look at tomorrow's patterns
    const tomorrowStart = this.getTomorrowFirstTransition(device, currentState);
    if (tomorrowStart) {
      return {
        ...tomorrowStart,
        hoursFromNow: 24 - currentHour + tomorrowStart.hour,
        isTomorrow: true,
      };
    }
    
    return null;
  }

  // Get typical usage hours for a device
  getTypicalUsageHours(device, isWeekend) {
    const deviceType = device.type.toLowerCase();
    const patterns = this.getDevicePatternsByType(deviceType, isWeekend);
    
    return patterns.activeHours.map(hour => ({
      hour: hour,
      timeLabel: `${hour.toString().padStart(2, '0')}:00`,
      reason: patterns.reasons[hour] || 'Regular usage',
      probability: patterns.probabilities[hour] || 0.5,
    }));
  }

  // Calculate energy impact for the day
  calculateEnergyImpact(device, dailySchedule) {
    const totalHoursOn = dailySchedule.filter(h => h.isActive).length;
    const totalEnergyKwh = (totalHoursOn * (device.normal_usage || 0)) / 1000;
    const totalCost = totalEnergyKwh * 2.5; // R2.50 per kWh
    
    const peakHours = dailySchedule.filter(h => h.isActive && (h.hour >= 18 && h.hour <= 22));
    const peakCost = (peakHours.length * (device.normal_usage || 0) / 1000) * 3.0; // Higher peak rate
    
    return {
      totalHoursOn: totalHoursOn,
      totalEnergyKwh: Math.round(totalEnergyKwh * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      peakHours: peakHours.length,
      peakCost: Math.round(peakCost * 100) / 100,
      efficiency: totalHoursOn <= 12 ? 'high' : totalHoursOn <= 18 ? 'medium' : 'low',
    };
  }

  // Get device patterns by type
  getDevicePatternsByType(deviceType, isWeekend) {
    const patterns = {
      refrigerator: {
        activeHours: Array.from({length: 24}, (_, i) => i), // Always on
        probabilities: Array(24).fill(1.0),
        reasons: Array(24).fill('Essential appliance - continuous operation'),
      },
      
      router: {
        activeHours: Array.from({length: 24}, (_, i) => i), // Always on
        probabilities: Array(24).fill(1.0),
        reasons: Array(24).fill('Network infrastructure - continuous operation'),
      },
      
      light: {
        activeHours: [6, 7, 8, 18, 19, 20, 21, 22, 23],
        probabilities: [0.6, 0.8, 0.6, 0.9, 0.95, 0.9, 0.8, 0.7, 0.5],
        reasons: {
          6: 'Early morning activity', 7: 'Morning routine', 8: 'Getting ready',
          18: 'Evening return', 19: 'Dinner time', 20: 'Family time',
          21: 'Relaxation', 22: 'Winding down', 23: 'Late evening',
        }
      },
      
      tv: isWeekend ? {
        activeHours: [8, 9, 10, 11, 12, 13, 14, 19, 20, 21, 22, 23],
        probabilities: [0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.5, 0.8, 0.9, 0.8, 0.7, 0.5],
        reasons: {
          8: 'Weekend morning shows', 10: 'Weekend entertainment', 12: 'Midday programs',
          19: 'Prime time', 20: 'Evening shows', 21: 'Night entertainment',
        }
      } : {
        activeHours: [7, 19, 20, 21, 22],
        probabilities: [0.3, 0.7, 0.8, 0.7, 0.5],
        reasons: {
          7: 'Morning news', 19: 'After work relaxation', 20: 'Prime time',
          21: 'Evening entertainment', 22: 'Late night shows',
        }
      },
      
      computer: isWeekend ? {
        activeHours: [10, 11, 14, 15, 16, 17, 18, 20, 21],
        probabilities: [0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.3, 0.4, 0.3],
        reasons: {
          10: 'Weekend projects', 14: 'Personal tasks', 16: 'Entertainment',
          20: 'Evening computing', 21: 'Personal time',
        }
      } : {
        activeHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20],
        probabilities: [0.8, 0.9, 0.9, 0.9, 0.8, 0.9, 0.9, 0.9, 0.9, 0.8, 0.3, 0.2],
        reasons: {
          8: 'Work start', 9: 'Morning work', 12: 'Midday work', 15: 'Afternoon work',
          17: 'End of workday', 19: 'Personal computing',
        }
      },
      
      'air conditioner': {
        activeHours: [12, 13, 14, 15, 16, 17, 18, 22, 23, 0, 1, 2, 3, 4, 5, 6],
        probabilities: [0.6, 0.8, 0.9, 0.9, 0.8, 0.7, 0.6, 0.4, 0.5, 0.6, 0.5, 0.4, 0.3, 0.3, 0.3, 0.3],
        reasons: {
          12: 'Midday cooling', 14: 'Peak heat', 16: 'Afternoon cooling',
          22: 'Night comfort', 2: 'Deep night cooling',
        }
      },
      
      heater: {
        activeHours: [6, 7, 8, 9, 18, 19, 20, 21, 22],
        probabilities: [0.7, 0.8, 0.6, 0.4, 0.6, 0.7, 0.8, 0.6, 0.4],
        reasons: {
          6: 'Morning warmup', 7: 'Getting ready warmth', 8: 'Morning comfort',
          18: 'Evening warmth', 19: 'Dinner warmth', 20: 'Evening comfort',
        }
      },
      
      microwave: {
        activeHours: [7, 8, 12, 13, 18, 19],
        probabilities: [0.6, 0.4, 0.7, 0.5, 0.8, 0.6],
        reasons: {
          7: 'Breakfast preparation', 12: 'Lunch heating', 13: 'Quick lunch',
          18: 'Dinner prep', 19: 'Evening meal',
        }
      },
      
      kettle: {
        activeHours: [6, 7, 10, 15, 20, 21],
        probabilities: [0.4, 0.6, 0.5, 0.4, 0.5, 0.3],
        reasons: {
          6: 'Early morning tea', 7: 'Morning coffee', 10: 'Mid-morning break',
          15: 'Afternoon tea', 20: 'Evening hot drink',
        }
      },
      
      'washing machine': isWeekend ? {
        activeHours: [9, 10, 11, 12, 13, 14, 15],
        probabilities: [0.3, 0.4, 0.5, 0.4, 0.3, 0.4, 0.3],
        reasons: {
          9: 'Weekend laundry start', 10: 'Morning wash', 12: 'Midday laundry',
          14: 'Afternoon wash',
        }
      } : {
        activeHours: [7, 8, 18, 19],
        probabilities: [0.2, 0.3, 0.2, 0.1],
        reasons: {
          7: 'Before work laundry', 8: 'Quick morning wash',
          18: 'After work laundry',
        }
      },
      
      default: {
        activeHours: [18, 19, 20, 21, 22],
        probabilities: [0.4, 0.5, 0.6, 0.5, 0.3],
        reasons: {
          18: 'Evening usage', 19: 'Prime time', 20: 'Active period',
          21: 'Later evening', 22: 'End of day',
        }
      }
    };
    
    const pattern = patterns[deviceType] || patterns.default;
    
    // Fill in missing probabilities and reasons
    const fullProbabilities = Array(24).fill(0);
    const fullReasons = {};
    
    pattern.activeHours.forEach((hour, index) => {
      fullProbabilities[hour] = pattern.probabilities[index] || 0.3;
      fullReasons[hour] = pattern.reasons[hour] || pattern.reasons[index] || 'Regular usage';
    });
    
    return {
      activeHours: pattern.activeHours,
      probabilities: fullProbabilities,
      reasons: fullReasons,
    };
  }

  // Get hourly probability for device
  getHourlyProbability(device, hour, isWeekend) {
    const patterns = this.getDevicePatternsByType(device.type.toLowerCase(), isWeekend);
    return patterns.probabilities[hour] || 0;
  }

  // Calculate hourly confidence
  calculateHourlyConfidence(device, hour) {
    // Base confidence on historical data if available
    const dayPatterns = this.trainingData.dayPatterns || [];
    if (dayPatterns.length === 0) return 0.3;
    
    const hourlyData = dayPatterns
      .flatMap(d => d.hourlySnapshots)
      .filter(h => h.hour === hour)
      .flatMap(h => h.devices)
      .filter(d => d.type === device.type);
    
    if (hourlyData.length === 0) return 0.3;
    
    const consistency = hourlyData.filter(d => d.isActive).length / hourlyData.length;
    const sampleSize = Math.min(1, hourlyData.length / 10);
    
    return Math.min(0.95, consistency * sampleSize + 0.2);
  }

  // Get reason for hourly prediction
  getHourlyReason(device, hour, isWeekend, isActive) {
    const patterns = this.getDevicePatternsByType(device.type.toLowerCase(), isWeekend);
    
    if (isActive && patterns.reasons[hour]) {
      return patterns.reasons[hour];
    } else if (isActive) {
      return 'Predicted active period';
    } else {
      return 'Predicted inactive period';
    }
  }

  // Estimate usage duration
  estimateUsageDuration(device, startHour, dailySchedule) {
    let duration = 0;
    for (let i = startHour; i < dailySchedule.length; i++) {
      if (dailySchedule[i].isActive) {
        duration++;
      } else {
        break;
      }
    }
    
    return {
      hours: duration,
      description: duration === 1 ? '~1 hour' : 
                   duration <= 3 ? `~${duration} hours` :
                   duration <= 6 ? 'Several hours' :
                   'Extended period'
    };
  }

  // Get tomorrow's first transition
  getTomorrowFirstTransition(device, currentState) {
    const tomorrowIsWeekend = new Date().getDay() === 6; // Tomorrow
    const patterns = this.getDevicePatternsByType(device.type.toLowerCase(), tomorrowIsWeekend);
    
    for (let hour = 0; hour < 24; hour++) {
      const willBeActive = patterns.probabilities[hour] > 0.5;
      if (willBeActive !== currentState) {
        return {
          hour: hour,
          timeLabel: `${hour.toString().padStart(2, '0')}:00`,
          action: willBeActive ? 'turn_on' : 'turn_off',
          probability: patterns.probabilities[hour],
          confidence: 0.6,
          reason: patterns.reasons[hour] || 'Tomorrow\'s first change',
        };
      }
    }
    
    return null;
  }

  // Get day-based probability for device
  getDayBasedProbability(device, hour, dayPattern) {
    if (!dayPattern || !dayPattern.hourlyAverages) return 0.3;
    
    // Find similar devices in day patterns
    const deviceTypeUsage = this.trainingData.dayPatterns
      .flatMap(d => d.hourlySnapshots)
      .filter(h => h.hour === hour)
      .flatMap(h => h.devices)
      .filter(d => d.type === device.type);
    
    if (deviceTypeUsage.length === 0) return 0.3;
    
    const activeCount = deviceTypeUsage.filter(d => d.isActive).length;
    return activeCount / deviceTypeUsage.length;
  }

  // Enhanced getRecommendations using day insights
  getRecommendations(appliances) {
    const deviceList = Array.isArray(appliances) ? appliances : [];
    
    if (!this.initialized) {
      return [];
    }

    const recommendations = [];
    const currentHour = new Date().getHours();
    const dayPatterns = this.trainingData.dayPatterns || [];

    // Day-based recommendations
    if (dayPatterns.length >= 3) {
      // Analyze daily energy peaks
      const peakHours = dayPatterns.map(d => d.summary.peakHour);
      const mostCommonPeakHour = this.findMostCommon(peakHours);
      
      if (currentHour === mostCommonPeakHour) {
        const avgPeakPower = dayPatterns.reduce((sum, d) => sum + d.summary.peakPower, 0) / dayPatterns.length;
        const monthlyCost = (avgPeakPower / 1000) * 2.5 * 30;
        
        recommendations.push({
          type: 'daily_peak_optimization',
          priority: 'high',
          suggestion: `Your daily peak usage typically occurs around ${mostCommonPeakHour}:00. Consider shifting some devices to off-peak hours.`,
          devices: this.getHighUsageDevicesAtHour(deviceList, mostCommonPeakHour),
          potentialSavings: Math.round(monthlyCost * 0.15), // 15% potential savings
          data: {
            peakHour: mostCommonPeakHour,
            averagePeakPower: Math.round(avgPeakPower),
            basedOnDays: dayPatterns.length,
          },
        });
      }
      
      // Daily routine recommendations
      if (this.models.dayPatterns && this.models.dayPatterns.dailyRoutines) {
        const routines = this.models.dayPatterns.dailyRoutines;
        routines.forEach(routine => {
          if (routine.frequency >= dayPatterns.length * 0.7) { // Occurs in 70% of days
            recommendations.push({
              type: 'routine_automation',
              priority: 'medium',
              suggestion: `You have a consistent ${routine.type.replace('_', ' ')} at ${routine.hour}:00. Consider automating these devices.`,
              devices: Object.keys(routine.commonDevices).map(key => key.split('_')[0]),
              potentialSavings: 10,
              data: {
                routineType: routine.type,
                hour: routine.hour,
                consistency: Math.round((routine.frequency / dayPatterns.length) * 100),
              },
            });
          }
        });
      }
    }

    // Fallback to hourly recommendations if no day patterns
    if (recommendations.length === 0 && this.models.usagePatterns) {
      return this.getHourlyBasedRecommendations(deviceList, currentHour);
    }

    return recommendations.slice(0, 5);
  }

  // Get hourly-based recommendations (fallback)
  getHourlyBasedRecommendations(deviceList, currentHour) {
    const recommendations = [];
    
    if (!this.models.usagePatterns || !this.models.usagePatterns.patterns) {
      return recommendations;
    }

    const patterns = this.models.usagePatterns.patterns;
    const currentlyActiveDevices = deviceList.filter(device => device.status === 'on');
    
    // High power consumption recommendation
    const totalCurrentPower = currentlyActiveDevices.reduce((sum, device) => 
      sum + (device.current_power || device.normal_usage || 0), 0);
    
    if (totalCurrentPower > 2000) { // Above 2kW
      recommendations.push({
        type: 'high_power_usage',
        priority: 'high',
        suggestion: `High power usage detected (${Math.round(totalCurrentPower)}W). Consider turning off non-essential devices.`,
        devices: currentlyActiveDevices
          .filter(device => (device.current_power || device.normal_usage || 0) > 200)
          .map(device => device.id),
        potentialSavings: Math.round((totalCurrentPower / 1000) * 2.5 * 30 * 0.2), // 20% savings
        data: {
          currentPower: Math.round(totalCurrentPower),
          threshold: 2000,
        },
      });
    }
    
    // Off-peak usage recommendation
    const peakHours = this.models.usagePatterns.peakHours || [];
    if (peakHours.includes(currentHour)) {
      recommendations.push({
        type: 'peak_hour_usage',
        priority: 'medium',
        suggestion: `This is typically a peak usage hour (${currentHour}:00). Consider delaying non-essential device usage.`,
        devices: currentlyActiveDevices
          .filter(device => ['washing machine', 'dishwasher', 'dryer'].includes(device.type.toLowerCase()))
          .map(device => device.id),
        potentialSavings: 15,
        data: {
          peakHour: currentHour,
          peakHours: peakHours,
        },
      });
    }
    
    // Always-on device check
    Object.values(patterns).forEach(pattern => {
      const device = deviceList.find(d => d.id === pattern.deviceId);
      if (device && pattern.alwaysOn && device.status === 'on' && 
          (device.current_power || device.normal_usage || 0) > 50) {
        recommendations.push({
          type: 'always_on_device',
          priority: 'low',
          suggestion: `${device.name} appears to be always on. Check if this is necessary or if there are energy-saving modes available.`,
          devices: [device.id],
          potentialSavings: Math.round((device.current_power || device.normal_usage || 0) * 0.1 * 24 * 30 / 1000 * 2.5),
          data: {
            deviceType: device.type,
            averagePower: pattern.averagePower,
          },
        });
      }
    });
    
    return recommendations.slice(0, 5);
  }

  // Utility methods and remaining existing methods
  findMostCommon(array) {
    const counts = {};
    array.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  findMostCommonPeakHour(patterns) {
    const peakHours = patterns.map(p => p.summary.peakHour);
    return this.findMostCommon(peakHours);
  }

  getHighUsageDevicesAtHour(devices, hour) {
    // Find devices that are typically high usage at this hour
    return devices
      .filter(device => {
        const devicePattern = this.models.usagePatterns?.patterns?.[device.id];
        return devicePattern && (devicePattern.averagePower || 0) > 200;
      })
      .map(device => device.id);
  }

  calculateStats(array) {
    if (array.length === 0) return { min: 0, max: 0, average: 0, stdDev: 0 };
    
    const min = Math.min(...array);
    const max = Math.max(...array);
    const average = array.reduce((sum, val) => sum + val, 0) / array.length;
    
    const variance = array.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / array.length;
    const stdDev = Math.sqrt(variance);
    
    return { min, max, average, stdDev };
  }

  // Analysis methods (keeping existing implementations)
  analyzeDayPatterns() {
    const dayPatterns = this.trainingData.dayPatterns || [];
    const weekdayPatterns = dayPatterns.filter(d => !d.isWeekend);
    const weekendPatterns = dayPatterns.filter(d => d.isWeekend);
    
    // Analyze energy profiles by day type
    const weekdayEnergyProfile = this.calculateEnergyProfile(weekdayPatterns);
    const weekendEnergyProfile = this.calculateEnergyProfile(weekendPatterns);
    
    // Find common daily routines
    const dailyRoutines = this.extractDailyRoutines(dayPatterns);
    
    // Analyze device transition patterns
    const deviceTransitions = this.analyzeDeviceTransitions(dayPatterns);
    
    // Calculate daily cost patterns
    const dailyCostPatterns = this.calculateDailyCostPatterns(dayPatterns);
    
    return {
      weekdayPatterns: weekdayEnergyProfile,
      weekendPatterns: weekendEnergyProfile,
      dailyEnergyProfiles: {
        weekday: weekdayEnergyProfile,
        weekend: weekendEnergyProfile,
      },
      dailyRoutines,
      deviceTransitions,
      dailyCostPatterns,
      averageAccuracy: this.calculatePatternAccuracy(dayPatterns),
    };
  }

  calculateEnergyProfile(patterns) {
    if (patterns.length === 0) return null;
    
    const hourlyAverages = Array(24).fill(0);
    const hourlyPeaks = Array(24).fill(0);
    
    patterns.forEach(dayPattern => {
      dayPattern.hourlySnapshots.forEach((hour, index) => {
        hourlyAverages[index] += hour.totalPower;
        if (hour.totalPower > hourlyPeaks[index]) {
          hourlyPeaks[index] = hour.totalPower;
        }
      });
    });
    
    // Average out
    const patternCount = patterns.length;
    return {
      hourlyAverages: hourlyAverages.map(total => total / patternCount),
      hourlyPeaks: hourlyPeaks,
      totalPatterns: patternCount,
      averageDailyEnergy: patterns.reduce((sum, p) => sum + p.summary.totalEnergyKwh, 0) / patternCount,
      commonPeakHour: this.findMostCommonPeakHour(patterns),
    };
  }

  extractDailyRoutines(dayPatterns) {
    const routines = [];
    
    // Look for patterns where multiple devices change state at similar times
    dayPatterns.forEach(dayPattern => {
      const transitions = [];
      
      for (let hour = 1; hour < dayPattern.hourlySnapshots.length; hour++) {
        const currentHour = dayPattern.hourlySnapshots[hour];
        const previousHour = dayPattern.hourlySnapshots[hour - 1];
        
        const deviceChanges = [];
        currentHour.devices.forEach(device => {
          const prevDevice = previousHour.devices.find(d => d.id === device.id);
          if (prevDevice && prevDevice.status !== device.status) {
            deviceChanges.push({
              deviceId: device.id,
              deviceType: device.type,
              action: device.status === 'on' ? 'on' : 'off',
            });
          }
        });
        
        if (deviceChanges.length >= 2) {
          transitions.push({
            hour,
            changes: deviceChanges,
            type: this.categorizeRoutine(hour, deviceChanges),
          });
        }
      }
      
      routines.push(...transitions);
    });
    
    // Group similar routines
    return this.groupSimilarRoutines(routines);
  }

  categorizeRoutine(hour, changes) {
    if (hour >= 6 && hour <= 9) return 'morning_routine';
    if (hour >= 12 && hour <= 14) return 'lunch_routine';
    if (hour >= 17 && hour <= 19) return 'evening_routine';
    if (hour >= 22 || hour <= 6) return 'bedtime_routine';
    return 'general_activity';
  }

  groupSimilarRoutines(routines) {
    const grouped = {};
    
    routines.forEach(routine => {
      const key = `${routine.type}_${routine.hour}`;
      if (!grouped[key]) {
        grouped[key] = {
          type: routine.type,
          hour: routine.hour,
          frequency: 0,
          commonDevices: {},
        };
      }
      
      grouped[key].frequency++;
      routine.changes.forEach(change => {
        const deviceKey = `${change.deviceType}_${change.action}`;
        grouped[key].commonDevices[deviceKey] = (grouped[key].commonDevices[deviceKey] || 0) + 1;
      });
    });
    
    return Object.values(grouped).filter(routine => routine.frequency >= 2);
  }

  analyzeDeviceTransitions(dayPatterns) {
    const transitions = {};
    
    dayPatterns.forEach(dayPattern => {
      for (let hour = 1; hour < dayPattern.hourlySnapshots.length; hour++) {
        const currentHour = dayPattern.hourlySnapshots[hour];
        const previousHour = dayPattern.hourlySnapshots[hour - 1];
        
        currentHour.devices.forEach(device => {
          const prevDevice = previousHour.devices.find(d => d.id === device.id);
          if (prevDevice && prevDevice.status !== device.status) {
            const transitionKey = `${device.type}_${prevDevice.status}_to_${device.status}`;
            
            if (!transitions[transitionKey]) {
              transitions[transitionKey] = {
                deviceType: device.type,
                transition: `${prevDevice.status} to ${device.status}`,
                hours: [],
                frequency: 0,
              };
            }
            
            transitions[transitionKey].hours.push(hour);
            transitions[transitionKey].frequency++;
          }
        });
      }
    });
    
    return transitions;
  }

  calculateDailyCostPatterns(dayPatterns) {
    const costPatterns = {
      weekday: { hourly: Array(24).fill(0), total: 0 },
      weekend: { hourly: Array(24).fill(0), total: 0 },
    };
    
    dayPatterns.forEach(dayPattern => {
      const dayType = dayPattern.isWeekend ? 'weekend' : 'weekday';
      dayPattern.hourlySnapshots.forEach((hour, index) => {
        const hourlyCost = (hour.totalPower / 1000) * 2.5; // R2.50 per kWh
        costPatterns[dayType].hourly[index] += hourlyCost;
        costPatterns[dayType].total += hourlyCost;
      });
    });
    
    // Average costs
    const weekdayCount = dayPatterns.filter(d => !d.isWeekend).length || 1;
    const weekendCount = dayPatterns.filter(d => d.isWeekend).length || 1;
    
    costPatterns.weekday.hourly = costPatterns.weekday.hourly.map(cost => cost / weekdayCount);
    costPatterns.weekend.hourly = costPatterns.weekend.hourly.map(cost => cost / weekendCount);
    costPatterns.weekday.total /= weekdayCount;
    costPatterns.weekend.total /= weekendCount;
    
    return costPatterns;
  }

  calculatePatternAccuracy(dayPatterns) {
    if (dayPatterns.length < 2) return 0.5;
    
    let totalAccuracy = 0;
    let comparisons = 0;
    
    for (let i = 1; i < dayPatterns.length; i++) {
      const current = dayPatterns[i];
      const previous = dayPatterns[i - 1];
      
      // Compare similar day types (weekday vs weekday, weekend vs weekend)
      if (current.isWeekend === previous.isWeekend) {
        const similarity = this.calculateDaySimilarity(current, previous);
        totalAccuracy += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalAccuracy / comparisons : 0.5;
  }

  calculateDaySimilarity(day1, day2) {
    let totalSimilarity = 0;
    let hourCount = 0;
    
    for (let hour = 0; hour < 24; hour++) {
      const hour1 = day1.hourlySnapshots[hour];
      const hour2 = day2.hourlySnapshots[hour];
      
      if (hour1 && hour2) {
        const powerDiff = Math.abs(hour1.totalPower - hour2.totalPower);
        const maxPower = Math.max(hour1.totalPower, hour2.totalPower, 100); // Avoid division by zero
        const hourSimilarity = 1 - (powerDiff / maxPower);
        
        totalSimilarity += Math.max(0, hourSimilarity);
        hourCount++;
      }
    }
    
    return hourCount > 0 ? totalSimilarity / hourCount : 0.5;
  }

  // FIXED: Safe accuracy calculation
  calculateDayBasedAccuracy(dayInsights, patterns) {
    const dayPatterns = this.trainingData.dayPatterns || [];
    if (dayPatterns.length < 2) return 0.5; // Default for small datasets
    
    let totalAccuracy = 0;
    let validPatterns = 0;
    
    dayPatterns.forEach(dayPattern => {
      try {
        const predictedEnergy = this.predictDayEnergy(dayPattern, patterns);
        const actualEnergy = dayPattern.summary?.totalEnergyKwh || 0;
        
        // FIXED: Prevent division by zero and handle edge cases
        if (actualEnergy > 0 && !isNaN(predictedEnergy) && predictedEnergy > 0) {
          const accuracy = 1 - Math.min(1, Math.abs(predictedEnergy - actualEnergy) / actualEnergy);
          totalAccuracy += Math.max(0, accuracy);
          validPatterns++;
        }
      } catch (error) {
        // Skip invalid patterns
        console.warn('Skipping invalid day pattern in accuracy calculation');
      }
    });
    
    // FIXED: Safe accuracy calculation with bounds
    return validPatterns > 0 ? Math.min(0.95, Math.max(0.1, totalAccuracy / validPatterns)) : 0.5;
  }

  // FIXED: Safe energy prediction
  predictDayEnergy(dayPattern, patterns) {
    try {
      let predictedEnergy = 0;
      
      if (!dayPattern.hourlySnapshots || dayPattern.hourlySnapshots.length === 0) {
        return 0;
      }
      
      dayPattern.hourlySnapshots.forEach(hour => {
        if (hour.devices && Array.isArray(hour.devices)) {
          hour.devices.forEach(device => {
            if (device.isActive) {
              const devicePattern = patterns.devicePatterns?.[device.id];
              const power = devicePattern?.averagePower || device.power || 0;
              predictedEnergy += power / 1000; // Convert to kWh
            }
          });
        }
      });
      
      return Math.max(0, predictedEnergy);
    } catch (error) {
      console.warn('Error predicting day energy:', error);
      return 0;
    }
  }

  calculateDailyNormalRanges() {
    const dayPatterns = this.trainingData.dayPatterns || [];
    if (dayPatterns.length === 0) return {};
    
    const dailyEnergies = dayPatterns.map(d => d.summary.totalEnergyKwh);
    const dailyPeaks = dayPatterns.map(d => d.summary.peakPower);
    
    const energyStats = this.calculateStats(dailyEnergies);
    const peakStats = this.calculateStats(dailyPeaks);
    
    return {
      dailyEnergy: {
        min: energyStats.min,
        max: energyStats.max,
        average: energyStats.average,
        stdDev: energyStats.stdDev,
      },
      dailyPeak: {
        min: peakStats.min,
        max: peakStats.max,
        average: peakStats.average,
        stdDev: peakStats.stdDev,
      },
    };
  }

  analyzeUsagePatterns() {
    const devicePatterns = {};
    const hourlyPatterns = {};
    const dailyPatterns = { weekday: {}, weekend: {} };
    const deviceCorrelations = {};
    
    // Initialize structures
    for (let hour = 0; hour < 24; hour++) {
      hourlyPatterns[hour] = { totalSamples: 0, totalPower: 0, activeDevices: 0 };
    }

    // Process each simulation sample (keeping backward compatibility)
    this.trainingData.deviceUsage.forEach(entry => {
      const hour = entry.hour;
      const isWeekend = entry.isWeekend;
      const dayType = isWeekend ? 'weekend' : 'weekday';
      
      hourlyPatterns[hour].totalSamples++;
      hourlyPatterns[hour].totalPower += entry.totalPower;
      hourlyPatterns[hour].activeDevices += entry.activeDeviceCount;
      
      if (!dailyPatterns[dayType][hour]) {
        dailyPatterns[dayType][hour] = { totalSamples: 0, totalPower: 0 };
      }
      dailyPatterns[dayType][hour].totalSamples++;
      dailyPatterns[dayType][hour].totalPower += entry.totalPower;
      
      entry.devices.forEach(device => {
        if (!devicePatterns[device.id]) {
          devicePatterns[device.id] = {
            deviceId: device.id,
            deviceType: device.type,
            totalSamples: 0,
            activeSamples: 0,
            hourlyActivity: Array(24).fill(0).map(() => ({ samples: 0, active: 0 })),
            dailyActivity: { weekday: Array(24).fill(0), weekend: Array(24).fill(0) },
            averagePower: 0,
            alwaysOn: true,
            typicalUsageHours: [],
          };
        }
        
        const pattern = devicePatterns[device.id];
        pattern.totalSamples++;
        
        pattern.hourlyActivity[hour].samples++;
        if (device.isActive) {
          pattern.activeSamples++;
          pattern.hourlyActivity[hour].active++;
          pattern.averagePower += device.power;
          pattern.dailyActivity[dayType][hour]++;
        }
      });
    });

    // Calculate final patterns
    Object.keys(devicePatterns).forEach(deviceId => {
      const pattern = devicePatterns[deviceId];
      
      if (pattern.totalSamples > 0) {
        pattern.averagePower = pattern.averagePower / pattern.activeSamples || 0;
        pattern.alwaysOn = (pattern.activeSamples / pattern.totalSamples) > 0.8;
        
        pattern.hourlyProbabilities = pattern.hourlyActivity.map(hour => 
          hour.samples > 0 ? hour.active / hour.samples : 0
        );
        
        pattern.weekdayProbabilities = pattern.dailyActivity.weekday.map((count, hour) => {
          const weekdayTotal = Math.max(1, dailyPatterns.weekday[hour]?.totalSamples || 1);
          return count / weekdayTotal;
        });
        
        pattern.weekendProbabilities = pattern.dailyActivity.weekend.map((count, hour) => {
          const weekendTotal = Math.max(1, dailyPatterns.weekend[hour]?.totalSamples || 1);
          return count / weekendTotal;
        });
        
        pattern.typicalUsageHours = pattern.hourlyProbabilities
          .map((prob, hour) => ({ hour, prob }))
          .filter(({ prob }) => prob > 0.5)
          .map(({ hour }) => hour);
      }
    });

    // Find peak hours
    const peakHours = Object.keys(hourlyPatterns)
      .map(hour => ({ 
        hour: parseInt(hour), 
        avgPower: hourlyPatterns[hour].totalPower / Math.max(1, hourlyPatterns[hour].totalSamples) 
      }))
      .sort((a, b) => b.avgPower - a.avgPower)
      .slice(0, 3)
      .map(p => p.hour);

    return {
      devicePatterns,
      hourlyPatterns,
      dailyPatterns,
      peakHours,
      deviceCorrelations,
    };
  }

  analyzeUserBehavior() {
    const actionPatterns = {};
    const preferredHours = {};
    
    this.trainingData.userActions.forEach(action => {
      const key = `${action.deviceType}_${action.action}`;
      if (!actionPatterns[key]) {
        actionPatterns[key] = {
          deviceType: action.deviceType,
          action: action.action,
          hours: Array(24).fill(0),
          totalCount: 0,
        };
      }
      
      actionPatterns[key].hours[action.hour]++;
      actionPatterns[key].totalCount++;
      
      if (!preferredHours[action.hour]) {
        preferredHours[action.hour] = 0;
      }
      preferredHours[action.hour]++;
    });

    const automationOpportunities = Object.values(actionPatterns)
      .filter(pattern => pattern.totalCount >= 5)
      .map(pattern => {
        const peakHour = pattern.hours.indexOf(Math.max(...pattern.hours));
        const consistency = Math.max(...pattern.hours) / pattern.totalCount;
        
        return {
          deviceType: pattern.deviceType,
          action: pattern.action,
          suggestedHour: peakHour,
          consistency: consistency,
          totalOccurrences: pattern.totalCount,
        };
      });

    return {
      actionPatterns,
      preferredHours,
      automationOpportunities,
    };
  }

  analyzeCostPatterns() {
    const hourlyCosts = Array(24).fill(0);
    const savingsOpportunities = [];
    
    this.trainingData.deviceUsage.forEach(entry => {
      const hourlyCost = (entry.totalPower / 1000) * 2.5;
      hourlyCosts[entry.hour] += hourlyCost;
    });

    const avgHourlyCosts = hourlyCosts.map(cost => 
      cost / Math.max(1, this.trainingData.deviceUsage.filter(e => e.hour === hourlyCosts.indexOf(cost)).length)
    );

    const peakCostHours = avgHourlyCosts
      .map((cost, hour) => ({ hour, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map(p => p.hour);

    return {
      hourlyCosts: avgHourlyCosts,
      savingsOpportunities,
      optimalSchedules: [],
      peakCostHours,
    };
  }

  calculateNormalRanges() {
    const powers = this.trainingData.deviceUsage.map(entry => entry.totalPower);
    const hourlyRanges = {};
    
    for (let hour = 0; hour < 24; hour++) {
      const hourPowers = this.trainingData.deviceUsage
        .filter(entry => entry.hour === hour)
        .map(entry => entry.totalPower);
      
      if (hourPowers.length > 0) {
        hourlyRanges[hour] = {
          min: Math.min(...hourPowers),
          max: Math.max(...hourPowers),
          avg: hourPowers.reduce((sum, p) => sum + p, 0) / hourPowers.length,
        };
      }
    }

    return {
      power: {
        min: Math.min(...powers),
        max: Math.max(...powers),
        avg: powers.reduce((sum, p) => sum + p, 0) / powers.length,
      },
      hourlyRanges,
    };
  }

  calculateAnomalyThresholds() {
    const powers = this.trainingData.deviceUsage.map(entry => entry.totalPower);
    const mean = powers.reduce((sum, p) => sum + p, 0) / powers.length;
    const stdDev = Math.sqrt(powers.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / powers.length);
    
    return {
      highPowerThreshold: mean + (2 * stdDev),
      lowPowerThreshold: Math.max(0, mean - (2 * stdDev)),
      stdDev,
      mean,
    };
  }

  // Detect anomalies, clear user data, and other methods remain the same
  detectAnomalies(appliances) {
    const deviceList = Array.isArray(appliances) ? appliances : [];
    
    if (!this.initialized || !this.models.anomalyDetection) {
      return { hasAnomaly: false, anomalies: [] };
    }

    const anomalies = [];
    const currentHour = new Date().getHours();
    const totalPower = deviceList
      .filter(device => device.status === 'on')
      .reduce((sum, device) => sum + (device.current_power || device.normal_usage || 0), 0);

    // Check for unusual total power consumption
    const normalRange = this.models.anomalyDetection.normalRanges.power;
    if (totalPower > normalRange.max) {
      anomalies.push({
        type: 'high_power_consumption',
        severity: 'high',
        message: `Unusually high power consumption detected (${totalPower}W vs normal max ${Math.round(normalRange.max)}W)`,
        currentValue: totalPower,
        expectedRange: [0, normalRange.max],
      });
    }

    // Check daily normal ranges if available
    if (this.models.anomalyDetection.dailyNormalRanges) {
      const dailyRanges = this.models.anomalyDetection.dailyNormalRanges;
      const currentDailyUsage = totalPower * 24 / 1000; // Rough daily estimate
      
      if (currentDailyUsage > dailyRanges.dailyEnergy.max * 1.5) {
        anomalies.push({
          type: 'unusual_daily_consumption',
          severity: 'medium',
          message: `Daily consumption trending much higher than normal (estimated ${currentDailyUsage.toFixed(1)} kWh vs normal max ${dailyRanges.dailyEnergy.max.toFixed(1)} kWh)`,
          currentValue: currentDailyUsage,
          expectedRange: [0, dailyRanges.dailyEnergy.max],
        });
      }
    }

    return {
      hasAnomaly: anomalies.length > 0,
      anomalies,
      checkedAt: new Date().toISOString(),
      basedOnDayPatterns: this.trainingData.dayPatterns?.length || 0,
    };
  }

  // Clear user-specific data
  async clearUserData() {
    try {
      console.log(`🗑️ Clearing ML data for user: ${this.userId}...`);
      
      // Clear local storage
      await Promise.all([
        AsyncStorage.multiRemove([this.storageKey, this.dataKey, this.settingsKey]),
      ]);
      
      // Clear cloud data if enabled
      if (this.supabase && this.cloudSyncEnabled) {
        await Promise.all([
          this.supabase.from('ml_models').delete().eq('user_id', this.userId),
          this.supabase.from('ml_training_data').delete().eq('user_id', this.userId),
          this.supabase.from('ml_engine_settings').delete().eq('user_id', this.userId),
        ]);
      }
      
      // Reset in-memory data including day patterns
      this.models = {
        usagePatterns: null,
        userBehavior: null,
        costOptimization: null,
        anomalyDetection: null,
        dayPatterns: null,
      };
      
      this.trainingData = {
        deviceUsage: [],
        userActions: [],
        contextData: [],
        costData: [],
        dayPatterns: [],
      };
      
      this.metrics = {
        accuracy: 0,
        lastTrainedAt: null,
        predictionsMade: 0,
        correctPredictions: 0,
        userId: this.userId,
        dayPatternsTrained: 0,
        averageDayAccuracy: 0,
      };
      
      console.log('✅ User ML data cleared successfully');
      return { success: true, message: 'All training data cleared' };
    } catch (error) {
      console.error('Error clearing user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced getMLInsights with day-based insights
  getMLInsights(appliances) {
    const deviceList = Array.isArray(appliances) ? appliances : [];
    
    if (!this.initialized) {
      return {
        ready: false,
        predictions: [],
        recommendations: [],
        anomalies: { hasAnomaly: false, anomalies: [] },
        accuracy: 0,
        dataSamples: 0,
        dayPatterns: 0,
        message: 'ML Engine not initialized'
      };
    }

    try {
      const predictions = this.getPredictions(deviceList);
      const recommendations = this.getRecommendations(deviceList);
      const anomalies = this.detectAnomalies(deviceList);
      
      return {
        ready: true,
        predictions,
        recommendations,
        anomalies,
        accuracy: this.metrics.accuracy,
        dataSamples: this.trainingData.deviceUsage.length,
        dayPatterns: this.trainingData.dayPatterns?.length || 0,
        averageDayAccuracy: this.metrics.averageDayAccuracy || 0,
        samplingMode: 'daily',
        lastTrainedAt: this.metrics.lastTrainedAt,
      };
    } catch (error) {
      console.error('Error getting ML insights:', error);
      return {
        ready: false,
        predictions: [],
        recommendations: [],
        anomalies: { hasAnomaly: false, anomalies: [] },
        accuracy: 0,
        dataSamples: 0,
        dayPatterns: 0,
        error: error.message
      };
    }
  }

  // Keep remaining methods the same
  getEnergyForecast(appliances, hours = 12) {
    const deviceList = Array.isArray(appliances) ? appliances : [];
    
    if (!this.initialized) {
      return { 
        success: false, 
        forecast: [], 
        totalExpectedEnergy: 0, 
        totalExpectedCost: 0 
      };
    }

    const forecast = [];
    let totalExpectedEnergy = 0;
    const currentHour = new Date().getHours();
    
    for (let i = 0; i < hours; i++) {
      const hour = (currentHour + i) % 24;
      const expectedPower = this.getExpectedPowerForHour(hour, deviceList);
      const energyKwh = (expectedPower * 1) / 1000; // Energy for 1 hour in kWh
      const cost = energyKwh * 2.50; // Assuming R2.50 per kWh
      
      forecast.push({
        hour,
        hourLabel: `${hour}:00`,
        expectedPower: Math.round(expectedPower),
        energyKwh: Math.round(energyKwh * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        confidence: Math.min(0.8, this.metrics.accuracy),
        basedOnDayPatterns: this.trainingData.dayPatterns?.length || 0,
      });
      
      totalExpectedEnergy += energyKwh;
    }

    const totalExpectedCost = totalExpectedEnergy * 2.50;

    return {
      success: true,
      forecast,
      totalExpectedEnergy: Math.round(totalExpectedEnergy * 100) / 100,
      totalExpectedCost: Math.round(totalExpectedCost * 100) / 100,
      confidence: this.metrics.accuracy,
      predictionMethod: this.models.dayPatterns ? 'day_based' : 'hourly_fallback',
    };
  }

  // Get expected power for specific hour
  getExpectedPowerForHour(hour, appliances) {
    let expectedPower = 0;
    
    appliances.forEach(appliance => {
      const probability = this.getDayBasedProbability(appliance, hour, 
        this.models.dayPatterns?.weekdayPatterns || this.models.dayPatterns?.weekendPatterns);
      expectedPower += (appliance.normal_usage || 0) * probability;
    });
    
    return expectedPower;
  }

  // Get model metrics
  getModelMetrics() {
    return {
      accuracy: this.metrics.accuracy,
      lastTrainedAt: this.metrics.lastTrainedAt,
      predictionsMade: this.metrics.predictionsMade,
      correctPredictions: this.metrics.correctPredictions,
      trainingDataSize: this.trainingData.deviceUsage.length,
      dayPatternsCount: this.trainingData.dayPatterns?.length || 0,
      userActionsCount: this.trainingData.userActions.length,
      models: Object.keys(this.models).filter(key => this.models[key] !== null).length,
      userId: this.userId,
      samplingMode: 'daily',
      dayPatternsTrained: this.metrics.dayPatternsTrained,
      averageDayAccuracy: this.metrics.averageDayAccuracy,
    };
  }

  // Get prediction confidence
  getPredictionConfidence() {
    return Math.max(this.metrics.accuracy, this.metrics.averageDayAccuracy || 0);
  }
}

export default MLEngine;
