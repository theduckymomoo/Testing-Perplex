import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const AUTOMATION_STORAGE_KEY = '@loadshedding_automation';
const NOTIFICATION_PREFS_KEY = '@loadshedding_notifications';

const LoadsheddingTab = ({ loadshedding, onRefresh }) => {
  const { user, supabase } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [appliances, setAppliances] = useState([]);
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [automationRules, setAutomationRules] = useState({
    autoTurnOffHighUsage: true,
    autoTurnOffNonEssential: false,
    notifyBeforeOutage: true,
    notifyMinutesBefore: 30,
    protectedDevices: [],
  });


  const [deviceCategories, setDeviceCategories] = useState({
    essential: [],
    highUsage: [],
    nonEssential: [],
  });
  const [upcomingActions, setUpcomingActions] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState([]);
  const [showStageDetailsModal, setShowStageDetailsModal] = useState(false);

  useEffect(() => {
    loadAutomationSettings();
    loadNotificationPreferences();
    if (user?.id) {
      fetchAppliances();
    }
  }, [user?.id]);

  useEffect(() => {
    if (appliances.length > 0) {
      categorizeDevices();
    }
  }, [appliances]);

  useEffect(() => {
    if (loadshedding.nextSlot && automationEnabled) {
      calculateUpcomingActions();
    }
  }, [loadshedding, automationEnabled, automationRules, appliances]);

  const loadAutomationSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTOMATION_STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        setAutomationEnabled(settings.enabled || false);
        setAutomationRules({ ...automationRules, ...settings.rules });
      }
    } catch (error) {
      console.error('Error loading automation settings:', error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        setNotificationsEnabled(prefs.enabled !== false);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const saveAutomationSettings = async (enabled, rules) => {
    try {
      await AsyncStorage.setItem(
        AUTOMATION_STORAGE_KEY,
        JSON.stringify({ enabled, rules })
      );
    } catch (error) {
      console.error('Error saving automation settings:', error);
    }
  };

  const saveNotificationPreferences = async (enabled) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_PREFS_KEY,
        JSON.stringify({ enabled })
      );
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const fetchAppliances = async () => {
    try {
      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppliances(data || []);
    } catch (error) {
      console.error('Error fetching appliances:', error);
    }
  };

  const categorizeDevices = () => {
    const essential = appliances.filter(app => 
      ['refrigerator', 'router', 'camera'].includes(app.type)
    );
    
    const highUsage = appliances.filter(app => 
      app.normal_usage > 300 && !essential.find(e => e.id === app.id)
    );
    
    const nonEssential = appliances.filter(app => 
      !essential.find(e => e.id === app.id) && 
      !highUsage.find(h => h.id === app.id)
    );

    setDeviceCategories({ essential, highUsage, nonEssential });
  };

  const calculateUpcomingActions = () => {
    if (!loadshedding.nextSlot) return;

    const actions = [];
    const outageStart = new Date(loadshedding.nextSlot.start);
    const now = new Date();
    const minutesUntilOutage = Math.floor((outageStart - now) / (1000 * 60));

    if (minutesUntilOutage > 0 && minutesUntilOutage <= 60) {
      if (automationRules.autoTurnOffHighUsage) {
        const activeHighUsage = deviceCategories.highUsage.filter(
          app => app.status === 'on' && !automationRules.protectedDevices.includes(app.id)
        );
        
        if (activeHighUsage.length > 0) {
          actions.push({
            type: 'turn_off',
            devices: activeHighUsage,
            reason: 'High power consumption',
            icon: '⚡',
            color: '#f97316',
          });
        }
      }

      if (automationRules.autoTurnOffNonEssential) {
        const activeNonEssential = deviceCategories.nonEssential.filter(
          app => app.status === 'on' && !automationRules.protectedDevices.includes(app.id)
        );
        
        if (activeNonEssential.length > 0) {
          actions.push({
            type: 'turn_off',
            devices: activeNonEssential,
            reason: 'Non-essential devices',
            icon: '🔌',
            color: '#6b7280',
          });
        }
      }

      if (automationRules.notifyBeforeOutage) {
        actions.push({
          type: 'notification',
          message: `Loadshedding in ${minutesUntilOutage} minutes`,
          icon: '🔔',
          color: '#3b82f6',
        });
      }
    }

    setUpcomingActions(actions);
  };

  const toggleAutomation = async () => {
    const newState = !automationEnabled;
    setAutomationEnabled(newState);
    await saveAutomationSettings(newState, automationRules);
    
    if (newState) {
      Vibration.vibrate(100);
      Alert.alert(
        'Automation Enabled',
        'Devices will be automatically managed during loadshedding based on your rules.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleNotifications = async () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    await saveNotificationPreferences(newState);
    Vibration.vibrate(50);
  };

  const handlePrepareForOutage = async () => {
    const activeDevices = appliances.filter(app => app.status === 'on');
    
    if (activeDevices.length === 0) {
      Alert.alert('All Set!', 'All your devices are already turned off.');
      return;
    }

    const highUsageDevices = activeDevices.filter(app => app.normal_usage > 300);
    const essentialDevices = activeDevices.filter(app => 
      deviceCategories.essential.find(e => e.id === app.id)
    );

    let message = `Found ${activeDevices.length} active devices:\n\n`;
    
    if (highUsageDevices.length > 0) {
      message += `⚡ ${highUsageDevices.length} high-usage devices\n`;
    }
    if (essentialDevices.length > 0) {
      message += `🛡️ ${essentialDevices.length} essential devices\n`;
    }

    message += '\nWould you like to turn off non-essential devices?';

    Alert.alert(
      'Prepare for Loadshedding',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn Off Non-Essential',
          onPress: async () => {
            try {
              const toTurnOff = activeDevices.filter(app => 
                !deviceCategories.essential.find(e => e.id === app.id)
              );

              const { error } = await supabase
                .from('appliances')
                .update({ status: 'off' })
                .in('id', toTurnOff.map(app => app.id));

              if (error) throw error;

              await fetchAppliances();
              Vibration.vibrate([100, 50, 100]);
              
              Alert.alert(
                'Success',
                `Turned off ${toTurnOff.length} devices. Essential devices remain on.`
              );
            } catch (error) {
              console.error('Error preparing for outage:', error);
              Alert.alert('Error', 'Failed to update some devices');
            }
          }
        }
      ]
    );
  };

  const updateAutomationRule = (key, value) => {
    const newRules = { ...automationRules, [key]: value };
    setAutomationRules(newRules);
    if (automationEnabled) {
      saveAutomationSettings(automationEnabled, newRules);
    }
  };

  const toggleProtectedDevice = (deviceId) => {
    const protectedList = [...automationRules.protectedDevices];
    const index = protectedList.indexOf(deviceId);
    
    if (index > -1) {
      protectedList.splice(index, 1);
    } else {
      protectedList.push(deviceId);
    }
    
    updateAutomationRule('protectedDevices', protectedList);
    Vibration.vibrate(50);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([onRefresh(), fetchAppliances()]);
    setRefreshing(false);
  };

  const getStageInfo = (stage) => {
    const stageInfo = {
      0: {
        title: 'No Loadshedding',
        description: 'Power supply is stable',
        color: '#10b981',
        icon: 'check-circle',
        tips: ['Charge all devices', 'Prepare for potential outages', 'Check battery backups'],
        outageFrequency: 'None',
        averageDuration: 'N/A',
        powerShortage: '0 MW',
        dailyOutages: 0,
      },
      1: {
        title: 'Stage 1',
        description: '1000 MW shortage - Minimal impact',
        color: '#f59e0b',
        icon: 'warning',
        tips: ['Charge essential devices', 'Know your schedule', 'Prepare food in advance'],
        outageFrequency: 'Once per day',
        averageDuration: '2.5 hours',
        powerShortage: '1000 MW',
        dailyOutages: 1,
      },
      2: {
        title: 'Stage 2',
        description: '2000 MW shortage - Moderate impact',
        color: '#f59e0b',
        icon: 'warning',
        tips: ['Use gas for cooking', 'Limit high-power appliances', 'Keep phones charged'],
        outageFrequency: 'Twice per day',
        averageDuration: '2.5 hours each',
        powerShortage: '2000 MW',
        dailyOutages: 2,
      },
      3: {
        title: 'Stage 3',
        description: '3000 MW shortage - Significant impact',
        color: '#f97316',
        icon: 'error',
        tips: ['Switch off geysers', 'Use alternative lighting', 'Plan meals carefully'],
        outageFrequency: '2-3 times per day',
        averageDuration: '2.5 hours each',
        powerShortage: '3000 MW',
        dailyOutages: 3,
      },
      4: {
        title: 'Stage 4',
        description: '4000 MW shortage - Severe impact',
        color: '#f97316',
        icon: 'error',
        tips: ['Minimize electricity use', 'Use battery backups', 'Stock up on essentials'],
        outageFrequency: '3-4 times per day',
        averageDuration: '2.5-3 hours each',
        powerShortage: '4000 MW',
        dailyOutages: 4,
      },
      5: {
        title: 'Stage 5',
        description: '5000 MW shortage - Critical',
        color: '#ef4444',
        icon: 'dangerous',
        tips: ['Emergency mode', 'Use only essential devices', 'Preserve food with ice'],
        outageFrequency: '4-5 times per day',
        averageDuration: '3 hours each',
        powerShortage: '5000 MW',
        dailyOutages: 5,
      },
      6: {
        title: 'Stage 6',
        description: '6000 MW shortage - Extreme',
        color: '#ef4444',
        icon: 'dangerous',
        tips: ['Crisis management', 'Minimal electricity use', 'Use alternative power sources'],
        outageFrequency: '5-6 times per day',
        averageDuration: '3-4 hours each',
        powerShortage: '6000 MW',
        dailyOutages: 6,
      },
      7: {
        title: 'Stage 7',
        description: '7000 MW shortage - Catastrophic',
        color: '#dc2626',
        icon: 'dangerous',
        tips: ['Maximum conservation', 'Use generators if available', 'Emergency protocols'],
        outageFrequency: '6-7 times per day',
        averageDuration: '4 hours each',
        powerShortage: '7000 MW',
        dailyOutages: 7,
      },
      8: {
        title: 'Stage 8',
        description: '8000 MW shortage - Unprecedented',
        color: '#dc2626',
        icon: 'dangerous',
        tips: ['Extreme measures', 'Total blackout likely', 'Use emergency supplies'],
        outageFrequency: '7-8 times per day',
        averageDuration: '4+ hours each',
        powerShortage: '8000 MW',
        dailyOutages: 8,
      },
    };

    return stageInfo[stage] || stageInfo[0];
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getTimeUntilOutage = () => {
    if (!loadshedding.nextSlot) return null;
    
    const now = new Date();
    const start = new Date(loadshedding.nextSlot.start);
    const diff = start - now;
    
    if (diff <= 0) return 'In progress';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  const currentStage = loadshedding.stage || 0;
  const stageInfo = getStageInfo(currentStage);
  const timeUntil = getTimeUntilOutage();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      directionalLockEnabled={true}
      scrollEventThrottle={16}
      nestedScrollEnabled={false}
      bounces={true}
      alwaysBounceHorizontal={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#10b981"
          colors={['#10b981']}
        />
      }
    >
      {/* Current Stage Card */}
      <TouchableOpacity 
        style={styles.stageCard}
        onPress={() => setShowStageDetailsModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.stageHeader}>
          <MaterialIcons 
            name={stageInfo.icon} 
            size={48} 
            color={stageInfo.color} 
          />
          <Text style={styles.stageTitle}>{stageInfo.title}</Text>
        </View>
        
        <View style={[styles.stageBadge, { backgroundColor: stageInfo.color }]}>
          <Text style={styles.stageBadgeText}>CURRENT STATUS</Text>
        </View>
        
        <Text style={styles.stageDescription}>{stageInfo.description}</Text>
        
        <View style={styles.stageFooter}>
          <MaterialIcons name="info-outline" size={16} color="#a1a1aa" />
          <Text style={styles.stageFooterText}>Tap for detailed stage information</Text>
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      {currentStage > 0 && (
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handlePrepareForOutage}
            >
              <MaterialIcons name="power-settings-new" size={24} color="#ef4444" />
              <Text style={styles.quickActionText}>Prepare Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setShowAutomationModal(true)}
            >
              <MaterialIcons name="settings-applications" size={24} color="#3b82f6" />
              <Text style={styles.quickActionText}>Automation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setShowScheduleModal(true)}
            >
              <MaterialIcons name="schedule" size={24} color="#f59e0b" />
              <Text style={styles.quickActionText}>View Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Automation Status */}
      <View style={styles.automationCard}>
        <View style={styles.automationHeader}>
          <View style={styles.automationLeft}>
            <MaterialIcons 
              name="auto-fix-high" 
              size={24} 
              color={automationEnabled ? '#10b981' : '#6b7280'} 
            />
            <View>
              <Text style={styles.automationTitle}>Smart Automation</Text>
              <Text style={styles.automationSubtitle}>
                {automationEnabled ? 'Active' : 'Disabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={automationEnabled}
            onValueChange={toggleAutomation}
            trackColor={{ false: '#374151', true: '#10b981' }}
            thumbColor={automationEnabled ? '#ffffff' : '#9ca3af'}
          />
        </View>
        
        {automationEnabled && upcomingActions.length > 0 && (
          <View style={styles.upcomingActions}>
            <Text style={styles.upcomingActionsTitle}>Scheduled Actions:</Text>
            {upcomingActions.map((action, index) => (
              <View key={index} style={styles.actionItem}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionText}>
                  {action.type === 'turn_off' 
                    ? `Turn off ${action.devices.length} ${action.reason.toLowerCase()} devices`
                    : action.message}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Area Info */}
      {loadshedding.area && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="location-on" size={24} color="#10b981" />
            <Text style={styles.infoTitle}>Your Area</Text>
          </View>
          <Text style={styles.infoText}>{loadshedding.area}</Text>
        </View>
      )}

      {/* Next Slot */}
      {loadshedding.nextSlot && (
        <View style={styles.nextSlotCard}>
          <View style={styles.nextSlotHeader}>
            <MaterialIcons name="schedule" size={24} color="#ef4444" />
            <Text style={styles.nextSlotTitle}>Next Outage</Text>
            {timeUntil && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{timeUntil}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.timeContainer}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Start</Text>
              <Text style={styles.timeValue}>
                {formatTime(loadshedding.nextSlot.start)}
              </Text>
              <Text style={styles.dateValue}>
                {formatDate(loadshedding.nextSlot.start)}
              </Text>
            </View>
            
            <MaterialIcons name="arrow-forward" size={24} color="#6c757d" />
            
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>End</Text>
              <Text style={styles.timeValue}>
                {formatTime(loadshedding.nextSlot.end)}
              </Text>
              <Text style={styles.dateValue}>
                {formatDate(loadshedding.nextSlot.end)}
              </Text>
            </View>
          </View>
          
          {loadshedding.nextSlot.note && (
            <Text style={styles.slotNote}>{loadshedding.nextSlot.note}</Text>
          )}
        </View>
      )}

      {/* Device Impact Analysis */}
      {appliances.length > 0 && (
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Device Impact</Text>
          
          <View style={styles.impactGrid}>
            <View style={styles.impactItem}>
              <MaterialIcons name="security" size={20} color="#10b981" />
              <Text style={styles.impactNumber}>{deviceCategories.essential.length}</Text>
              <Text style={styles.impactLabel}>Essential</Text>
            </View>
            
            <View style={styles.impactItem}>
              <MaterialIcons name="flash-on" size={20} color="#f97316" />
              <Text style={styles.impactNumber}>{deviceCategories.highUsage.length}</Text>
              <Text style={styles.impactLabel}>High Usage</Text>
            </View>
            
            <View style={styles.impactItem}>
              <MaterialIcons name="devices" size={20} color="#6b7280" />
              <Text style={styles.impactNumber}>
                {appliances.filter(app => app.status === 'on').length}
              </Text>
              <Text style={styles.impactLabel}>Active Now</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tips Card */}
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <MaterialIcons name="lightbulb" size={24} color="#f59e0b" />
          <Text style={styles.tipsTitle}>Power Saving Tips</Text>
        </View>
        
        {stageInfo.tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Stage Legend */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Stage Information</Text>
        
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((stage) => {
          const info = getStageInfo(stage);
          return (
            <View 
              key={stage} 
              style={[
                styles.legendItem,
                currentStage === stage && styles.legendItemActive
              ]}
            >
              <View 
                style={[
                  styles.legendIndicator, 
                  { backgroundColor: info.color }
                ]} 
              />
              <Text style={styles.legendText}>{info.title}</Text>
              {currentStage === stage && (
                <MaterialIcons name="check" size={16} color="#10b981" />
              )}
            </View>
          );
        })}
      </View>

      {/* Notifications Toggle */}
      <View style={styles.notificationCard}>
        <View style={styles.notificationHeader}>
          <MaterialIcons name="notifications" size={24} color="#3b82f6" />
          <Text style={styles.notificationTitle}>Outage Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#374151', true: '#3b82f6' }}
            thumbColor={notificationsEnabled ? '#ffffff' : '#9ca3af'}
          />
        </View>
        <Text style={styles.notificationText}>
          Get notified {automationRules.notifyMinutesBefore} minutes before loadshedding starts
        </Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialIcons name="info" size={20} color="#3b82f6" />
        <Text style={styles.infoBannerText}>
          Pull down to refresh loadshedding information. Data updates every 15 minutes automatically.
        </Text>
      </View>

      {/* Automation Modal */}
      <Modal
        visible={showAutomationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAutomationModal(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Automation Settings</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView
           style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            directionalLockEnabled={true}
            scrollEventThrottle={16}
            nestedScrollEnabled={false}
            bounces={true}
            alwaysBounceHorizontal={false}
           >
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Auto-Off Rules</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="flash-off" size={20} color="#f97316" />
                  <Text style={styles.settingLabel}>Turn off high-usage devices</Text>
                </View>
                <Switch
                  value={automationRules.autoTurnOffHighUsage}
                  onValueChange={(value) => updateAutomationRule('autoTurnOffHighUsage', value)}
                  trackColor={{ false: '#374151', true: '#10b981' }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="power-settings-new" size={20} color="#6b7280" />
                  <Text style={styles.settingLabel}>Turn off non-essential devices</Text>
                </View>
                <Switch
                  value={automationRules.autoTurnOffNonEssential}
                  onValueChange={(value) => updateAutomationRule('autoTurnOffNonEssential', value)}
                  trackColor={{ false: '#374151', true: '#10b981' }}
                />
              </View>
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Notifications</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="notifications-active" size={20} color="#3b82f6" />
                  <Text style={styles.settingLabel}>Notify before outage</Text>
                </View>
                <Switch
                  value={automationRules.notifyBeforeOutage}
                  onValueChange={(value) => updateAutomationRule('notifyBeforeOutage', value)}
                  trackColor={{ false: '#374151', true: '#3b82f6' }}
                />
              </View>
            </View>

            {appliances.length > 0 && (
              <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Protected Devices</Text>
                <Text style={styles.settingSubtitle}>
                  These devices won't be turned off automatically
                </Text>
                
                {appliances.map(app => (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.deviceProtectItem}
                    onPress={() => toggleProtectedDevice(app.id)}
                  >
                    <View style={styles.deviceProtectLeft}>
                      <Text style={styles.deviceProtectIcon}>
                        {app.type === 'refrigerator' ? '❄️' : 
                         app.type === 'router' ? '📶' : 
                         app.type === 'camera' ? '📹' : '⚡'}
                      </Text>
                      <View>
                        <Text style={styles.deviceProtectName}>{app.name}</Text>
                        <Text style={styles.deviceProtectRoom}>{app.room}</Text>
                      </View>
                    </View>
                    <MaterialIcons
                      name={automationRules.protectedDevices.includes(app.id) ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={automationRules.protectedDevices.includes(app.id) ? '#10b981' : '#6b7280'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Weekly Schedule</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView 
            style={styles.modalContent}
            howsVerticalScrollIndicator={false}
            directionalLockEnabled={true}
            scrollEventThrottle={16}
            nestedScrollEnabled={false}
            bounces={true}
            alwaysBounceHorizontal={false}
          >
            <View style={styles.scheduleInfo}>
              <MaterialIcons name="info" size={20} color="#3b82f6" />
              <Text style={styles.scheduleInfoText}>
                Configure your area in settings for accurate schedules
              </Text>
            </View>

            {loadshedding.area && loadshedding.area !== 'Demo Area (Gauteng)' ? (
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleText}>
                  Schedule information will be available once you configure your specific area in settings.
                </Text>
              </View>
            ) : (
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleText}>
                  This is demo data. Configure your area in settings to see your actual loadshedding schedule.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Stage Details Modal */}
      <Modal
        visible={showStageDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStageDetailsModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Stage Details</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView 
            style={styles.modalContent}
            howsVerticalScrollIndicator={false}
            directionalLockEnabled={true}
            scrollEventThrottle={16}
            nestedScrollEnabled={false}
            bounces={true}
            alwaysBounceHorizontal={false}
          >
            {/* Current Stage Overview */}
            <View style={[styles.stageDetailCard, { borderColor: stageInfo.color }]}>
              <View style={styles.stageDetailHeader}>
                <MaterialIcons name={stageInfo.icon} size={40} color={stageInfo.color} />
                <View style={styles.stageDetailTitleSection}>
                  <Text style={styles.stageDetailTitle}>{stageInfo.title}</Text>
                  <Text style={styles.stageDetailSubtitle}>{stageInfo.description}</Text>
                </View>
              </View>

              <View style={styles.stageMetricsGrid}>
                <View style={styles.stageMetricItem}>
                  <MaterialIcons name="flash-off" size={24} color="#f97316" />
                  <Text style={styles.stageMetricValue}>{stageInfo.powerShortage}</Text>
                  <Text style={styles.stageMetricLabel}>Power Deficit</Text>
                </View>

                <View style={styles.stageMetricItem}>
                  <MaterialIcons name="access-time" size={24} color="#3b82f6" />
                  <Text style={styles.stageMetricValue}>{stageInfo.dailyOutages}</Text>
                  <Text style={styles.stageMetricLabel}>Outages/Day</Text>
                </View>

                <View style={styles.stageMetricItem}>
                  <MaterialIcons name="schedule" size={24} color="#f59e0b" />
                  <Text style={styles.stageMetricValue}>{stageInfo.averageDuration}</Text>
                  <Text style={styles.stageMetricLabel}>Duration</Text>
                </View>
              </View>

              <View style={styles.frequencySection}>
                <Text style={styles.frequencyLabel}>Frequency</Text>
                <Text style={styles.frequencyValue}>{stageInfo.outageFrequency}</Text>
              </View>
            </View>

            {/* All Stages Comparison */}
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonTitle}>All Stages Overview</Text>
              <Text style={styles.comparisonSubtitle}>
                Tap any stage to see details
              </Text>

              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((stage) => {
                const info = getStageInfo(stage);
                const isCurrentStage = stage === currentStage;
                
                return (
                  <View 
                    key={stage}
                    style={[
                      styles.comparisonStageItem,
                      isCurrentStage && styles.comparisonStageItemActive
                    ]}
                  >
                    <View style={styles.comparisonStageLeft}>
                      <View style={[styles.comparisonStageIndicator, { backgroundColor: info.color }]}>
                        <Text style={styles.comparisonStageNumber}>{stage}</Text>
                      </View>
                      <View style={styles.comparisonStageInfo}>
                        <Text style={styles.comparisonStageName}>{info.title}</Text>
                        <Text style={styles.comparisonStageFrequency}>
                          {info.outageFrequency} • {info.averageDuration}
                        </Text>
                      </View>
                    </View>
                    {isCurrentStage && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Expected Impact */}
            {currentStage > 0 && (
              <View style={styles.impactSection}>
                <Text style={styles.impactSectionTitle}>Expected Impact</Text>
                
                <View style={styles.impactInfoCard}>
                  <MaterialIcons name="access-time" size={20} color="#f59e0b" />
                  <View style={styles.impactInfoContent}>
                    <Text style={styles.impactInfoTitle}>Daily Downtime</Text>
                    <Text style={styles.impactInfoText}>
                      Approximately {stageInfo.dailyOutages * 2.5} hours per day without power
                    </Text>
                  </View>
                </View>

                <View style={styles.impactInfoCard}>
                  <MaterialIcons name="warning" size={20} color="#ef4444" />
                  <View style={styles.impactInfoContent}>
                    <Text style={styles.impactInfoTitle}>Grid Pressure</Text>
                    <Text style={styles.impactInfoText}>
                      National grid is under {stageInfo.powerShortage} of pressure
                    </Text>
                  </View>
                </View>

                {currentStage >= 3 && (
                  <View style={styles.impactInfoCard}>
                    <MaterialIcons name="priority-high" size={20} color="#dc2626" />
                    <View style={styles.impactInfoContent}>
                      <Text style={styles.impactInfoTitle}>Critical Stage</Text>
                      <Text style={styles.impactInfoText}>
                        Consider backup power solutions and emergency preparations
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Tips for Current Stage */}
            <View style={styles.detailTipsSection}>
              <Text style={styles.detailTipsTitle}>Recommended Actions</Text>
              {stageInfo.tips.map((tip, index) => (
                <View key={index} style={styles.detailTipItem}>
                  <View style={styles.detailTipNumber}>
                    <Text style={styles.detailTipNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.detailTipText}>{tip}</Text>
                </View>
              ))}
            </View>
            
            {/* Info Note */}
            <View style={styles.detailInfoNote}>
              <MaterialIcons name="info" size={20} color="#3b82f6" />
              <Text style={styles.detailInfoNoteText}>
                Stage timings and frequencies are approximate and may vary based on your area and grid conditions.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  stageHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 12,
    textAlign: 'center',
  },
  stageBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  stageBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stageDescription: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 24,
  },
  stageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  stageFooterText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  quickActionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
    textAlign: 'center',
  },
  automationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  automationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  automationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  automationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  automationSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  upcomingActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  upcomingActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  infoText: {
    fontSize: 16,
    color: '#a1a1aa',
    lineHeight: 24,
  },
  nextSlotCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  nextSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  nextSlotTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  countdownBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 4,
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  slotNote: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  impactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  impactItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  impactNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  impactLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 20,
  },
  legendCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  legendItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalClose: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingSection: {
    marginBottom: 32,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    flex: 1,
  },
  deviceProtectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deviceProtectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deviceProtectIcon: {
    fontSize: 24,
  },
  deviceProtectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  deviceProtectRoom: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  scheduleInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  scheduleInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 20,
  },
  scheduleContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scheduleText: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 22,
    textAlign: 'center',
  },
  stageDetailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  stageDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  stageDetailTitleSection: {
    flex: 1,
  },
  stageDetailTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  stageDetailSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 20,
  },
  stageMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stageMetricItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  stageMetricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  stageMetricLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    textAlign: 'center',
  },
  frequencySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  frequencyLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 4,
    fontWeight: '600',
  },
  frequencyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  comparisonSection: {
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
  },
  comparisonStageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  comparisonStageItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  comparisonStageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  comparisonStageIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonStageNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  comparisonStageInfo: {
    flex: 1,
  },
  comparisonStageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  comparisonStageFrequency: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  currentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1,
  },
  impactSection: {
    marginBottom: 20,
  },
  impactSectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 16,
  },
  impactInfoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  impactInfoContent: {
    flex: 1,
  },
  impactInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  impactInfoText: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  detailTipsSection: {
    marginBottom: 20,
  },
  detailTipsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 16,
  },
  detailTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailTipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTipNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  detailTipText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    fontWeight: '500',
  },
  detailInfoNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  detailInfoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 20,
  },
});

export default LoadsheddingTab;