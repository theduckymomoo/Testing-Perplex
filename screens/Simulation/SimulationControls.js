import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './SimulationStyles';
import mlService from '../MLEngine/MLService';

const { width } = Dimensions.get('window');

export default function SimulationControls({ visible, onClose, appliances, onSimulationUpdate }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(24);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({});
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  
  // Enhanced scheduling states
  const [selectedTab, setSelectedTab] = useState('basic'); // basic, advanced, schedule
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceSchedules, setDeviceSchedules] = useState({});
  const [globalSettings, setGlobalSettings] = useState({
    simulationDays: 7,
    variationPercent: 15,
    weekendDifference: true,
    randomEvents: true,
  });

  useEffect(() => {
    if (visible && appliances.length > 0) {
      initializeSimulation();
      initializeSchedules();
    }
  }, [visible, appliances]);

  const initializeSimulation = async () => {
    try {
      const result = await mlService.initializeSimulation(appliances);
      if (result.success) {
        setStatus(result.status);
        console.log('✅ Simulation initialized');
      }
    } catch (error) {
      console.error('Error initializing simulation:', error);
    }
  };

  const initializeSchedules = () => {
    const schedules = {};
    appliances.forEach(device => {
      schedules[device.id] = {
        deviceName: device.name,
        deviceType: device.type,
        power: device.normal_usage || 100,
        weekdaySchedule: Array(24).fill(false),
        weekendSchedule: Array(24).fill(false),
      };
    });
    setDeviceSchedules(schedules);
  };

  const startSimulation = async () => {
    const result = await mlService.startSimulation(simulationSpeed, (update) => {
      setStatus(mlService.getSimulationStatus());
      if (onSimulationUpdate) {
        onSimulationUpdate(update);
      }
    });
    
    if (result.success) {
      setIsSimulating(true);
      setStatus(result.status);
    }
  };

  const stopSimulation = async () => {
    const result = await mlService.stopSimulation();
    setIsSimulating(false);
    setStatus(result.status);
  };

  const fastForward = async (days = 7) => {
    setIsFastForwarding(true);
    setProgress(0);
    
    const result = await mlService.fastForwardSimulation(days, (progressUpdate) => {
      setProgress(progressUpdate.progress);
    });
    
    setIsFastForwarding(false);
    
    if (result.success) {
      Alert.alert(
        'Fast-Forward Complete',
        `Generated ${result.samplesGenerated} training samples from ${result.simulatedDays} simulated days!`,
        [{ text: 'OK' }]
      );
      setStatus(result.status);
    }
  };

  const resetSimulation = async () => {
    await mlService.resetSimulation();
    setStatus(mlService.getSimulationStatus());
    setProgress(0);
  };

  // Enhanced scheduling functions
  const toggleHour = (deviceId, hour, isWeekend) => {
    setDeviceSchedules(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        [isWeekend ? 'weekendSchedule' : 'weekdaySchedule']: prev[deviceId][isWeekend ? 'weekendSchedule' : 'weekdaySchedule'].map((active, index) => 
          index === hour ? !active : active
        )
      }
    }));
  };

  const applyPattern = (deviceId, patternType) => {
    const patterns = {
      alwaysOn: () => Array(24).fill(true),
      alwaysOff: () => Array(24).fill(false),
      workingHours: () => Array(24).fill(false).map((_, hour) => hour >= 9 && hour <= 17),
      eveningOnly: () => Array(24).fill(false).map((_, hour) => hour >= 18 && hour <= 22),
      nightTime: () => Array(24).fill(false).map((_, hour) => hour >= 22 || hour <= 6),
      morningEvening: () => Array(24).fill(false).map((_, hour) => (hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 21)),
      smart: () => {
        const device = deviceSchedules[deviceId];
        if (!device) return Array(24).fill(false);
        
        switch (device.deviceType.toLowerCase()) {
          case 'light':
          case 'lamp':
            return Array(24).fill(false).map((_, hour) => hour >= 18 && hour <= 23);
          case 'tv':
          case 'television':
            return Array(24).fill(false).map((_, hour) => (hour >= 19 && hour <= 23) || (hour >= 7 && hour <= 8));
          case 'fridge':
          case 'refrigerator':
            return Array(24).fill(true);
          case 'ac':
          case 'air conditioner':
            return Array(24).fill(false).map((_, hour) => (hour >= 22 && hour <= 6) || (hour >= 14 && hour <= 16));
          case 'heater':
            return Array(24).fill(false).map((_, hour) => (hour >= 6 && hour <= 8) || (hour >= 18 && hour <= 21));
          default:
            return Array(24).fill(false).map((_, hour) => hour >= 18 && hour <= 22);
        }
      },
    };

    const pattern = patterns[patternType]();
    
    setDeviceSchedules(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        weekdaySchedule: pattern,
        weekendSchedule: pattern,
      }
    }));
  };

  const copySchedule = (fromType, toType, deviceId) => {
    setDeviceSchedules(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        [toType]: [...prev[deviceId][fromType]]
      }
    }));
  };

  const startAdvancedSimulation = async () => {
    try {
      setIsFastForwarding(true);
      
      Alert.alert(
        'Start Custom Simulation',
        `Generate ${globalSettings.simulationDays} days of data based on your custom schedules?`,
        [
          { text: 'Cancel' },
          { 
            text: 'Start', 
            onPress: async () => {
              const result = await generateCustomSimulationData();
              if (result.success) {
                Alert.alert(
                  'Custom Simulation Complete!',
                  `Generated ${result.samplesGenerated} realistic samples over ${globalSettings.simulationDays} days based on your schedules.`,
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsFastForwarding(false);
    }
  };

  const generateCustomSimulationData = async () => {
    const engine = mlService.getCurrentEngine();
    if (!engine) throw new Error('ML Engine not available');

    const samples = [];
    const actions = [];
    let samplesGenerated = 0;

    for (let day = 0; day < globalSettings.simulationDays; day++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - globalSettings.simulationDays + day);
      
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(currentDate);
        timestamp.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
        
        const devices = appliances.map(appliance => {
          const schedule = deviceSchedules[appliance.id];
          if (!schedule) return null;

          const scheduleType = isWeekend ? 'weekendSchedule' : 'weekdaySchedule';
          const isScheduledOn = schedule[scheduleType][hour];
          
          // Add natural variation
          let finalState = isScheduledOn;
          if (globalSettings.variationPercent > 0) {
            const variation = Math.random() * (globalSettings.variationPercent / 100);
            if (Math.random() < variation) {
              finalState = !finalState;
            }
          }

          // Random events (forgetting to turn off, early wake-up, etc.)
          if (globalSettings.randomEvents && Math.random() < 0.05) {
            finalState = Math.random() > 0.7;
          }

          return {
            id: appliance.id,
            type: appliance.type,
            room: appliance.room,
            status: finalState ? 'on' : 'off',
            power: finalState ? (schedule.power || appliance.normal_usage || 100) : 0,
            isActive: finalState,
          };
        }).filter(Boolean);

        const totalPower = devices
          .filter(device => device.isActive)
          .reduce((sum, device) => sum + device.power, 0);

        const sample = {
          timestamp: timestamp.toISOString(),
          hour,
          dayOfWeek: currentDate.getDay(),
          isWeekend,
          devices,
          totalPower,
          activeDeviceCount: devices.filter(d => d.isActive).length,
        };

        samples.push(sample);
        
        // Generate realistic user actions at transition times
        devices.forEach(device => {
          const schedule = deviceSchedules[device.id];
          if (!schedule) return;

          const prevHour = hour === 0 ? 23 : hour - 1;
          const scheduleType = isWeekend ? 'weekendSchedule' : 'weekdaySchedule';
          const wasScheduledOn = schedule[scheduleType][prevHour];
          const isScheduledOn = schedule[scheduleType][hour];

          if (wasScheduledOn !== isScheduledOn && Math.random() < 0.8) {
            const actionTime = new Date(timestamp);
            actionTime.setMinutes(actionTime.getMinutes() - Math.floor(Math.random() * 30));

            actions.push({
              timestamp: actionTime.toISOString(),
              hour: actionTime.getHours(),
              dayOfWeek: actionTime.getDay(),
              deviceId: device.id,
              deviceType: device.type,
              action: isScheduledOn ? 'toggle_on' : 'toggle_off',
              context: {
                manual: true,
                scheduled: true,
                totalActiveDevices: devices.filter(d => d.isActive).length,
                totalPower,
              }
            });
          }
        });

        samplesGenerated++;
      }
    }

    // Inject the generated data
    await mlService.injectSimulationData({
      deviceUsage: samples,
      userActions: actions,
      totalSamples: samplesGenerated,
      simulatedDays: globalSettings.simulationDays,
    });

    // Auto-train if enough data
    if (samplesGenerated >= 50) {
      await mlService.trainModels();
    }

    return { success: true, samplesGenerated, simulatedDays: globalSettings.simulationDays };
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'basic' && styles.activeTab]}
        onPress={() => setSelectedTab('basic')}
      >
        <MaterialIcons name="play-arrow" size={16} color={selectedTab === 'basic' ? "#10b981" : "#666"} />
        <Text style={[styles.tabText, selectedTab === 'basic' && styles.activeTabText]}>Basic</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'schedule' && styles.activeTab]}
        onPress={() => setSelectedTab('schedule')}
      >
        <MaterialIcons name="schedule" size={16} color={selectedTab === 'schedule' ? "#10b981" : "#666"} />
        <Text style={[styles.tabText, selectedTab === 'schedule' && styles.activeTabText]}>Schedule</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'advanced' && styles.activeTab]}
        onPress={() => setSelectedTab('advanced')}
      >
        <MaterialIcons name="settings" size={16} color={selectedTab === 'advanced' ? "#10b981" : "#666"} />
        <Text style={[styles.tabText, selectedTab === 'advanced' && styles.activeTabText]}>Advanced</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDeviceList = () => (
    <View style={styles.deviceListContainer}>
      <Text style={styles.sectionTitle}>Select Device to Schedule</Text>
      <FlatList
        data={appliances}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.deviceItem,
              selectedDevice?.id === item.id && styles.selectedDeviceItem
            ]}
            onPress={() => setSelectedDevice(item)}
          >
            <View style={styles.deviceHeader}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceType}>{item.type} • {item.normal_usage || 100}W</Text>
              </View>
              <MaterialIcons 
                name={selectedDevice?.id === item.id ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#666" 
              />
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 200 }}
      />
    </View>
  );

  const renderHourGrid = (scheduleType, title) => {
    if (!selectedDevice || !deviceSchedules[selectedDevice.id]) return null;

    const schedule = deviceSchedules[selectedDevice.id][scheduleType];
    const isWeekend = scheduleType === 'weekendSchedule';

    return (
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copySchedule(isWeekend ? 'weekdaySchedule' : 'weekendSchedule', scheduleType, selectedDevice.id)}
          >
            <MaterialIcons name="content-copy" size={16} color="#10b981" />
          </TouchableOpacity>
        </View>

        <View style={styles.hourGrid}>
          {schedule.map((isActive, hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.hourButton,
                isActive && styles.activeHourButton
              ]}
              onPress={() => toggleHour(selectedDevice.id, hour, isWeekend)}
            >
              <Text style={[styles.hourText, isActive && styles.activeHourText]}>
                {hour.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPatternButtons = () => {
    if (!selectedDevice) return null;

    const patterns = [
      { key: 'smart', label: 'Smart Default', icon: 'auto-awesome' },
      { key: 'alwaysOn', label: 'Always On', icon: 'power' },
      { key: 'workingHours', label: 'Work Hours', icon: 'work' },
      { key: 'eveningOnly', label: 'Evening', icon: 'nights-stay' },
      { key: 'morningEvening', label: 'Morning + Evening', icon: 'schedule' },
      { key: 'alwaysOff', label: 'Always Off', icon: 'power-off' },
    ];

    return (
      <View style={styles.patternsSection}>
        <Text style={styles.patternsTitle}>Quick Patterns</Text>
        <View style={styles.patternsGrid}>
          {patterns.map(pattern => (
            <TouchableOpacity
              key={pattern.key}
              style={styles.patternButton}
              onPress={() => applyPattern(selectedDevice.id, pattern.key)}
            >
              <MaterialIcons name={pattern.icon} size={14} color="#10b981" />
              <Text style={styles.patternText}>{pattern.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderAdvancedSettings = () => (
    <View style={styles.advancedSettings}>
      <Text style={styles.sectionTitle}>Simulation Settings</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Simulation Days</Text>
        <TextInput
          style={styles.settingInput}
          value={globalSettings.simulationDays.toString()}
          onChangeText={(text) => setGlobalSettings(prev => ({
            ...prev,
            simulationDays: parseInt(text) || 1
          }))}
          keyboardType="numeric"
          maxLength={2}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Natural Variation (%)</Text>
        <TextInput
          style={styles.settingInput}
          value={globalSettings.variationPercent.toString()}
          onChangeText={(text) => setGlobalSettings(prev => ({
            ...prev,
            variationPercent: parseInt(text) || 0
          }))}
          keyboardType="numeric"
          maxLength={2}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Weekend Differences</Text>
        <Switch
          value={globalSettings.weekendDifference}
          onValueChange={(value) => setGlobalSettings(prev => ({
            ...prev,
            weekendDifference: value
          }))}
          trackColor={{ false: '#666', true: '#10b981' }}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Random Events</Text>
        <Switch
          value={globalSettings.randomEvents}
          onValueChange={(value) => setGlobalSettings(prev => ({
            ...prev,
            randomEvents: value
          }))}
          trackColor={{ false: '#666', true: '#10b981' }}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={startAdvancedSimulation}
        disabled={isFastForwarding}
      >
        <MaterialIcons 
          name={isFastForwarding ? "hourglass-empty" : "play-arrow"} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.buttonText}>
          {isFastForwarding ? 'Generating...' : 'Start Custom Simulation'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBasicControls = () => (
    <>
      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <MaterialIcons 
            name={isSimulating ? "play-arrow" : "pause"} 
            size={24} 
            color={isSimulating ? "#10b981" : "#a1a1aa"} 
          />
          <Text style={styles.statusTitle}>
            {isSimulating ? 'Simulation Running' : 'Simulation Ready'}
          </Text>
        </View>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Simulated Days</Text>
            <Text style={styles.statusValue}>{status.simulatedDays || 0}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Training Samples</Text>
            <Text style={styles.statusValue}>{status.totalSamples || 0}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Current Speed</Text>
            <Text style={styles.statusValue}>{simulationSpeed}x</Text>
          </View>
        </View>
      </View>

      {/* Speed Control */}
      <View style={styles.controlCard}>
        <Text style={styles.controlTitle}>Simulation Speed</Text>
        <Text style={styles.controlSubtitle}>How fast time advances (hours per minute)</Text>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.speedLabel}>1x</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={168}
            step={1}
            value={simulationSpeed}
            onValueChange={setSimulationSpeed}
            minimumTrackTintColor="#10b981"
            maximumTrackTintColor="#374151"
            thumbTintColor="#10b981"
          />
          <Text style={styles.speedLabel}>168x</Text>
        </View>
        
        <Text style={styles.currentSpeed}>{simulationSpeed}x speed</Text>
      </View>

      {/* Real-time Simulation Controls */}
      <View style={styles.controlCard}>
        <Text style={styles.controlTitle}>Real-time Simulation</Text>
        <Text style={styles.controlSubtitle}>
          Watch devices turn on/off based on realistic patterns
        </Text>
        
        <View style={styles.buttonRow}>
          {!isSimulating ? (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={startSimulation}
            >
              <MaterialIcons name="play-arrow" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Start Simulation</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={stopSimulation}
            >
              <MaterialIcons name="pause" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Stop Simulation</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, styles.outlineButton]}
            onPress={resetSimulation}
          >
            <MaterialIcons name="refresh" size={20} color="#a1a1aa" />
            <Text style={styles.outlineButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fast-Forward Section */}
      <View style={styles.controlCard}>
        <Text style={styles.controlTitle}>Quick Data Generation</Text>
        <Text style={styles.controlSubtitle}>
          Fast-forward time to generate training data instantly
        </Text>

        {isFastForwarding && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.progressText}>Generating data... {progress}%</Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${progress}%` }]} 
              />
            </View>
          </View>
        )}

        <View style={styles.fastForwardGrid}>
          <TouchableOpacity 
            style={styles.fastForwardButton}
            onPress={() => fastForward(1)}
            disabled={isFastForwarding}
          >
            <MaterialIcons name="fast-forward" size={20} color="#10b981" />
            <Text style={styles.fastForwardText}>1 Day</Text>
            <Text style={styles.fastForwardSubtext}>~24 samples</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.fastForwardButton}
            onPress={() => fastForward(7)}
            disabled={isFastForwarding}
          >
            <MaterialIcons name="fast-forward" size={20} color="#10b981" />
            <Text style={styles.fastForwardText}>1 Week</Text>
            <Text style={styles.fastForwardSubtext}>~168 samples</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.fastForwardButton}
            onPress={() => fastForward(30)}
            disabled={isFastForwarding}
          >
            <MaterialIcons name="fast-forward" size={20} color="#10b981" />
            <Text style={styles.fastForwardText}>1 Month</Text>
            <Text style={styles.fastForwardSubtext}>~720 samples</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ML Training Status */}
      <View style={styles.controlCard}>
        <Text style={styles.controlTitle}>ML Training Progress</Text>
        
        <View style={styles.trainingProgress}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>
              Data Collection: {mlService.getTrainingProgress().current} / {mlService.getTrainingProgress().required} samples
            </Text>
            <Text style={styles.progressPercent}>
              {mlService.getTrainingProgress().progress}%
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${mlService.getTrainingProgress().progress}%` }
              ]} 
            />
          </View>
          
          <Text style={styles.progressStatus}>
            {mlService.getTrainingProgress().status === 'ready' ? 
              'Ready to train!' : 
              'Collecting more data...'
            }
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            styles.button, 
            styles.primaryButton,
            !mlService.getTrainingProgress().canTrain && styles.buttonDisabled
          ]}
          onPress={() => mlService.trainModels()}
          disabled={!mlService.getTrainingProgress().canTrain}
        >
          <MaterialIcons name="model-training" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Train ML Models</Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoCard}>
        <MaterialIcons name="info" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          The simulator creates realistic device usage patterns based on time of day, 
          day of week, and device type. This generates training data for the AI to learn 
          your habits and make accurate predictions.
        </Text>
      </View>
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎮 ML Training Simulator</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {renderTabs()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedTab === 'basic' && renderBasicControls()}
          
          {selectedTab === 'schedule' && (
            <>
              {renderDeviceList()}
              {selectedDevice && (
                <>
                  {renderPatternButtons()}
                  {renderHourGrid('weekdaySchedule', 'Weekday Schedule (Mon-Fri)')}
                  {renderHourGrid('weekendSchedule', 'Weekend Schedule (Sat-Sun)')}
                </>
              )}
            </>
          )}
          
          {selectedTab === 'advanced' && renderAdvancedSettings()}
        </ScrollView>
      </View>
    </Modal>
  );
}
