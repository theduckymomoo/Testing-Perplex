class MockSmartHomeAPI {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://api.smarthome.local';
    this.apiKey = config.apiKey || 'mock_api_key';
    this.networkDelay = config.networkDelay || { min: 100, max: 500 }; // ms
    this.failureRate = config.failureRate || 0.05; // 5% chance of failure
    
    // In-memory device registry
    this.devices = new Map();
  }

  // Simulate network delay
  async simulateNetworkDelay() {
    const delay = Math.random() * (this.networkDelay.max - this.networkDelay.min) + this.networkDelay.min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Simulate occasional network failures
  shouldSimulateFailure() {
    return Math.random() < this.failureRate;
  }

  // API Methods

  /**
   * Register a new device with the API
   */
  async registerDevice(deviceData) {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Network timeout: Failed to register device');
    }

    const device = {
      id: deviceData.id || `device_${Date.now()}`,
      name: deviceData.name,
      type: deviceData.type,
      status: 'offline',
      power: 0,
      lastSeen: new Date().toISOString(),
      firmware: '1.2.3',
      rssi: -50 + Math.floor(Math.random() * 30), // WiFi signal strength
      ...deviceData,
    };

    this.devices.set(device.id, device);

    return {
      success: true,
      data: device,
      message: 'Device registered successfully',
    };
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId) {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Connection timeout: Device unreachable');
    }

    const device = this.devices.get(deviceId);
    
    if (!device) {
      return {
        success: false,
        error: 'Device not found',
        code: 404,
      };
    }

    // Simulate device being occasionally offline
    const isOnline = Math.random() > 0.02; // 98% uptime
    
    return {
      success: true,
      data: {
        id: device.id,
        status: device.status,
        power: device.power,
        isOnline,
        lastSeen: isOnline ? new Date().toISOString() : device.lastSeen,
        rssi: device.rssi + Math.floor(Math.random() * 10 - 5),
        uptime: Math.floor(Math.random() * 86400), // seconds
      },
    };
  }

  /**
   * Toggle device power
   */
  async toggleDevice(deviceId, targetStatus) {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Command failed: Device did not respond');
    }

    const device = this.devices.get(deviceId);
    
    if (!device) {
      return {
        success: false,
        error: 'Device not found',
        code: 404,
      };
    }

    // Simulate gradual power transition
    const transitionDelay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, transitionDelay));

    device.status = targetStatus;
    device.lastSeen = new Date().toISOString();
    device.power = targetStatus === 'on' ? device.ratedPower : 0;

    return {
      success: true,
      data: {
        id: device.id,
        status: device.status,
        power: device.power,
        transitionTime: transitionDelay,
      },
      message: `Device turned ${targetStatus}`,
    };
  }

  /**
   * Get real-time power consumption
   */
  async getCurrentPower(deviceId) {
    await this.simulateNetworkDelay();
    
    const device = this.devices.get(deviceId);
    
    if (!device || device.status === 'off') {
      return {
        success: true,
        data: {
          id: deviceId,
          power: 0,
          voltage: 0,
          current: 0,
        },
      };
    }

    // Simulate realistic power variations
    const basePower = device.ratedPower || 100;
    const variation = basePower * 0.1; // ±10% variation
    const currentPower = basePower + (Math.random() - 0.5) * variation;

    return {
      success: true,
      data: {
        id: deviceId,
        power: Math.round(currentPower),
        voltage: 220 + (Math.random() - 0.5) * 10, // 215-225V
        current: (currentPower / 220).toFixed(2),
        powerFactor: (0.85 + Math.random() * 0.15).toFixed(2),
        frequency: 50 + (Math.random() - 0.5) * 0.5,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get device energy history
   */
  async getEnergyHistory(deviceId, options = {}) {
    await this.simulateNetworkDelay();
    
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found', code: 404 };
    }

    const hours = options.hours || 24;
    const interval = options.interval || 15; // minutes
    const dataPoints = Math.floor((hours * 60) / interval);
    
    const history = [];
    const now = Date.now();

    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = now - (i * interval * 60 * 1000);
      const hour = new Date(timestamp).getHours();
      
      // Simulate usage patterns
      let usageMultiplier = 1.0;
      if (hour >= 6 && hour <= 23) {
        usageMultiplier = 0.6 + Math.random() * 0.4;
      } else {
        usageMultiplier = 0.1 + Math.random() * 0.3;
      }

      const power = Math.round((device.ratedPower || 100) * usageMultiplier);
      const energy = (power / 1000) * (interval / 60); // kWh

      history.push({
        timestamp: new Date(timestamp).toISOString(),
        power,
        energy: energy.toFixed(3),
        cost: (energy * 2.50).toFixed(2),
      });
    }

    return {
      success: true,
      data: {
        deviceId,
        period: { hours, interval },
        dataPoints: history,
        summary: {
          totalEnergy: history.reduce((sum, p) => sum + parseFloat(p.energy), 0).toFixed(2),
          totalCost: history.reduce((sum, p) => sum + parseFloat(p.cost), 0).toFixed(2),
          avgPower: Math.round(history.reduce((sum, p) => sum + p.power, 0) / history.length),
        },
      },
    };
  }

  /**
   * Set device schedule
   */
  async setSchedule(deviceId, schedule) {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Failed to set schedule: Device busy');
    }

    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found', code: 404 };
    }

    device.schedule = schedule;

    return {
      success: true,
      data: {
        deviceId,
        schedule,
      },
      message: 'Schedule updated successfully',
    };
  }

  /**
   * Get all devices for a user
   */
  async getAllDevices() {
    await this.simulateNetworkDelay();
    
    const devices = Array.from(this.devices.values()).map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      status: device.status,
      power: device.power,
      isOnline: Math.random() > 0.02,
      lastSeen: device.lastSeen,
    }));

    return {
      success: true,
      data: devices,
      count: devices.length,
    };
  }

  /**
   * Update device settings
   */
  async updateDeviceSettings(deviceId, settings) {
    await this.simulateNetworkDelay();
    
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found', code: 404 };
    }

    Object.assign(device, settings);

    return {
      success: true,
      data: device,
      message: 'Settings updated',
    };
  }

  /**
   * Firmware update
   */
  async updateFirmware(deviceId) {
    await this.simulateNetworkDelay();
    
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found', code: 404 };
    }

    // Simulate firmware update (takes longer)
    await new Promise(resolve => setTimeout(resolve, 3000));

    device.firmware = '1.3.0';

    return {
      success: true,
      data: {
        deviceId,
        oldVersion: '1.2.3',
        newVersion: '1.3.0',
      },
      message: 'Firmware updated successfully',
    };
  }

  /**
   * Get device diagnostics
   */
  async getDiagnostics(deviceId) {
    await this.simulateNetworkDelay();
    
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found', code: 404 };
    }

    return {
      success: true,
      data: {
        deviceId,
        health: 'good',
        temperature: 45 + Math.random() * 10,
        uptime: Math.floor(Math.random() * 2592000), // seconds
        memoryUsage: Math.floor(Math.random() * 30 + 40), // %
        cpuUsage: Math.floor(Math.random() * 20 + 10), // %
        wifiStrength: device.rssi,
        errors: Math.floor(Math.random() * 5),
        warnings: Math.floor(Math.random() * 10),
      },
    };
  }
}

// Export the API
export default MockSmartHomeAPI;