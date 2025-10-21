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
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './SimulationStyles';
import mlService from '../MLEngine/MLService';

const { width } = Dimensions.get('window');

export default function SimulationControls({ visible, onClose, appliances, onSimulationUpdate }) {
  const [selectedTab, setSelectedTab] = useState('planner'); // planner, advanced, preview
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceSchedules, setDeviceSchedules] = useState({});
  const [dayType, setDayType] = useState('weekday'); // weekday, weekend
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Enhanced planning states
  const [globalSettings, setGlobalSettings] = useState({
    simulationDays: 7,
    variationPercent: 15,
    includeWeekends: true,
    randomEvents: true,
    userBehaviorRealism: 80, // How realistic vs perfect the schedule should be
  });

  const [dayPresets, setDayPresets] = useState({
    workday: 'Standard work from home day',
    weekend: 'Relaxed weekend day',
    vacation: 'Home all day vacation',
    away: 'Away from home most of day',
    custom: 'Custom schedule',
  });

  useEffect(() => {
    if (visible && appliances.length > 0) {
      initializeSchedules();
    }
  }, [visible, appliances]);

  const initializeSchedules = () => {
    const schedules = {};
    appliances.forEach(device => {
      schedules[device.id] = {
        deviceName: device.name,
        deviceType: device.type,
        power: device.normal_usage || 100,
        weekdaySchedule: getSmartDefaultSchedule(device.type),
        weekendSchedule: getSmartDefaultSchedule(device.type, true),
        priority: getPriority(device.type), // essential, comfort, optional
        automation: {
          enabled: false,
          conditions: [], // time, other device states, etc.
        }
      };
    });
    setDeviceSchedules(schedules);
    
    // Auto-select first device
    if (appliances.length > 0) {
      setSelectedDevice(appliances[0]);
    }
  };

  const getSmartDefaultSchedule = (deviceType, isWeekend = false) => {
    const patterns = {
      // Essential devices (always on or specific patterns)
      refrigerator: Array(24).fill(true),
      router: Array(24).fill(true),
      
      // Lighting (evening and early morning)
      light: Array(24).fill(false).map((_, hour) => 
        hour >= 18 && hour <= 23 || (hour >= 6 && hour <= 8)
      ),
      
      // Entertainment (evening, more flexible on weekends)
      tv: Array(24).fill(false).map((_, hour) => 
        isWeekend 
          ? (hour >= 10 && hour <= 12) || (hour >= 19 && hour <= 23)
          : (hour >= 19 && hour <= 22)
      ),
      
      // Work devices (work hours, less on weekends)
      computer: Array(24).fill(false).map((_, hour) => 
        isWeekend 
          ? (hour >= 14 && hour <= 18)
          : (hour >= 8 && hour <= 17)
      ),
      
      // Climate control (thermal comfort times)
      'air conditioner': Array(24).fill(false).map((_, hour) => 
        (hour >= 14 && hour <= 18) || (hour >= 22 && hour <= 6)
      ),
      heater: Array(24).fill(false).map((_, hour) => 
        (hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 22)
      ),
      
      // Kitchen appliances (meal times)
      microwave: Array(24).fill(false).map((_, hour) => 
        hour === 7 || hour === 12 || hour === 18
      ),
      kettle: Array(24).fill(false).map((_, hour) => 
        hour === 7 || hour === 15 || hour === 20
      ),
      
      // Cleaning (morning or weekend)
      'washing machine': Array(24).fill(false).map((_, hour) => 
        isWeekend ? (hour >= 9 && hour <= 12) : hour === 8
      ),
      
      // Default pattern
      default: Array(24).fill(false).map((_, hour) => hour >= 18 && hour <= 22)
    };

    return patterns[deviceType.toLowerCase()] || patterns.default;
  };

  const getPriority = (deviceType) => {
    const priorities = {
      refrigerator: 'essential',
      router: 'essential',
      light: 'comfort',
      tv: 'optional',
      computer: 'comfort',
      'air conditioner': 'comfort',
      heater: 'comfort',
      microwave: 'comfort',
      kettle: 'comfort',
      'washing machine': 'optional',
    };
    return priorities[deviceType.toLowerCase()] || 'optional';
  };

  // Enhanced planning functions
  const toggleHour = (deviceId, hour) => {
    const scheduleType = dayType === 'weekday' ? 'weekdaySchedule' : 'weekendSchedule';
    
    setDeviceSchedules(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        [scheduleType]: prev[deviceId][scheduleType].map((active, index) => 
          index === hour ? !active : active
        )
      }
    }));
  };

  const applyDayPreset = (presetType) => {
    Alert.alert(
      'Apply Day Preset',
      `Apply "${presetType}" schedule to all devices for ${dayType}s?`,
      [
        { text: 'Cancel' },
        { text: 'Apply', onPress: () => applyPresetToAllDevices(presetType) }
      ]
    );
  };

  const applyPresetToAllDevices = (presetType) => {
    const schedules = { ...deviceSchedules };
    
    Object.keys(schedules).forEach(deviceId => {
      const device = appliances.find(a => a.id === deviceId);
      if (!device) return;
      
      let schedule = [];
      
      switch (presetType) {
        case 'workday':
          schedule = getWorkdaySchedule(device.type);
          break;
        case 'weekend':
          schedule = getWeekendSchedule(device.type);
          break;
        case 'vacation':
          schedule = getVacationSchedule(device.type);
          break;
        case 'away':
          schedule = getAwaySchedule(device.type);
          break;
        default:
          schedule = getSmartDefaultSchedule(device.type);
      }
      
      const scheduleType = dayType === 'weekday' ? 'weekdaySchedule' : 'weekendSchedule';
      schedules[deviceId][scheduleType] = schedule;
    });
    
    setDeviceSchedules(schedules);
  };

  const getWorkdaySchedule = (deviceType) => {
    const schedules = {
      refrigerator: Array(24).fill(true),
      router: Array(24).fill(true),
      light: Array(24).fill(false).map((_, hour) => 
        (hour >= 6 && hour <= 8) || (hour >= 18 && hour <= 23)
      ),
      tv: Array(24).fill(false).map((_, hour) => hour >= 19 && hour <= 22),
      computer: Array(24).fill(false).map((_, hour) => hour >= 8 && hour <= 17),
      'air conditioner': Array(24).fill(false).map((_, hour) => 
        (hour >= 8 && hour <= 9) || (hour >= 17 && hour <= 22)
      ),
      heater: Array(24).fill(false).map((_, hour) => 
        (hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 22)
      ),
      microwave: Array(24).fill(false).map((_, hour) => 
        hour === 7 || hour === 12 || hour === 18
      ),
      kettle: Array(24).fill(false).map((_, hour) => 
        hour === 7 || hour === 12 || hour === 15 || hour === 20
      ),
      'washing machine': Array(24).fill(false).map((_, hour) => hour === 8),
      default: Array(24).fill(false).map((_, hour) => 
        (hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 21)
      )
    };
    
    return schedules[deviceType.toLowerCase()] || schedules.default;
  };

  const getWeekendSchedule = (deviceType) => {
    const schedules = {
      refrigerator: Array(24).fill(true),
      router: Array(24).fill(true),
      light: Array(24).fill(false).map((_, hour) => 
        (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 24)
      ),
      tv: Array(24).fill(false).map((_, hour) => 
        (hour >= 10 && hour <= 14) || (hour >= 19 && hour <= 24)
      ),
      computer: Array(24).fill(false).map((_, hour) => hour >= 10 && hour <= 20),
      'air conditioner': Array(24).fill(false).map((_, hour) => 
        (hour >= 12 && hour <= 16) || (hour >= 20 && hour <= 8)
      ),
      heater: Array(24).fill(false).map((_, hour) => 
        (hour >= 7 && hour <= 10) || (hour >= 18 && hour <= 23)
      ),
      microwave: Array(24).fill(false).map((_, hour) => 
        hour === 9 || hour === 13 || hour === 19
      ),
      kettle: Array(24).fill(false).map((_, hour) => 
        hour === 9 || hour === 14 || hour === 16 || hour === 21
      ),
      'washing machine': Array(24).fill(false).map((_, hour) => 
        hour >= 10 && hour <= 12
      ),
      default: Array(24).fill(false).map((_, hour) => 
        (hour >= 9 && hour <= 12) || (hour >= 18 && hour <= 22)
      )
    };
    
    return schedules[deviceType.toLowerCase()] || schedules.default;
  };

  const getVacationSchedule = (deviceType) => {
    // More flexible, home all day
    return Array(24).fill(false).map((_, hour) => {
      if (deviceType === 'refrigerator' || deviceType === 'router') return true;
      if (deviceType === 'light') return (hour >= 7 && hour <= 24);
      if (deviceType === 'tv') return (hour >= 9 && hour <= 24);
      if (deviceType === 'computer') return (hour >= 9 && hour <= 22);
      return (hour >= 8 && hour <= 23);
    });
  };

  const getAwaySchedule = (deviceType) => {
    // Minimal usage, only essentials
    if (deviceType === 'refrigerator' || deviceType === 'router') {
      return Array(24).fill(true);
    }
    // Everything else off except brief periods
    return Array(24).fill(false).map((_, hour) => 
      (hour >= 7 && hour <= 8) || (hour >= 18 && hour <= 20)
    );
  };

  const generateCustomSimulationData = async () => {
    try {
      setIsFastForwarding(true);
      setProgress(0);
      
      const engine = mlService.getCurrentEngine();
      if (!engine) throw new Error('ML Engine not available');

      const samples = [];
      const actions = [];
      let samplesGenerated = 0;
      const totalHours = globalSettings.simulationDays * 24;

      for (let day = 0; day < globalSettings.simulationDays; day++) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - globalSettings.simulationDays + day);
        
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        const useWeekendSchedule = isWeekend && globalSettings.includeWeekends;
        
        for (let hour = 0; hour < 24; hour++) {
          const timestamp = new Date(currentDate);
          timestamp.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
          
          const devices = appliances.map(appliance => {
            const schedule = deviceSchedules[appliance.id];
            if (!schedule) return null;

            const scheduleType = useWeekendSchedule ? 'weekendSchedule' : 'weekdaySchedule';
            let isScheduledOn = schedule[scheduleType][hour];
            
            // Apply user behavior realism (people aren't perfect with schedules)
            const realismFactor = globalSettings.userBehaviorRealism / 100;
            if (Math.random() > realismFactor) {
              // Add human imperfection
              if (schedule.priority === 'essential') {
                // Essential devices stay mostly as scheduled
                isScheduledOn = isScheduledOn && Math.random() > 0.05;
              } else if (schedule.priority === 'comfort') {
                // Comfort devices might be forgotten on or turned on early
                if (isScheduledOn) {
                  // Might forget to turn off (extend usage)
                  isScheduledOn = isScheduledOn || Math.random() < 0.2;
                } else {
                  // Might turn on early or leave on from previous hour
                  isScheduledOn = isScheduledOn || Math.random() < 0.1;
                }
              } else {
                // Optional devices have more variation
                if (Math.random() < globalSettings.variationPercent / 100) {
                  isScheduledOn = !isScheduledOn;
                }
              }
            }

            // Random life events
            if (globalSettings.randomEvents && Math.random() < 0.03) {
              if (hour >= 6 && hour <= 22) {
                // Daytime: might turn something on unexpectedly
                isScheduledOn = isScheduledOn || Math.random() < 0.3;
              } else {
                // Nighttime: might forget to turn something off
                isScheduledOn = isScheduledOn && Math.random() > 0.1;
              }
            }

            return {
              id: appliance.id,
              type: appliance.type,
              room: appliance.room,
              status: isScheduledOn ? 'on' : 'off',
              power: isScheduledOn ? (schedule.power || appliance.normal_usage || 100) : 0,
              isActive: isScheduledOn,
              priority: schedule.priority,
            };
          }).filter(Boolean);

          // Generate state transitions (when devices change)
          if (hour > 0) {
            const prevSample = samples[samples.length - 1];
            if (prevSample) {
              devices.forEach(device => {
                const prevDevice = prevSample.devices.find(d => d.id === device.id);
                if (prevDevice && prevDevice.status !== device.status) {
                  // Device changed state - record user action
                  const actionTime = new Date(timestamp);
                  actionTime.setMinutes(Math.floor(Math.random() * 60));
                  
                  actions.push({
                    timestamp: actionTime.toISOString(),
                    hour: actionTime.getHours(),
                    dayOfWeek: actionTime.getDay(),
                    deviceId: device.id,
                    deviceType: device.type,
                    action: device.status === 'on' ? 'toggle_on' : 'toggle_off',
                    context: {
                      manual: true,
                      planned: true,
                      priority: device.priority,
                      totalActiveDevices: devices.filter(d => d.isActive).length,
                      totalPower: devices.filter(d => d.isActive).reduce((sum, d) => sum + d.power, 0),
                      dayType: isWeekend ? 'weekend' : 'weekday',
                    }
                  });
                }
              });
            }
          }

          const totalPower = devices
            .filter(device => device.isActive)
            .reduce((sum, device) => sum + device.power, 0);

          const sample = {
            timestamp: timestamp.toISOString(),
            hour,
            dayOfWeek: currentDate.getDay(),
            isWeekend: useWeekendSchedule,
            devices,
            totalPower,
            activeDeviceCount: devices.filter(d => d.isActive).length,
            plannedDay: true, // Flag to indicate this was user-planned
            dayType: isWeekend ? 'weekend' : 'weekday',
          };

          samples.push(sample);
          samplesGenerated++;
          
          // Update progress
          const progressPercent = Math.round(((day * 24 + hour + 1) / totalHours) * 100);
          setProgress(progressPercent);
        }
        
        // Small delay every day to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Inject the planned data
      await mlService.injectSimulationData({
        deviceUsage: samples,
        userActions: actions,
        totalSamples: samplesGenerated,
        simulatedDays: globalSettings.simulationDays,
        plannedData: true,
      });

      // Auto-train if enough data
      if (samplesGenerated >= 50) {
        const trainResult = await mlService.trainModels();
        return { 
          success: true, 
          samplesGenerated, 
          simulatedDays: globalSettings.simulationDays,
          trained: trainResult.success,
          accuracy: trainResult.accuracy 
        };
      }

      return { success: true, samplesGenerated, simulatedDays: globalSettings.simulationDays };
    } catch (error) {
      throw error;
    } finally {
      setIsFastForwarding(false);
      setProgress(0);
    }
  };

  const copyDaySchedule = (fromDay, toDay) => {
    const fromScheduleType = fromDay + 'Schedule';
    const toScheduleType = toDay + 'Schedule';
    
    setDeviceSchedules(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(deviceId => {
        updated[deviceId][toScheduleType] = [...updated[deviceId][fromScheduleType]];
      });
      return updated;
    });
    
    Alert.alert('Schedule Copied', `${fromDay} schedule copied to ${toDay} for all devices`);
  };

  // FIXED: Better input handling for simulation days
  const handleDaysInput = (text) => {
    // Remove any non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Convert to number and limit range
    const days = Math.max(1, Math.min(99, parseInt(numericValue) || 1));
    
    setGlobalSettings(prev => ({
      ...prev,
      simulationDays: days
    }));
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'planner' && styles.activeTab]}
        onPress={() => setSelectedTab('planner')}
      >
        <MaterialIcons name="event-note" size={16} color={selectedTab === 'planner' ? "#10b981" : "#6c757d"} />
        <Text style={[styles.tabText, selectedTab === 'planner' && styles.activeTabText]}>Day Planner</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'advanced' && styles.activeTab]}
        onPress={() => setSelectedTab('advanced')}
      >
        <MaterialIcons name="tune" size={16} color={selectedTab === 'advanced' ? "#10b981" : "#6c757d"} />
        <Text style={[styles.tabText, selectedTab === 'advanced' && styles.activeTabText]}>Settings</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'preview' && styles.activeTab]}
        onPress={() => setSelectedTab('preview')}
      >
        <MaterialIcons name="preview" size={16} color={selectedTab === 'preview' ? "#10b981" : "#6c757d"} />
        <Text style={[styles.tabText, selectedTab === 'preview' && styles.activeTabText]}>Preview</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDayTypeSelector = () => (
    <View style={styles.dayTypeSelector}>
      <TouchableOpacity
        style={[styles.dayTypeButton, dayType === 'weekday' && styles.activeDayType]}
        onPress={() => setDayType('weekday')}
      >
        <MaterialIcons name="work" size={16} color={dayType === 'weekday' ? "#ffffff" : "#6c757d"} />
        <Text style={[styles.dayTypeText, dayType === 'weekday' && styles.activeDayTypeText]}>
          Weekday (Mon-Fri)
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.dayTypeButton, dayType === 'weekend' && styles.activeDayType]}
        onPress={() => setDayType('weekend')}
      >
        <MaterialIcons name="weekend" size={16} color={dayType === 'weekend' ? "#ffffff" : "#6c757d"} />
        <Text style={[styles.dayTypeText, dayType === 'weekend' && styles.activeDayTypeText]}>
          Weekend (Sat-Sun)
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPresets = () => (
    <View style={styles.presetsSection}>
      <Text style={styles.sectionTitle}>Quick Day Templates</Text>
      <Text style={styles.sectionDescription}>Apply realistic daily patterns to all your devices</Text>
      <View style={styles.presetsGrid}>
        {Object.entries(dayPresets).slice(0, 4).map(([key, description]) => (
          <TouchableOpacity
            key={key}
            style={styles.presetButton}
            onPress={() => applyDayPreset(key)}
          >
            <MaterialIcons 
              name={
                key === 'workday' ? 'work' :
                key === 'weekend' ? 'weekend' :
                key === 'vacation' ? 'beach-access' :
                key === 'away' ? 'directions-run' : 'edit'
              } 
              size={18} 
              color="#10b981" 
            />
            <View style={styles.presetInfo}>
              <Text style={styles.presetTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Text style={styles.presetDescription}>{description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDeviceScheduler = () => {
    if (!selectedDevice || !deviceSchedules[selectedDevice.id]) return null;

    const currentScheduleType = dayType === 'weekday' ? 'weekdaySchedule' : 'weekendSchedule';
    const schedule = deviceSchedules[selectedDevice.id][currentScheduleType];
    const deviceInfo = deviceSchedules[selectedDevice.id];

    return (
      <View style={styles.deviceScheduler}>
        <View style={styles.deviceSchedulerHeader}>
          <View style={styles.selectedDeviceInfo}>
            <MaterialIcons 
              name={
                selectedDevice.type === 'light' ? 'lightbulb' :
                selectedDevice.type === 'tv' ? 'tv' :
                selectedDevice.type === 'computer' ? 'computer' :
                selectedDevice.type === 'refrigerator' ? 'kitchen' :
                'power'
              } 
              size={20} 
              color="#10b981" 
            />
            <View>
              <Text style={styles.selectedDeviceName}>{selectedDevice.name}</Text>
              <Text style={styles.selectedDeviceType}>
                {selectedDevice.type} • {deviceInfo.power}W • {deviceInfo.priority} priority
              </Text>
            </View>
          </View>
          
          <View style={styles.copyScheduleButtons}>
            <TouchableOpacity
              style={styles.copyScheduleButton}
              onPress={() => copyDaySchedule(dayType === 'weekday' ? 'weekend' : 'weekday', dayType)}
            >
              <MaterialIcons name="content-copy" size={14} color="#10b981" />
              <Text style={styles.copyScheduleText}>
                Copy from {dayType === 'weekday' ? 'Weekend' : 'Weekday'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* IMPROVED: Better time period labels */}
        <View style={styles.timePeriodsContainer}>
          <Text style={styles.schedulerTitle}>Tap hours when this device should be ON:</Text>
          <View style={styles.timePeriodsLabels}>
            <View style={styles.timePeriodLabel}>
              <View style={[styles.timePeriodColor, { backgroundColor: '#8b5cf6' }]} />
              <Text style={styles.timePeriodText}>Night (22-05)</Text>
            </View>
            <View style={styles.timePeriodLabel}>
              <View style={[styles.timePeriodColor, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.timePeriodText}>Morning (06-11)</Text>
            </View>
            <View style={styles.timePeriodLabel}>
              <View style={[styles.timePeriodColor, { backgroundColor: '#10b981' }]} />
              <Text style={styles.timePeriodText}>Afternoon (12-17)</Text>
            </View>
            <View style={styles.timePeriodLabel}>
              <View style={[styles.timePeriodColor, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.timePeriodText}>Evening (18-21)</Text>
            </View>
          </View>
        </View>

        {/* IMPROVED: Hour grid with better time display and colors */}
        <View style={styles.hourGrid}>
          {schedule.map((isActive, hour) => {
            // Determine time period and color
            let timeColor = '#8b5cf6'; // Night
            let timePeriod = 'Night';
            if (hour >= 6 && hour <= 11) {
              timeColor = '#f59e0b'; // Morning
              timePeriod = 'Morning';
            } else if (hour >= 12 && hour <= 17) {
              timeColor = '#10b981'; // Afternoon
              timePeriod = 'Afternoon';
            } else if (hour >= 18 && hour <= 21) {
              timeColor = '#3b82f6'; // Evening
              timePeriod = 'Evening';
            }
            
            // Format hour display (12-hour format with AM/PM)
            const displayHour = hour === 0 ? '12AM' : 
                               hour === 12 ? '12PM' : 
                               hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
            
            return (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.hourButton,
                  isActive && styles.activeHourButton,
                  isActive && { backgroundColor: timeColor, borderColor: timeColor }
                ]}
                onPress={() => toggleHour(selectedDevice.id, hour)}
              >
                <Text style={[styles.hourText, isActive && styles.activeHourText]}>
                  {displayHour}
                </Text>
                <Text style={[styles.hourSubText, isActive && styles.activeHourSubText]}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Schedule summary */}
        <View style={styles.scheduleSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active Hours:</Text>
            <Text style={styles.summaryValue}>{schedule.filter(Boolean).length}/24</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily Energy:</Text>
            <Text style={styles.summaryValue}>
              {Math.round((schedule.filter(Boolean).length * deviceInfo.power) / 1000 * 100) / 100} kWh
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily Cost:</Text>
            <Text style={styles.summaryValue}>
              R{Math.round((schedule.filter(Boolean).length * deviceInfo.power) / 1000 * 2.5 * 100) / 100}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDeviceList = () => (
    <View style={styles.deviceListContainer}>
      <Text style={styles.sectionTitle}>Select Device to Schedule</Text>
      <Text style={styles.sectionDescription}>Choose which device's daily schedule you want to customize</Text>
      <ScrollView 
        style={styles.deviceScrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {appliances.map((device) => {
          const schedule = deviceSchedules[device.id];
          const currentScheduleType = dayType === 'weekday' ? 'weekdaySchedule' : 'weekendSchedule';
          const activeHours = schedule ? schedule[currentScheduleType].filter(Boolean).length : 0;
          
          return (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.deviceItem,
                selectedDevice?.id === device.id && styles.selectedDeviceItem
              ]}
              onPress={() => setSelectedDevice(device)}
            >
              <View style={styles.deviceHeader}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceType}>
                    {device.type} • {device.normal_usage || 100}W • {activeHours}h on {dayType}
                  </Text>
                </View>
                <View style={[
                  styles.priorityBadge,
                  {
                    backgroundColor: 
                      schedule?.priority === 'essential' ? 'rgba(239, 68, 68, 0.1)' :
                      schedule?.priority === 'comfort' ? 'rgba(245, 158, 11, 0.1)' :
                      'rgba(16, 185, 129, 0.1)',
                    borderColor:
                      schedule?.priority === 'essential' ? '#ef4444' :
                      schedule?.priority === 'comfort' ? '#f59e0b' :
                      '#10b981'
                  }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    {
                      color: 
                        schedule?.priority === 'essential' ? '#ef4444' :
                        schedule?.priority === 'comfort' ? '#f59e0b' :
                        '#10b981'
                    }
                  ]}>
                    {schedule?.priority || 'optional'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderPlannerContent = () => (
    <ScrollView 
      style={styles.tabContentScroll}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
    >
      {renderPresets()}
      {renderDayTypeSelector()}
      {renderDeviceList()}
      {renderDeviceScheduler()}
      
      {/* Generate Button */}
      <View style={styles.generateSection}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, styles.generateButton]}
          onPress={async () => {
            try {
              const result = await generateCustomSimulationData();
              if (result.success) {
                Alert.alert(
                  'Day Planning Complete! 🎉',
                  `Generated ${result.samplesGenerated} realistic samples over ${globalSettings.simulationDays} days based on your planned schedule.\n\n${result.trained ? `Models trained with ${(result.accuracy * 100).toFixed(1)}% accuracy!` : 'Ready for ML training!'}`,
                  [
                    { 
                      text: 'Great!', 
                      onPress: () => {
                        if (onSimulationUpdate) onSimulationUpdate(result);
                        onClose();
                      }
                    }
                  ]
                );
              }
            } catch (error) {
              Alert.alert('Generation Error', error.message);
            }
          }}
          disabled={isFastForwarding}
        >
          <MaterialIcons 
            name={isFastForwarding ? "hourglass-empty" : "calendar-today"} 
            size={20} 
            color="#ffffff" 
          />
          <Text style={styles.buttonText}>
            {isFastForwarding ? `Generating... ${progress}%` : `Generate ${globalSettings.simulationDays} Day${globalSettings.simulationDays > 1 ? 's' : ''} of Data`}
          </Text>
        </TouchableOpacity>
        
        {isFastForwarding && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderAdvancedContent = () => (
    <ScrollView 
      style={styles.tabContentScroll}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.advancedSettings}>
        <Text style={styles.sectionTitle}>Simulation Settings</Text>
        <Text style={styles.sectionDescription}>Fine-tune how realistic your simulation data should be</Text>
        
        {/* FIXED: Better days input */}
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Simulation Days</Text>
            <Text style={styles.settingHelpText}>How many days of data to generate (1-99)</Text>
          </View>
          <TextInput
            style={styles.settingInput}
            value={globalSettings.simulationDays.toString()}
            onChangeText={handleDaysInput}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus={true}
          />
        </View>

        {/* IMPROVED: Better variation explanation */}
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Schedule Deviation (%)</Text>
            <Text style={styles.settingHelpText}>
              How often you don't follow your perfect schedule (0% = always perfect, 25% = realistic human behavior)
            </Text>
          </View>
          <TextInput
            style={styles.settingInput}
            value={globalSettings.variationPercent.toString()}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              const variation = Math.max(0, Math.min(50, parseInt(numericValue) || 0));
              setGlobalSettings(prev => ({
                ...prev,
                variationPercent: variation
              }));
            }}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus={true}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Human Behavior Realism (%)</Text>
            <Text style={styles.settingHelpText}>
              How perfectly you follow schedules (100% = robot-like perfection, 70% = normal human with occasional mistakes)
            </Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>{globalSettings.userBehaviorRealism}%</Text>
            <Slider
              style={styles.behaviorSlider}
              minimumValue={50}
              maximumValue={100}
              step={5}
              value={globalSettings.userBehaviorRealism}
              onValueChange={(value) => setGlobalSettings(prev => ({
                ...prev,
                userBehaviorRealism: value
              }))}
              minimumTrackTintColor="#10b981"
              maximumTrackTintColor="#18181b"
              thumbTintColor="#10b981"
            />
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Include Weekend Schedules</Text>
            <Text style={styles.settingHelpText}>Generate different patterns for weekends vs weekdays</Text>
          </View>
          <Switch
            value={globalSettings.includeWeekends}
            onValueChange={(value) => setGlobalSettings(prev => ({
              ...prev,
              includeWeekends: value
            }))}
            trackColor={{ false: '#18181b', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Random Life Events</Text>
            <Text style={styles.settingHelpText}>Unexpected usage like forgetting to turn devices off, waking up early, etc.</Text>
          </View>
          <Switch
            value={globalSettings.randomEvents}
            onValueChange={(value) => setGlobalSettings(prev => ({
              ...prev,
              randomEvents: value
            }))}
            trackColor={{ false: '#18181b', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Realism explanation */}
      <View style={styles.infoCard}>
        <MaterialIcons name="psychology" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          <Text style={{ fontWeight: '700', color: '#ffffff' }}>Why Realism Matters:{'\n'}</Text>
          Perfect schedules create unrealistic training data. Real people forget to turn devices off, wake up at different times, and don't follow rigid patterns. Adding realistic variation helps the AI learn your actual behavior patterns, not just ideal ones.
        </Text>
      </View>
    </ScrollView>
  );

  const renderPreviewContent = () => {
    const totalDailyEnergy = Object.values(deviceSchedules).reduce((sum, device) => {
      const currentScheduleType = dayType === 'weekday' ? 'weekdaySchedule' : 'weekendSchedule';
      const activeHours = device[currentScheduleType].filter(Boolean).length;
      return sum + (activeHours * device.power / 1000);
    }, 0);

    const totalDailyCost = totalDailyEnergy * 2.5;
    const monthlyEstimate = totalDailyCost * (globalSettings.includeWeekends ? 30 : 22);

    return (
      <ScrollView 
        style={styles.tabContentScroll}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="preview" size={20} color="#3b82f6" />
            <Text style={styles.cardTitle}>Schedule Preview - {dayType.charAt(0).toUpperCase() + dayType.slice(1)}</Text>
          </View>
          
          <View style={styles.previewStats}>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatLabel}>Daily Energy</Text>
              <Text style={styles.previewStatValue}>{totalDailyEnergy.toFixed(2)} kWh</Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatLabel}>Daily Cost</Text>
              <Text style={styles.previewStatValue}>R{totalDailyCost.toFixed(2)}</Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatLabel}>Monthly Est.</Text>
              <Text style={styles.previewStatValue}>R{monthlyEstimate.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Timeline view */}
        <View style={styles.timelineCard}>
          <Text style={styles.cardTitle}>24-Hour Timeline - {dayType.charAt(0).toUpperCase() + dayType.slice(1)}</Text>
          <Text style={styles.timelineDescription}>Visual representation of when each device will be active</Text>
          
          {Object.entries(deviceSchedules).map(([deviceId, deviceInfo]) => {
            const device = appliances.find(a => a.id === deviceId);
            if (!device) return null;
            
            const currentScheduleType = dayType === 'weekday' ? 'weekdaySchedule' : 'weekendSchedule';
            const schedule = deviceInfo[currentScheduleType];
            
            return (
              <View key={deviceId} style={styles.timelineRow}>
                <View style={styles.timelineDeviceInfo}>
                  <Text style={styles.timelineDeviceName}>{device.name}</Text>
                  <Text style={styles.timelineDeviceType}>{device.type}</Text>
                </View>
                <View style={styles.timelineHours}>
                  {schedule.map((isActive, hour) => {
                    let timeColor = '#8b5cf6'; // Night
                    if (hour >= 6 && hour <= 11) timeColor = '#f59e0b'; // Morning
                    else if (hour >= 12 && hour <= 17) timeColor = '#10b981'; // Afternoon  
                    else if (hour >= 18 && hour <= 21) timeColor = '#3b82f6'; // Evening
                    
                    return (
                      <View
                        key={hour}
                        style={[
                          styles.timelineHour,
                          isActive && styles.activeTimelineHour,
                          isActive && { backgroundColor: timeColor }
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'planner':
        return renderPlannerContent();
      case 'advanced':
        return renderAdvancedContent();
      case 'preview':
        return renderPreviewContent();
      default:
        return renderPlannerContent();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📅 Plan Your Day</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#6c757d" />
          </TouchableOpacity>
        </View>

        {renderTabs()}
        {renderContent()}
      </View>
    </Modal>
  );
}
