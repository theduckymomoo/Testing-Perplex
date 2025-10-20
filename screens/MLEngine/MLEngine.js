// MLEngine.js - User-Specific Machine Learning Engine for Smart Home Energy Management
// Enhanced with real simulation data processing

import AsyncStorage from '@react-native-async-storage/async-storage';

class MLEngine {
  constructor(userId, config = {}) {
    this.userId = userId;
    this.modelVersion = '2.0.0'; // Updated version for enhanced simulation processing
    
    // User-specific storage keys
    this.storageKey = `@ml_models_v2_${userId}`;
    this.dataKey = `@ml_training_data_v2_${userId}`;
    this.settingsKey = `@ml_settings_v2_${userId}`;
    
    // Configuration
    this.config = {
      minDataPoints: config.minDataPoints || 50,
      predictionHorizon: config.predictionHorizon || 24,
      retrainInterval: config.retrainInterval || 86400000,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      ...config,
    };
    
    // Model storage
    this.models = {
      usagePatterns: null,
      userBehavior: null,
      costOptimization: null,
      anomalyDetection: null,
    };
    
    // Training data buffer
    this.trainingData = {
      deviceUsage: [],
      userActions: [],
      contextData: [],
      costData: [],
    };
    
    // Performance metrics
    this.metrics = {
      accuracy: 0,
      lastTrainedAt: null,
      predictionsMade: 0,
      correctPredictions: 0,
      userId: userId,
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
      console.log(`🧠 Initializing ML Engine for user: ${this.userId}...`);
      
      // Try to load from cloud first, fallback to local storage
      if (this.cloudSyncEnabled) {
        await this.loadFromCloud();
      } else {
        await this.loadFromLocalStorage();
      }
      
      if (this.shouldRetrain()) {
        console.log('🔄 Retraining models with new data...');
        await this.trainModels();
      }
      
      this.initialized = true;
      console.log('✅ ML Engine initialized successfully');
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
        this.trainingData = JSON.parse(storedData);
        console.log(`📊 Loaded ${this.trainingData.deviceUsage.length} local training samples`);
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
        
        // Get metrics from the latest model
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
          this.trainingData[data.data_type] = data.data_points || [];
        });
        console.log(`☁️ Loaded ${this.trainingData.deviceUsage.length} cloud training samples`);
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
      
      console.log('💾 Models saved to local storage');
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

      // Save training data to cloud
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

      // Save settings to cloud
      const settingsPromise = this.supabase
        .from('ml_engine_settings')
        .upsert({
          user_id: this.userId,
          min_data_points: this.config.minDataPoints,
          prediction_horizon: this.config.predictionHorizon,
          retrain_interval: this.config.retrainInterval,
          confidence_threshold: this.config.confidenceThreshold,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      await Promise.all([...modelPromises, ...dataPromises, settingsPromise]);
      console.log('☁️ Data synced to cloud');
    } catch (error) {
      console.error('Error saving to cloud:', error);
    }
  }

  async saveModels() {
    // Save to both local storage and cloud
    await Promise.all([
      this.saveToLocalStorage(),
      this.saveToCloud(),
    ]);
  }

  async saveTrainingData() {
    // Save to both local storage and cloud
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
      
      // Reset in-memory data
      this.models = {
        usagePatterns: null,
        userBehavior: null,
        costOptimization: null,
        anomalyDetection: null,
      };
      
      this.trainingData = {
        deviceUsage: [],
        userActions: [],
        contextData: [],
        costData: [],
      };
      
      this.metrics = {
        accuracy: 0,
        lastTrainedAt: null,
        predictionsMade: 0,
        correctPredictions: 0,
        userId: this.userId,
      };
      
      console.log('✅ User ML data cleared successfully');
      return { success: true, message: 'All training data cleared' };
    } catch (error) {
      console.error('Error clearing user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Export user data for backup
  async exportUserData() {
    try {
      const exportData = {
        userId: this.userId,
        exportTimestamp: new Date().toISOString(),
        modelVersion: this.modelVersion,
        metrics: this.metrics,
        models: this.models,
        trainingData: this.trainingData,
        config: this.config,
      };
      
      return {
        success: true,
        data: exportData,
        filename: `ml_backup_${this.userId}_${Date.now()}.json`
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Import user data from backup
  async importUserData(importData) {
    try {
      if (!importData || importData.userId !== this.userId) {
        return { success: false, error: 'Invalid import data or user ID mismatch' };
      }
      
      this.models = importData.models || this.models;
      this.trainingData = importData.trainingData || this.trainingData;
      this.metrics = importData.metrics || this.metrics;
      this.config = { ...this.config, ...importData.config };
      
      await this.saveModels();
      await this.saveTrainingData();
      
      console.log('✅ User ML data imported successfully');
      return { 
        success: true, 
        samplesImported: this.trainingData.deviceUsage.length 
      };
    } catch (error) {
      console.error('Error importing user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Collect device data for training
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
    
    return hoursSinceLastTrain >= (this.config.retrainInterval / (1000 * 60 * 60)) ||
           this.trainingData.deviceUsage.length >= this.config.minDataPoints;
  }

  // Enhanced trainModels with real simulation data processing
  async trainModels() {
    try {
      console.log('🎓 Starting model training with simulation data...');
      
      if (this.trainingData.deviceUsage.length < this.config.minDataPoints) {
        return { 
          success: false, 
          error: `Not enough data. Have ${this.trainingData.deviceUsage.length}, need ${this.config.minDataPoints}` 
        };
      }

      const startTime = Date.now();

      // PROCESS REAL SIMULATION DATA
      const patterns = this.analyzeUsagePatterns();
      const userBehavior = this.analyzeUserBehavior();
      const costPatterns = this.analyzeCostPatterns();
      
      // Build actual models from simulation data
      this.models.usagePatterns = {
        version: this.modelVersion,
        trainedAt: new Date().toISOString(),
        dataPoints: this.trainingData.deviceUsage.length,
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
      };

      this.models.costOptimization = {
        version: this.modelVersion,
        trainedAt: new Date().toISOString(),
        costPatterns: costPatterns.hourlyCosts,
        savingsOpportunities: costPatterns.savingsOpportunities,
        optimalSchedules: costPatterns.optimalSchedules,
      };

      this.models.anomalyDetection = {
        version: this.modelVersion,
        trainedAt: new Date().toISOString(),
        normalRanges: this.calculateNormalRanges(),
        anomalyThresholds: this.calculateAnomalyThresholds(),
      };

      // Calculate real accuracy based on pattern consistency
      const accuracy = this.calculateModelAccuracy(patterns);
      
      // Update metrics
      this.metrics.accuracy = accuracy;
      this.metrics.lastTrainedAt = new Date().toISOString();
      this.metrics.trainingTime = Date.now() - startTime;

      console.log(`✅ Models trained with ${this.trainingData.deviceUsage.length} samples (accuracy: ${(accuracy * 100).toFixed(1)}%)`);
      
      return { 
        success: true, 
        accuracy: accuracy,
        trainingTime: this.metrics.trainingTime,
        patternsDiscovered: Object.keys(patterns.devicePatterns).length,
        peakHours: patterns.peakHours,
      };
    } catch (error) {
      console.error('Error training models:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced getPredictions using real simulation patterns
  getPredictions(appliances, horizon = 24) {
    if (!this.initialized || !this.models.usagePatterns) {
      return [];
    }

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;
    
    const predictions = appliances.map(device => {
      const devicePattern = this.models.usagePatterns.devicePatterns[device.id];
      
      if (!devicePattern) {
        // No pattern data, use fallback
        return {
          deviceId: device.id,
          deviceName: device.name,
          prediction: {
            willBeActive: false,
            probability: 0.3,
            expectedPower: 0,
            confidence: 0.1,
          },
          timeHorizon: horizon,
          timestamp: new Date().toISOString(),
        };
      }

      // Use actual pattern data for prediction
      const baseProbability = isWeekend ? 
        devicePattern.weekendProbabilities[currentHour] : 
        devicePattern.weekdayProbabilities[currentHour];
      
      // Adjust probability based on recent trends and correlations
      const adjustedProbability = this.adjustProbabilityWithContext(
        device.id, 
        baseProbability, 
        currentHour, 
        isWeekend
      );
      
      const willBeActive = adjustedProbability > 0.5;
      const confidence = Math.min(0.95, this.calculatePredictionConfidence(devicePattern, currentHour));

      return {
        deviceId: device.id,
        deviceName: device.name,
        prediction: {
          willBeActive,
          probability: adjustedProbability,
          expectedPower: willBeActive ? (device.current_power || device.normal_usage) : 0,
          confidence: confidence,
          basedOnSamples: devicePattern.totalSamples,
        },
        timeHorizon: horizon,
        timestamp: new Date().toISOString(),
        patternInfo: {
          typicalHours: devicePattern.typicalUsageHours,
          averagePower: devicePattern.averagePower,
        },
      };
    });

    this.metrics.predictionsMade += predictions.length;
    
    return predictions;
  }

  // Enhanced getRecommendations using real simulation insights
  getRecommendations(appliances) {
    if (!this.initialized) {
      return [];
    }

    const recommendations = [];
    const currentHour = new Date().getHours();

    // 1. Peak hour recommendations based on ACTUAL peak hours from simulation
    if (this.models.usagePatterns && this.models.usagePatterns.peakHours) {
      const actualPeakHours = this.models.usagePatterns.peakHours;
      
      if (actualPeakHours.includes(currentHour)) {
        const highUsageDevices = appliances.filter(device => {
          const pattern = this.models.usagePatterns.devicePatterns[device.id];
          return device.status === 'on' && 
                 pattern && 
                 pattern.averagePower > 200 &&
                 pattern.typicalUsageHours.includes(currentHour);
        });

        if (highUsageDevices.length > 0) {
          const totalPower = highUsageDevices.reduce((sum, device) => 
            sum + (device.current_power || device.normal_usage), 0
          );
          const hourlyCost = (totalPower / 1000) * 2.50;
          const monthlySavings = hourlyCost * 30 * 0.2; // 20% savings estimate

          recommendations.push({
            type: 'peak_hours_optimization',
            priority: 'high',
            suggestion: `Reduce usage of ${highUsageDevices.length} high-power devices during peak hour ${currentHour}:00`,
            devices: highUsageDevices.map(d => d.id),
            potentialSavings: Math.round(monthlySavings),
            data: {
              peakHour: currentHour,
              totalPower,
              affectedDevices: highUsageDevices.length,
            },
          });
        }
      }
    }

    // 2. Always-on device optimization based on ACTUAL usage patterns
    if (this.models.usagePatterns) {
      const alwaysOnDevices = Object.entries(this.models.usagePatterns.devicePatterns)
        .filter(([deviceId, pattern]) => 
          pattern.alwaysOn && 
          pattern.averagePower > 50 &&
          appliances.some(d => d.id === deviceId && d.status === 'on')
        )
        .map(([deviceId, pattern]) => ({
          deviceId,
          pattern,
          device: appliances.find(d => d.id === deviceId),
        }));

      if (alwaysOnDevices.length > 0) {
        const monthlySavings = alwaysOnDevices.reduce((sum, item) => {
          const dailyCost = (item.pattern.averagePower / 1000) * 24 * 2.50;
          return sum + (dailyCost * 30 * 0.3); // 30% potential savings
        }, 0);

        recommendations.push({
          type: 'always_on_devices',
          priority: 'medium',
          suggestion: `${alwaysOnDevices.length} devices appear to be always on. Consider smart plugs for scheduled control`,
          devices: alwaysOnDevices.map(d => d.deviceId),
          potentialSavings: Math.round(monthlySavings),
          data: {
            devices: alwaysOnDevices.map(d => ({
              id: d.deviceId,
              type: d.pattern.deviceType,
              power: d.pattern.averagePower,
            })),
          },
        });
      }
    }

    // 3. Device correlation recommendations
    if (this.models.usagePatterns && this.models.usagePatterns.deviceCorrelations) {
      const highCorrelations = Object.values(this.models.usagePatterns.deviceCorrelations)
        .filter(corr => corr.correlation > 0.7)
        .slice(0, 3);

      highCorrelations.forEach(correlation => {
        const [device1, device2] = correlation.devices;
        const device1Obj = appliances.find(d => d.id === device1);
        const device2Obj = appliances.find(d => d.id === device2);

        if (device1Obj && device2Obj) {
          recommendations.push({
            type: 'device_automation',
            priority: 'low',
            suggestion: `Consider automating ${device1Obj.name} and ${device2Obj.name} together (they're often used simultaneously)`,
            devices: [device1, device2],
            potentialSavings: 15, // Rough estimate
            data: {
              correlation: Math.round(correlation.correlation * 100),
              togetherCount: correlation.togetherCount,
            },
          });
        }
      });
    }

    // 4. Cost optimization from cost patterns
    if (this.models.costOptimization && this.models.costOptimization.savingsOpportunities) {
      const topSavings = this.models.costOptimization.savingsOpportunities
        .filter(opp => opp.monthlySavings > 10)
        .slice(0, 2);

      topSavings.forEach(opportunity => {
        const device = appliances.find(d => d.id === opportunity.deviceId);
        if (device) {
          recommendations.push({
            type: 'cost_optimization',
            priority: 'high',
            suggestion: opportunity.recommendation,
            devices: [opportunity.deviceId],
            potentialSavings: Math.round(opportunity.monthlySavings),
            data: {
              currentCost: opportunity.currentCost,
              potentialCost: opportunity.potentialCost,
              peakHours: opportunity.peakHours,
            },
          });
        }
      });
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  // Detect anomalies in current appliance states
  detectAnomalies(appliances) {
    if (!this.initialized || !this.models.anomalyDetection) {
      return { hasAnomaly: false, anomalies: [] };
    }

    const anomalies = [];
    const currentHour = new Date().getHours();
    const totalPower = appliances
      .filter(device => device.status === 'on')
      .reduce((sum, device) => sum + (device.current_power || device.normal_usage), 0);

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

    // Check hourly normal range
    const hourlyRange = this.models.anomalyDetection.normalRanges.hourlyRanges[currentHour];
    if (hourlyRange && totalPower > hourlyRange.max) {
      anomalies.push({
        type: 'unusual_hourly_usage',
        severity: 'medium',
        message: `Higher than normal power usage for ${currentHour}:00 (${totalPower}W vs expected max ${Math.round(hourlyRange.max)}W)`,
        currentValue: totalPower,
        expectedRange: [0, hourlyRange.max],
      });
    }

    // Check for devices that shouldn't be on at this time
    if (this.models.usagePatterns) {
      appliances.forEach(device => {
        if (device.status === 'on') {
          const pattern = this.models.usagePatterns.devicePatterns[device.id];
          if (pattern) {
            const typicalUsage = pattern.hourlyProbabilities[currentHour];
            if (typicalUsage < 0.1) {
              anomalies.push({
                type: 'unusual_operation',
                severity: 'medium',
                message: `${device.name} is on at an unusual time (typically ${Math.round(typicalUsage * 100)}% active at this hour)`,
                deviceId: device.id,
                deviceName: device.name,
                confidence: 0.7,
              });
            }
          }
        }
      });
    }

    return {
      hasAnomaly: anomalies.length > 0,
      anomalies,
      checkedAt: new Date().toISOString(),
    };
  }

  // Get energy forecast
  getEnergyForecast(appliances, hours = 12) {
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
      const expectedPower = this.getExpectedPowerForHour(hour, appliances);
      const energyKwh = (expectedPower * 1) / 1000; // Energy for 1 hour in kWh
      const cost = energyKwh * 2.50; // Assuming R2.50 per kWh
      
      forecast.push({
        hour,
        hourLabel: `${hour}:00`,
        expectedPower: Math.round(expectedPower),
        energyKwh: Math.round(energyKwh * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        confidence: Math.min(0.8, this.metrics.accuracy),
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
    };
  }

  // Get model metrics
  getModelMetrics() {
    return {
      accuracy: this.metrics.accuracy,
      lastTrainedAt: this.metrics.lastTrainedAt,
      predictionsMade: this.metrics.predictionsMade,
      correctPredictions: this.metrics.correctPredictions,
      trainingDataSize: this.trainingData.deviceUsage.length,
      userActionsCount: this.trainingData.userActions.length,
      models: Object.keys(this.models).filter(key => this.models[key] !== null).length,
      userId: this.userId,
    };
  }

  // Get prediction confidence
  getPredictionConfidence() {
    return this.metrics.accuracy;
  }

  // Get smart schedule for a device
  getSmartSchedule(deviceId, days = 1) {
    if (!this.initialized) {
      return { success: false, recommendedSlots: [] };
    }

    const deviceHistory = this.trainingData.deviceUsage
      .flatMap(entry => entry.devices)
      .filter(d => d.id === deviceId);

    if (deviceHistory.length === 0) {
      return { success: false, recommendedSlots: [] };
    }

    // Calculate optimal usage times based on historical patterns and cost
    const recommendedSlots = [];
    const currentHour = new Date().getHours();

    for (let hour = 0; hour < 24; hour++) {
      const usageProb = this.calculateHourlyUsageProbability(deviceHistory, hour);
      const isOffPeak = ![17, 18, 19, 20, 21].includes(hour); // Not peak hours
      const score = usageProb * (isOffPeak ? 1.2 : 0.8);

      if (score > 0.6) {
        recommendedSlots.push({
          hour,
          timeLabel: `${hour}:00`,
          probability: usageProb,
          costMultiplier: isOffPeak ? 0.8 : 1.2,
          savingsPercent: isOffPeak ? 20 : 0,
          score,
        });
      }
    }

    // Sort by score and return top slots
    recommendedSlots.sort((a, b) => b.score - a.score);

    return {
      success: true,
      recommendedSlots: recommendedSlots.slice(0, 6), // Top 6 slots
      deviceId,
      confidence: this.metrics.accuracy,
    };
  }

  // CORE ANALYSIS METHODS

  // Analyze usage patterns from simulation data
  analyzeUsagePatterns() {
    const devicePatterns = {};
    const hourlyPatterns = {};
    const dailyPatterns = { weekday: {}, weekend: {} };
    const deviceCorrelations = {};
    
    // Initialize structures
    for (let hour = 0; hour < 24; hour++) {
      hourlyPatterns[hour] = { totalSamples: 0, totalPower: 0, activeDevices: 0 };
    }

    // Process each simulation sample
    this.trainingData.deviceUsage.forEach(entry => {
      const hour = entry.hour;
      const isWeekend = entry.isWeekend;
      const dayType = isWeekend ? 'weekend' : 'weekday';
      
      // Update hourly patterns
      hourlyPatterns[hour].totalSamples++;
      hourlyPatterns[hour].totalPower += entry.totalPower;
      hourlyPatterns[hour].activeDevices += entry.activeDeviceCount;
      
      // Update daily patterns
      if (!dailyPatterns[dayType][hour]) {
        dailyPatterns[dayType][hour] = { totalSamples: 0, totalPower: 0 };
      }
      dailyPatterns[dayType][hour].totalSamples++;
      dailyPatterns[dayType][hour].totalPower += entry.totalPower;
      
      // Update device patterns
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
        
        // Hourly activity
        pattern.hourlyActivity[hour].samples++;
        if (device.isActive) {
          pattern.activeSamples++;
          pattern.hourlyActivity[hour].active++;
          pattern.averagePower += device.power;
          
          // Daily activity
          pattern.dailyActivity[dayType][hour]++;
        }
      });
    });

    // Calculate probabilities and identify patterns
    Object.keys(devicePatterns).forEach(deviceId => {
      const pattern = devicePatterns[deviceId];
      
      // Calculate hourly probabilities
      pattern.hourlyProbabilities = pattern.hourlyActivity.map(hourData => 
        hourData.samples > 0 ? hourData.active / hourData.samples : 0
      );
      
      // Calculate daily probabilities
      pattern.weekdayProbabilities = pattern.dailyActivity.weekday.map(count => 
        count / Math.max(1, pattern.totalSamples / 14) // Approximate samples per hour
      );
      pattern.weekendProbabilities = pattern.dailyActivity.weekend.map(count => 
        count / Math.max(1, pattern.totalSamples / 14)
      );
      
      pattern.averagePower = pattern.averagePower / Math.max(1, pattern.activeSamples);
      pattern.alwaysOn = (pattern.activeSamples / pattern.totalSamples) > 0.95;
      
      // Identify typical usage hours (probability > 0.3)
      pattern.typicalUsageHours = pattern.hourlyProbabilities
        .map((prob, hour) => prob > 0.3 ? hour : -1)
        .filter(hour => hour !== -1);
    });

    // Calculate peak hours from actual data
    const hourlyAverages = Object.entries(hourlyPatterns).map(([hour, data]) => ({
      hour: parseInt(hour),
      averagePower: data.totalPower / Math.max(1, data.totalSamples),
      averageDevices: data.activeDevices / Math.max(1, data.totalSamples),
    }));
    
    hourlyAverages.sort((a, b) => b.averagePower - a.averagePower);
    const peakHours = hourlyAverages.slice(0, 6).map(h => h.hour).sort((a, b) => a - b);

    // Calculate device correlations
    this.calculateDeviceCorrelations(devicePatterns, deviceCorrelations);

    return {
      devicePatterns,
      hourlyPatterns,
      dailyPatterns,
      peakHours,
      deviceCorrelations,
    };
  }

  // Calculate correlations between devices (which devices turn on together)
  calculateDeviceCorrelations(devicePatterns, correlations) {
    const deviceIds = Object.keys(devicePatterns);
    
    deviceIds.forEach(deviceId1 => {
      deviceIds.forEach(deviceId2 => {
        if (deviceId1 !== deviceId2) {
          const key = `${deviceId1}-${deviceId2}`;
          let togetherCount = 0;
          let totalSamples = 0;
          
          // Count how often devices are active together
          this.trainingData.deviceUsage.forEach(entry => {
            const device1 = entry.devices.find(d => d.id === deviceId1);
            const device2 = entry.devices.find(d => d.id === deviceId2);
            
            if (device1 && device2) {
              totalSamples++;
              if (device1.isActive && device2.isActive) {
                togetherCount++;
              }
            }
          });
          
          if (totalSamples > 10) { // Only consider if we have enough data
            const correlation = togetherCount / totalSamples;
            if (correlation > 0.3) { // Only store significant correlations
              correlations[key] = {
                devices: [deviceId1, deviceId2],
                correlation: correlation,
                togetherCount,
                totalSamples,
              };
            }
          }
        }
      });
    });
  }

  // Analyze user behavior patterns
  analyzeUserBehavior() {
    const actionPatterns = {};
    const preferredHours = {};
    const automationOpportunities = [];
    
    this.trainingData.userActions.forEach(action => {
      const deviceId = action.deviceId;
      
      if (!actionPatterns[deviceId]) {
        actionPatterns[deviceId] = {
          totalActions: 0,
          toggleOn: 0,
          toggleOff: 0,
          hourlyActions: Array(24).fill(0),
          manualActions: 0,
          automatedActions: 0,
        };
      }
      
      const pattern = actionPatterns[deviceId];
      pattern.totalActions++;
      
      if (action.action === 'toggle_on') pattern.toggleOn++;
      if (action.action === 'toggle_off') pattern.toggleOff++;
      
      pattern.hourlyActions[action.hour]++;
      
      if (action.context?.manual) pattern.manualActions++;
      else pattern.automatedActions++;
      
      // Track preferred hours for each device
      if (!preferredHours[deviceId]) preferredHours[deviceId] = [];
      if (!preferredHours[deviceId].includes(action.hour)) {
        preferredHours[deviceId].push(action.hour);
      }
    });
    
    // Identify automation opportunities (devices with consistent manual patterns)
    Object.entries(actionPatterns).forEach(([deviceId, pattern]) => {
      if (pattern.manualActions > 5) {
        const consistency = this.calculateActionConsistency(pattern.hourlyActions);
        if (consistency > 0.7) {
          automationOpportunities.push({
            deviceId,
            consistency,
            preferredHours: preferredHours[deviceId],
            manualActions: pattern.manualActions,
          });
        }
      }
    });
    
    return {
      actionPatterns,
      preferredHours,
      automationOpportunities,
    };
  }

  // Analyze cost patterns and savings opportunities
  analyzeCostPatterns() {
    const hourlyCosts = Array(24).fill(0).map(() => ({ samples: 0, totalCost: 0 }));
    const savingsOpportunities = [];
    const optimalSchedules = {};
    
    // Calculate hourly costs (assuming R2.50 per kWh)
    this.trainingData.deviceUsage.forEach(entry => {
      const hour = entry.hour;
      const cost = (entry.totalPower / 1000) * 2.50; // Convert watts to kW, then to cost
      
      hourlyCosts[hour].samples++;
      hourlyCosts[hour].totalCost += cost;
    });
    
    // Calculate average hourly costs
    const averageHourlyCosts = hourlyCosts.map((data, hour) => ({
      hour,
      averageCost: data.samples > 0 ? data.totalCost / data.samples : 0,
      samples: data.samples,
    }));
    
    // Identify peak cost hours
    averageHourlyCosts.sort((a, b) => b.averageCost - a.averageCost);
    const peakCostHours = averageHourlyCosts.slice(0, 4).map(h => h.hour);
    
    // Find savings opportunities
    if (this.models.usagePatterns) {
      Object.entries(this.models.usagePatterns.devicePatterns).forEach(([deviceId, pattern]) => {
        const peakUsage = pattern.typicalUsageHours.filter(hour => 
          peakCostHours.includes(hour)
        );
        
        if (peakUsage.length > 0 && pattern.averagePower > 200) {
          const potentialSavings = this.calculatePotentialSavings(deviceId, pattern, peakCostHours);
          if (potentialSavings.monthlySavings > 5) { // Only suggest if savings > R5
            savingsOpportunities.push({
              deviceId,
              deviceType: pattern.deviceType,
              peakHours: peakUsage,
              currentCost: potentialSavings.currentCost,
              potentialCost: potentialSavings.potentialCost,
              monthlySavings: potentialSavings.monthlySavings,
              recommendation: `Shift ${pattern.deviceType} usage away from peak hours (${peakUsage.join(', ')})`
            });
          }
        }
      });
    }
    
    // Calculate optimal schedules for each device
    if (this.models.usagePatterns) {
      Object.entries(this.models.usagePatterns.devicePatterns).forEach(([deviceId, pattern]) => {
        const optimalHours = this.findOptimalUsageHours(pattern, averageHourlyCosts);
        optimalSchedules[deviceId] = {
          deviceId,
          optimalHours,
          costReduction: this.calculateCostReduction(pattern, optimalHours, averageHourlyCosts),
        };
      });
    }
    
    return {
      hourlyCosts: averageHourlyCosts,
      peakCostHours,
      savingsOpportunities,
      optimalSchedules,
    };
  }

  // HELPER METHODS

  calculateModelAccuracy(patterns) {
    let totalConsistency = 0;
    let deviceCount = 0;
    
    Object.values(patterns.devicePatterns).forEach(pattern => {
      // Calculate how consistent the pattern is (higher variance = lower consistency)
      const probabilities = pattern.hourlyProbabilities.filter(p => p > 0 && p < 1);
      if (probabilities.length > 0) {
        const mean = probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length;
        const variance = probabilities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / probabilities.length;
        const consistency = 1 - Math.min(1, variance * 2); // Lower variance = higher consistency
        totalConsistency += consistency;
        deviceCount++;
      }
    });
    
    return deviceCount > 0 ? totalConsistency / deviceCount : 0.7;
  }

  calculateActionConsistency(hourlyActions) {
    const totalActions = hourlyActions.reduce((sum, count) => sum + count, 0);
    if (totalActions === 0) return 0;
    
    // Calculate how concentrated actions are in specific hours
    const maxActions = Math.max(...hourlyActions);
    return maxActions / totalActions;
  }

  calculatePotentialSavings(deviceId, pattern, peakCostHours) {
    const peakUsageHours = pattern.typicalUsageHours.filter(hour => peakCostHours.includes(hour));
    const offPeakUsageHours = pattern.typicalUsageHours.filter(hour => !peakCostHours.includes(hour));
    
    if (peakUsageHours.length === 0) return { currentCost: 0, potentialCost: 0, monthlySavings: 0 };
    
    // Calculate current cost (using peak rates)
    const peakUsage = peakUsageHours.length * pattern.averagePower;
    const currentDailyCost = (peakUsage / 1000) * 2.50; // Peak rate
    
    // Calculate potential cost (using off-peak rates)
    const potentialDailyCost = (peakUsage / 1000) * 2.00; // Off-peak rate assumption
    
    return {
      currentCost: Math.round(currentDailyCost * 30),
      potentialCost: Math.round(potentialDailyCost * 30),
      monthlySavings: Math.round((currentDailyCost - potentialDailyCost) * 30),
    };
  }

  findOptimalUsageHours(pattern, hourlyCosts) {
    // Find hours with high usage probability but low cost
    const scores = hourlyCosts.map((costData, hour) => ({
      hour,
      score: pattern.hourlyProbabilities[hour] * (1 - (costData.averageCost / Math.max(0.1, Math.max(...hourlyCosts.map(c => c.averageCost))))),
      probability: pattern.hourlyProbabilities[hour],
      cost: costData.averageCost,
    }));
    
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, 4).map(s => s.hour).sort((a, b) => a - b);
  }

  calculateCostReduction(pattern, optimalHours, hourlyCosts) {
    const currentCost = pattern.typicalUsageHours.reduce((sum, hour) => 
      sum + (pattern.averagePower / 1000) * hourlyCosts[hour].averageCost, 0
    );
    
    const optimalCost = optimalHours.reduce((sum, hour) => 
      sum + (pattern.averagePower / 1000) * hourlyCosts[hour].averageCost, 0
    );
    
    return currentCost - optimalCost;
  }

  adjustProbabilityWithContext(deviceId, baseProbability, hour, isWeekend) {
    // Consider device correlations
    let adjustment = 0;
    
    if (this.models.usagePatterns && this.models.usagePatterns.deviceCorrelations) {
      Object.values(this.models.usagePatterns.deviceCorrelations).forEach(correlation => {
        if (correlation.devices.includes(deviceId)) {
          const otherDeviceId = correlation.devices.find(id => id !== deviceId);
          // If correlated device is typically active at this hour, increase probability
          const otherPattern = this.models.usagePatterns.devicePatterns[otherDeviceId];
          if (otherPattern) {
            const otherProb = isWeekend ? 
              otherPattern.weekendProbabilities[hour] : 
              otherPattern.weekdayProbabilities[hour];
            adjustment += correlation.correlation * otherProb * 0.1;
          }
        }
      });
    }
    
    return Math.max(0, Math.min(1, baseProbability + adjustment));
  }

  calculatePredictionConfidence(pattern, hour) {
    const samplesAtHour = pattern.hourlyActivity[hour].samples;
    const totalSamples = pattern.totalSamples;
    
    // Confidence based on data quantity and pattern consistency
    const dataConfidence = Math.min(1, samplesAtHour / 10);
    const patternStrength = Math.abs(pattern.hourlyProbabilities[hour] - 0.5) * 2; // How far from 50/50
    
    return (dataConfidence * 0.7) + (patternStrength * 0.3);
  }

  calculateNormalRanges() {
    const powerValues = this.trainingData.deviceUsage.map(entry => entry.totalPower);
    const deviceCounts = this.trainingData.deviceUsage.map(entry => entry.activeDeviceCount);
    
    const avgPower = powerValues.reduce((sum, power) => sum + power, 0) / powerValues.length;
    const avgDevices = deviceCounts.reduce((sum, count) => sum + count, 0) / deviceCounts.length;
    
    const powerStdDev = Math.sqrt(
      powerValues.reduce((sum, power) => sum + Math.pow(power - avgPower, 2), 0) / powerValues.length
    );
    
    const deviceStdDev = Math.sqrt(
      deviceCounts.reduce((sum, count) => sum + Math.pow(count - avgDevices, 2), 0) / deviceCounts.length
    );
    
    return {
      power: { min: 0, max: avgPower + (2 * powerStdDev) },
      devices: { min: 0, max: avgDevices + (2 * deviceStdDev) },
      hourlyRanges: this.calculateHourlyNormalRanges(),
    };
  }

  calculateHourlyNormalRanges() {
    const ranges = {};
    
    for (let hour = 0; hour < 24; hour++) {
      const hourData = this.trainingData.deviceUsage
        .filter(entry => entry.hour === hour)
        .map(entry => entry.totalPower);
      
      if (hourData.length > 0) {
        const avg = hourData.reduce((sum, power) => sum + power, 0) / hourData.length;
        const stdDev = Math.sqrt(
          hourData.reduce((sum, power) => sum + Math.pow(power - avg, 2), 0) / hourData.length
        );
        
        ranges[hour] = { min: 0, max: avg + (2 * stdDev) };
      }
    }
    
    return ranges;
  }

  calculateAnomalyThresholds() {
    if (this.trainingData.deviceUsage.length === 0) {
      return { power: 1000, deviceCount: 5 };
    }

    const powerValues = this.trainingData.deviceUsage.map(entry => entry.totalPower);
    const avgPower = powerValues.reduce((sum, power) => sum + power, 0) / powerValues.length;
    
    return {
      power: avgPower * 2,
      deviceCount: Math.max(5, this.getMaxConcurrentDevices() * 1.5),
    };
  }

  getExpectedPowerForHour(hour, appliances) {
    const hourData = this.trainingData.deviceUsage.filter(entry => entry.hour === hour);
    if (hourData.length === 0) {
      // Fallback: estimate based on device types and typical usage
      return appliances.reduce((sum, device) => {
        const pattern = this.models.usagePatterns?.devicePatterns[device.id];
        const typicalUsage = pattern ? pattern.hourlyProbabilities[hour] : 0.3;
        return sum + (device.normal_usage * typicalUsage);
      }, 0);
    }
    
    return hourData.reduce((sum, entry) => sum + entry.totalPower, 0) / hourData.length;
  }

  calculateHourlyUsageProbability(deviceHistory, targetHour) {
    const hourData = deviceHistory.filter(d => {
      const deviceHour = new Date(d.timestamp).getHours();
      return deviceHour === targetHour;
    });
    
    if (hourData.length === 0) return 0.3;
    
    return hourData.filter(d => d.isActive).length / hourData.length;
  }

  getMaxConcurrentDevices() {
    return Math.max(...this.trainingData.deviceUsage.map(entry => entry.activeDeviceCount));
  }

  // Update the getMLInsights to include user info
  getMLInsights(appliances) {
    if (!this.initialized) {
      return {
        ready: false,
        message: 'ML Engine is still learning your patterns',
        dataProgress: Math.min(100, (this.trainingData.deviceUsage.length / this.config.minDataPoints) * 100),
        userId: this.userId,
        userSpecific: true,
      };
    }
    
    return {
      ready: true,
      accuracy: this.metrics.accuracy,
      lastTrained: this.metrics.lastTrainedAt,
      dataSamples: this.trainingData.deviceUsage.length,
      predictions: this.getPredictions(appliances),
      recommendations: this.getRecommendations(appliances),
      anomalies: this.detectAnomalies(appliances),
      userId: this.userId,
      userSpecific: true,
    };
  }
}

export default MLEngine;