// SimulationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class SimulationService {
  constructor() {
    this.isSimulating = false;
    this.simulationSpeed = 24; // hours per minute
    this.currentSimulationTime = null;
    this.simulationInterval = null;
    this.onUpdateCallback = null;
    this.simulatedAppliances = [];
    this.simulationHistory = [];
  }

  /**
   * Initialize simulation with current appliances
   */
  initializeSimulation(appliances) {
    this.simulatedAppliances = JSON.parse(JSON.stringify(appliances));
    this.currentSimulationTime = new Date();
    this.simulationHistory = [];
    
    console.log('🎮 Simulation initialized with', appliances.length, 'devices');
    return this.simulatedAppliances;
  }

  /**
   * Start simulation - time will advance rapidly
   */
  startSimulation(speed = 24, onUpdate = null) {
    if (this.isSimulating) {
      console.log('⚠️ Simulation already running');
      return;
    }

    this.simulationSpeed = speed;
    this.onUpdateCallback = onUpdate;
    this.isSimulating = true;

    console.log(`🚀 Starting simulation at ${speed}x speed`);

    // Update every second (simulated time advances by speed/60 hours per second)
    this.simulationInterval = setInterval(() => {
      this.advanceTime();
      this.simulateUsagePatterns();
      this.updateDeviceStates();
      
      if (this.onUpdateCallback) {
        this.onUpdateCallback({
          appliances: this.simulatedAppliances,
          currentTime: this.currentSimulationTime,
          simulatedDays: this.getSimulatedDays()
        });
      }
    }, 1000);

    return this.simulatedAppliances;
  }

  /**
   * Stop simulation
   */
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating = false;
    console.log('⏸️ Simulation stopped');
  }

  /**
   * Advance simulated time
   */
  advanceTime() {
    const hoursToAdvance = this.simulationSpeed / 60; // hours per second
    this.currentSimulationTime = new Date(
      this.currentSimulationTime.getTime() + (hoursToAdvance * 60 * 60 * 1000)
    );
  }

  /**
   * Get number of simulated days
   */
  getSimulatedDays() {
    const startTime = new Date(this.currentSimulationTime);
    startTime.setDate(startTime.getDate() - 1);
    return Math.floor((this.currentSimulationTime - startTime) / (24 * 60 * 60 * 1000));
  }

  /**
   * Simulate realistic usage patterns based on device type and time
   */
  simulateUsagePatterns() {
    const hour = this.currentSimulationTime.getHours();
    const dayOfWeek = this.currentSimulationTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    this.simulatedAppliances.forEach(appliance => {
      const shouldBeActive = this.shouldDeviceBeActive(appliance, hour, dayOfWeek, isWeekend);
      
      if (appliance.status === 'on' && !shouldBeActive) {
        // Device should be off based on patterns
        if (Math.random() < 0.3) { // 30% chance to turn off
          appliance.status = 'off';
          appliance.current_power = 0;
        }
      } else if (appliance.status === 'off' && shouldBeActive) {
        // Device should be on based on patterns
        if (Math.random() < 0.4) { // 40% chance to turn on
          appliance.status = 'on';
          appliance.current_power = appliance.normal_usage;
        }
      }

      // Add some randomness to power usage (±20%)
      if (appliance.status === 'on') {
        const variation = 0.8 + (Math.random() * 0.4);
        appliance.current_power = Math.round(appliance.normal_usage * variation);
      }
    });

    // Record this state in history
    this.recordSimulationState();
  }

  /**
   * Determine if a device should be active based on type and time
   */
  shouldDeviceBeActive(appliance, hour, dayOfWeek, isWeekend) {
    const patterns = {
      // Refrigerator - always on but power varies
      refrigerator: () => true,
      
      // Lights - on during evening/night
      light: () => (hour >= 18 || hour <= 6) && Math.random() < 0.8,
      
      // TV - evening usage, more on weekends
      tv: () => {
        if (isWeekend) {
          return (hour >= 10 && hour <= 23) && Math.random() < 0.6;
        }
        return (hour >= 18 && hour <= 22) && Math.random() < 0.7;
      },
      
      // Computer - daytime usage, less on weekends
      computer: () => {
        if (isWeekend) {
          return (hour >= 12 && hour <= 20) && Math.random() < 0.4;
        }
        return (hour >= 9 && hour <= 18) && Math.random() < 0.8;
      },
      
      // Air conditioner - temperature-based usage
      air_conditioner: () => {
        const isHotTime = (hour >= 12 && hour <= 18);
        return isHotTime && Math.random() < 0.6;
      },
      
      // Washing machine - morning or weekend usage
      washing_machine: () => {
        if (isWeekend) {
          return (hour >= 9 && hour <= 12) && Math.random() < 0.5;
        }
        return (hour >= 7 && hour <= 9) && Math.random() < 0.3;
      },
      
      // Default pattern
      default: () => (hour >= 8 && hour <= 22) && Math.random() < 0.3
    };

    const pattern = patterns[appliance.type] || patterns.default;
    return pattern();
  }

  /**
   * Update device states based on simulation
   */
  updateDeviceStates() {
    // This is where we'd integrate with the actual device controls
    // For now, we just update the simulated appliances array
  }

  /**
   * Record current state for ML training
   */
  recordSimulationState() {
    const state = {
      timestamp: this.currentSimulationTime.toISOString(),
      hour: this.currentSimulationTime.getHours(),
      dayOfWeek: this.currentSimulationTime.getDay(),
      isWeekend: this.currentSimulationTime.getDay() === 0 || this.currentSimulationTime.getDay() === 6,
      devices: this.simulatedAppliances.map(app => ({
        id: app.id,
        type: app.type,
        room: app.room,
        status: app.status,
        power: app.current_power || app.normal_usage,
        isActive: app.status === 'on',
      })),
      totalPower: this.simulatedAppliances
        .filter(app => app.status === 'on')
        .reduce((sum, app) => sum + (app.current_power || app.normal_usage), 0),
      activeDeviceCount: this.simulatedAppliances.filter(app => app.status === 'on').length,
    };

    this.simulationHistory.push(state);
    
    // Keep history manageable
    if (this.simulationHistory.length > 10000) {
      this.simulationHistory = this.simulationHistory.slice(-5000);
    }
  }

  /**
   * Get simulation data for ML training
   */
  getSimulationData() {
    return {
      deviceUsage: this.simulationHistory,
      userActions: this.extractUserActions(),
      currentTime: this.currentSimulationTime,
      totalSamples: this.simulationHistory.length,
      simulatedDays: this.getSimulatedDays()
    };
  }

  /**
   * Extract user actions from simulation history
   */
  extractUserActions() {
    const actions = [];
    
    for (let i = 1; i < this.simulationHistory.length; i++) {
      const current = this.simulationHistory[i];
      const previous = this.simulationHistory[i - 1];
      
      current.devices.forEach((device, index) => {
        const prevDevice = previous.devices.find(d => d.id === device.id);
        if (prevDevice && prevDevice.status !== device.status) {
          actions.push({
            timestamp: current.timestamp,
            deviceId: device.id,
            action: device.status === 'on' ? 'toggle_on' : 'toggle_off',
            hour: current.hour,
            dayOfWeek: current.dayOfWeek,
            context: {
              simulated: true,
              totalActiveDevices: current.activeDeviceCount,
              totalPower: current.totalPower
            }
          });
        }
      });
    }
    
    return actions;
  }

  /**
   * Fast-forward simulation to generate data quickly
   */
  async fastForward(days = 7, onProgress = null) {
    console.log(`⏩ Fast-forwarding ${days} days...`);
    
    const startTime = new Date(this.currentSimulationTime);
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + days);
    
    const totalHours = days * 24;
    let currentHour = 0;
    
    while (this.currentSimulationTime < endTime) {
      this.advanceTime();
      this.simulateUsagePatterns();
      
      currentHour++;
      
      if (onProgress && currentHour % 6 === 0) { // Update every 6 simulated hours
        const progress = (currentHour / totalHours) * 100;
        onProgress({
          progress: Math.round(progress),
          currentTime: this.currentSimulationTime,
          simulatedDays: this.getSimulatedDays()
        });
      }
      
      // Small delay to prevent blocking
      if (currentHour % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`✅ Fast-forward complete: ${this.simulationHistory.length} samples generated`);
    return this.getSimulationData();
  }

  /**
   * Reset simulation
   */
  resetSimulation() {
    this.stopSimulation();
    this.simulationHistory = [];
    this.currentSimulationTime = new Date();
    console.log('🔄 Simulation reset');
  }

  /**
   * Get simulation status
   */
  getSimulationStatus() {
    return {
      isSimulating: this.isSimulating,
      currentTime: this.currentSimulationTime,
      simulatedDays: this.getSimulatedDays(),
      totalSamples: this.simulationHistory.length,
      speed: this.simulationSpeed
    };
  }
}

// Create singleton instance
const simulationService = new SimulationService();

export default simulationService;