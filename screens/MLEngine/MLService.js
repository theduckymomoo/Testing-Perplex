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

  // Safe method calls that check for engine availability
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

  // Safe data collection
  async collectData(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) { 
      console.warn('⚠️ ML Engine not available for data collection');
      return; 
    }
    
    try {
      const deviceList = Array.isArray(appliances) ? appliances : [];
      await engine.collectDeviceData(deviceList);
      
      const min = this.simulationEnabled ? 
        Math.max(20, engine.config.minDataPoints * 0.3) : 
        engine.config.minDataPoints;
        
      if (this.config.autoTrainEnabled && 
          engine.trainingData.deviceUsage.length >= min && 
          engine.shouldRetrain()) {
        console.log('🔄 Auto-retraining triggered');
        await this.trainModels();
      }
    } catch (error) { 
      console.error('Error collecting data:', error); 
    }
  }

  // Safe model training
  async trainModels() {
    const engine = this.getCurrentEngine();
    if (!engine) return { success: false, error: 'ML Engine not available' };
    
    try {
      console.log('🎓 Starting ML model training...');
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

  // Safe predictions with fallback
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

  // Safe recommendations with fallback
  getRecommendations(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for recommendations');
      return [];
    }
    const deviceList = Array.isArray(appliances) ? appliances : [];
    return engine.getRecommendations(deviceList);
  }

  // Safe anomaly detection with fallback
  detectAnomalies(appliances) {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for anomaly detection');
      return { hasAnomaly: false, anomalies: [] };
    }
    const deviceList = Array.isArray(appliances) ? appliances : [];
    return engine.detectAnomalies(deviceList);
  }

  // Safe energy forecast with fallback
  getEnergyForecast(appliances, hours = 12) {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for energy forecast');
      return { 
        success: false, 
        forecast: [], 
        totalExpectedEnergy: 0, 
        totalExpectedCost: 0 
      };
    }
    
    if (engine.getEnergyForecast) {
      const deviceList = Array.isArray(appliances) ? appliances : [];
      return engine.getEnergyForecast(deviceList, hours);
    } else {
      console.warn('getEnergyForecast not available, returning default');
      return { 
        success: false, 
        forecast: [], 
        totalExpectedEnergy: 0, 
        totalExpectedCost: 0 
      };
    }
  }

  // Safe metrics with fallback
  getModelMetrics() {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for metrics');
      return { 
        success: false, 
        error: 'ML Engine not available',
        userId: this.currentUserId 
      };
    }
    
    try {
      const metrics = engine.getModelMetrics();
      return { success: true, ...metrics, userId: this.currentUserId };
    } catch (error) {
      console.error('Error getting model metrics:', error);
      return { success: false, error: error.message, userId: this.currentUserId };
    }
  }

  // Safe training progress with fallback
  getTrainingProgress() {
    const engine = this.getCurrentEngine();
    if (!engine) {
      console.warn('⚠️ No ML engine available for training progress');
      return { 
        progress: 0, 
        status: 'not_initialized', 
        current: 0,
        required: 50,
        canTrain: false,
        userId: this.currentUserId,
        simulation: { enabled: this.simulationEnabled }
      };
    }
    
    const current = engine.trainingData.deviceUsage.length;
    const required = this.simulationEnabled ? 
      Math.max(20, engine.config.minDataPoints * 0.5) : 
      engine.config.minDataPoints;
      
    const progress = Math.min(100, (current / required) * 100);
    
    return {
      progress: Math.round(progress),
      current,
      required,
      status: progress >= 100 ? 'ready' : 'collecting',
      canTrain: current >= required,
      userId: this.currentUserId,
      simulation: {
        enabled: this.simulationEnabled,
        isSimulating: this.isSimulating,
        simulatedSamples: current,
        simulatedDays: Math.floor(current / 24),
      },
    };
  }

  // Safe insights with fallback (FIXED)
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

  // Get current user ID
  getCurrentUserId() {
    return this.currentUserId;
  }

  // Check if any user is set
  hasCurrentUser() {
    return !!this.currentUserId && !!this.currentEngine;
  }

  // The rest of your existing methods remain the same but updated to use getCurrentEngine()
  // ... (initializeSimulation, startSimulation, fastForwardSimulation, etc.)

  initializeSimulation(appliances) {
    if (!this.simulationEnabled) return { success: false, error: 'Simulation not enabled' };
    
    const engine = this.getCurrentEngine();
    if (!engine) return { success: false, error: 'ML Engine not available' };
    
    this.currentAppliances = Array.isArray(appliances) ? appliances : [];
    console.log('🎮 Simulation initialized for ML training');
    return { 
      success: true, 
      simulatedAppliances: this.currentAppliances, 
      status: { enabled: true, isSimulating: false } 
    };
  }

  async startSimulation(speed = 24, onUpdate = null) {
    if (!this.simulationEnabled) return { success: false, error: 'Simulation not enabled' };
    if (!this.hasCurrentUser()) return { success: false, error: 'No user selected for simulation' };
    
    this.isSimulating = true;
    console.log(`🚀 ML Simulation started at ${speed}x speed for user: ${this.currentUserId}`);
    
    this.simulationInterval = setInterval(() => {
      if (this.currentAppliances.length > 0 && this.isSimulating) {
        this.collectData(this.currentAppliances);
        if (onUpdate) {
          onUpdate({
            samples: this.currentEngine.trainingData.deviceUsage.length,
            progress: this.getTrainingProgress().progress
          });
        }
      }
    }, 1000);
    
    return { 
      success: true, 
      simulatedAppliances: this.currentAppliances, 
      status: { enabled: true, isSimulating: true } 
    };
  }

  async fastForwardSimulation(days = 7, onProgress = null) {
    if (!this.simulationEnabled) return { success: false, error: 'Simulation not enabled' };
    if (!this.hasCurrentUser()) return { success: false, error: 'No user selected for simulation' };
    
    console.log(`⏩ ML Fast-forwarding ${days} days for training data...`);
    
    const totalSamples = days * 24;
    let samplesGenerated = 0;
    
    for (let day = 0; day < days; day++) {
      const dayData = this.generateSimulatedData(1, day);
      
      await this.injectSimulationData({
        deviceUsage: dayData,
        userActions: this.generateSimulatedUserActions(day),
        totalSamples: dayData.length,
        simulatedDays: day + 1
      });
      
      samplesGenerated += dayData.length;
      
      if (onProgress) {
        onProgress({
          day: day + 1,
          totalDays: days,
          samples: samplesGenerated,
          progress: Math.round(((day + 1) / days) * 100)
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.currentEngine.trainingData.deviceUsage.length >= this.currentEngine.config.minDataPoints) {
      console.log('🎓 Auto-training with simulated data...');
      await this.trainModels();
    }
    
    return { 
      success: true, 
      samplesGenerated, 
      simulatedDays: days, 
      status: this.getSimulationStatus() 
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
      await engine.collectDeviceData(deviceList);
      console.log('📊 Force collected current device data');
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

  getAllPredictions(appliances, horizon = 24) {
    return this.getPredictions(appliances, horizon);
  }

  async exportTrainingData() {
    const engine = this.getCurrentEngine();
    if (!engine) return { success: false, error: 'ML Engine not available' };
    
    try {
      const data = {
        deviceUsage: engine.trainingData.deviceUsage,
        userActions: engine.trainingData.userActions,
        exportTimestamp: Date.now(),
        totalSamples: engine.trainingData.deviceUsage.length,
        simulationEnabled: this.simulationEnabled,
        userId: this.currentUserId,
      };
      return { 
        success: true, 
        data, 
        filename: `ml_training_data_${this.currentUserId}_${Date.now()}.json` 
      };
    } catch (error) {
      console.error('Error exporting training data:', error);
      return { success: false, error: error.message };
    }
  }

  async importTrainingData(importData) {
    const engine = this.getCurrentEngine();
    if (!engine) return { success: false, error: 'ML Engine not available' };
    
    try {
      if (!importData.deviceUsage || !Array.isArray(importData.deviceUsage)) {
        return { success: false, error: 'Invalid import data format' };
      }
      engine.trainingData.deviceUsage = importData.deviceUsage;
      engine.trainingData.userActions = importData.userActions || [];
      await engine.saveTrainingData();
      console.log(`📥 Imported ${importData.deviceUsage.length} training samples`);
      return { 
        success: true, 
        samplesImported: importData.deviceUsage.length, 
        actionsImported: engine.trainingData.userActions.length 
      };
    } catch (error) {
      console.error('Error importing training data:', error);
      return { success: false, error: error.message };
    }
  }

  getSimulationStatus() {
    const engine = this.getCurrentEngine();
    const samples = engine ? engine.trainingData.deviceUsage.length : 0;
    
    return { 
      enabled: this.simulationEnabled, 
      isSimulating: this.isSimulating,
      simulatedDays: Math.floor(samples / 24),
      simulatedSamples: samples,
      userId: this.currentUserId
    };
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
    console.log(`🔄 Background data collection started (${this.config.autoCollectInterval}ms interval)`);
  }

  stopBackgroundCollection() {
    if (this.dataCollectionInterval) {
      clearInterval(this.dataCollectionInterval);
      this.dataCollectionInterval = null;
      console.log('🛑 Background data collection stopped');
    }
  }

  generateSimulatedData(days, dayOffset = 0) {
    const data = [];
    const now = new Date();
    
    for (let day = 0; day < days; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(now);
        timestamp.setDate(now.getDate() - days + day + dayOffset);
        timestamp.setHours(hour, 0, 0, 0);
        
        const isDaytime = hour >= 7 && hour <= 22;
        const isPeakTime = (hour >= 17 && hour <= 21) || (hour >= 7 && hour <= 9);
        const baseProbability = isDaytime ? 0.6 : 0.3;
        const peakMultiplier = isPeakTime ? 1.3 : 1.0;
        
        data.push({
          timestamp: timestamp.toISOString(),
          hour,
          dayOfWeek: timestamp.getDay(),
          isWeekend: timestamp.getDay() === 0 || timestamp.getDay() === 6,
          devices: this.currentAppliances.map(app => {
            const deviceProbability = baseProbability * peakMultiplier;
            const isActive = Math.random() < deviceProbability;
            return {
              id: app.id,
              type: app.type,
              room: app.room,
              status: isActive ? 'on' : 'off',
              power: app.normal_usage || 0,
              isActive,
            };
          }),
          totalPower: this.currentAppliances
            .filter(() => Math.random() < baseProbability * peakMultiplier)
            .reduce((sum, app) => sum + (app.normal_usage || 0), 0),
          activeDeviceCount: Math.floor(Math.random() * this.currentAppliances.length * baseProbability * peakMultiplier),
        });
      }
    }
    
    return data;
  }

  generateSimulatedUserActions(dayOffset = 0) {
    const actions = [];
    const now = new Date();
    
    const actionsPerDay = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < actionsPerDay; i++) {
      const timestamp = new Date(now);
      timestamp.setDate(now.getDate() - dayOffset);
      timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
      
      if (this.currentAppliances.length > 0) {
        const randomDevice = this.currentAppliances[Math.floor(Math.random() * this.currentAppliances.length)];
        const actionType = Math.random() > 0.5 ? 'toggle_on' : 'toggle_off';
        
        actions.push({
          timestamp: timestamp.toISOString(),
          hour: timestamp.getHours(),
          dayOfWeek: timestamp.getDay(),
          deviceId: randomDevice.id,
          deviceType: randomDevice.type,
          action: actionType,
        });
      }
    }
    
    return actions;
  }

  async quickSimulate(days = 1) {
    if (!this.hasCurrentUser()) return { success: false, error: 'No user selected for simulation' };
    
    console.log(`⚡ Quick simulating ${days} days...`);
    const result = await this.fastForwardSimulation(days);
    
    if (result.success) {
      console.log(`✅ Quick simulation complete: ${result.samplesGenerated} samples`);
      return result;
    } else {
      console.error('❌ Quick simulation failed:', result.error);
      return result;
    }
  }

  // NEW: Clear all user data for testing
  async clearUserData() {
    const engine = this.getCurrentEngine();
    if (!engine) {
      return { success: false, error: 'ML Engine not available' };
    }
    
    try {
      console.log('🗑️ Clearing all ML training data...');
      
      // Clear engine data
      engine.trainingData = {
        deviceUsage: [],
        userActions: [],
        contextData: [],
        costData: [],
      };
      
      // Reset models
      engine.models = {
        usagePatterns: null,
        userBehavior: null,
        costOptimization: null,
        anomalyDetection: null,
      };
      
      // Reset metrics
      engine.metrics = {
        accuracy: 0,
        lastTrainedAt: null,
        predictionsMade: 0,
        correctPredictions: 0,
        userId: this.currentUserId,
      };
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([engine.storageKey, engine.dataKey, engine.settingsKey]);
      
      console.log('✅ All ML data cleared successfully');
      return { success: true, message: 'All training data cleared' };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error: error.message };
    }
  }

  // NEW: Reset everything for testing
  async resetMLForTesting() {
    await this.clearUserData();
    // Reinitialize with clean state
    await this.initialize();
    return { success: true, message: 'ML reset for testing' };
  }
}

const mlService = new MLService();
export default mlService;
