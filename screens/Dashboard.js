import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Image, Alert, PanResponder } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './DashboardComponets/UserAvatar';
import { Vibration } from 'react-native';

import AnalysisTab from './DashboardComponets/Analysis/AnalyticsTab';
import ControlsTab from './DashboardComponets/ControlsTab';
import HomeTab from './DashboardComponets/HomeTab';
import SecurityTab from './DashboardComponets/SecurityTab';
import SettingsTab from './DashboardComponets/SettingsTab';
import LoadsheddingTab from './DashboardComponets/LoadsheddingTab';
import LoadsheddingOverviewModal from './DashboardComponets/LoadsheddingOverviewModal';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [appliances, setAppliances] = useState([]);
  const [loadshedding, setLoadshedding] = useState({
    stage: 0,
    nextSlot: null,
    area: null,
  });
  const [stats, setStats] = useState({
    totalUsage: 0,
    monthlyCost: 0,
    activeDevices: 0,
    efficiency: 85,
  });
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { user, supabase } = useAuth();

  // Swipe gesture state
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const isSwipeGesture = useRef(false);

const panResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Don't interfere with settings tab
      if (activeTab === 5) return false;
      
      // Check for horizontal swipe
      const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      const hasMovement = Math.abs(gestureState.dx) > 20;
      
      return isHorizontal && hasMovement;
    },
    
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
      // Don't interfere with settings tab
      if (activeTab === 5) return false;
      
      // Capture horizontal swipes early to prevent ScrollView from taking them
      const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      const hasSignificantMovement = Math.abs(gestureState.dx) > 15;
      
      return isHorizontal && hasSignificantMovement;
    },
    
    onPanResponderGrant: () => {
      isSwipeGesture.current = true;
    },
    
    onPanResponderMove: (evt, gestureState) => {
      // Track if this is truly a horizontal swipe
      const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      isSwipeGesture.current = isHorizontal;
    },
    
    onPanResponderRelease: (evt, gestureState) => {
      if (!isSwipeGesture.current || activeTab === 5) {
        isSwipeGesture.current = false;
        return;
      }

      const SWIPE_THRESHOLD = 50;
      const VELOCITY_THRESHOLD = 0.3;

      console.log('Swipe:', {
        dx: gestureState.dx,
        vx: gestureState.vx,
        activeTab,
        direction: gestureState.dx < 0 ? 'LEFT (next)' : 'RIGHT (prev)'
      });

      // Swipe LEFT (negative dx) - go FORWARD to next tab
      if ((gestureState.dx < -SWIPE_THRESHOLD || gestureState.vx < -VELOCITY_THRESHOLD) 
          && activeTab < tabs.length - 1) {
        console.log('✓ Moving to tab:', activeTab + 1, tabs[activeTab + 1].name);
        setActiveTab(activeTab + 1);
        Vibration.vibrate(50);
      }
      // Swipe RIGHT (positive dx) - go BACK to previous tab
      else if ((gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > VELOCITY_THRESHOLD) 
               && activeTab > 0) {
        console.log('✓ Moving to tab:', activeTab - 1, tabs[activeTab - 1].name);
        setActiveTab(activeTab - 1);
        Vibration.vibrate(50);
      } else {
        console.log('✗ Swipe not strong enough or at boundary');
      }

      isSwipeGesture.current = false;
    },
    
    onPanResponderTerminate: () => {
      isSwipeGesture.current = false;
    },
    
    // CRITICAL: Don't let native components block our responder
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  })
).current;

const tabs = [
  { name: 'Home',         component: HomeTab,      icon: 'home' },
  { name: 'Devices',      component: ControlsTab,  icon: 'devices' }, 
  { name: 'Analytics',    component: AnalysisTab,  icon: 'bar-chart' },
  { name: 'Loadshedding', component: LoadsheddingTab, icon: 'flash-off' },
  { name: 'Security',     component: SecurityTab,  icon: 'shield' },
];

// ---------- hidden tab (reachable only by avatar) ----------
const SETTINGS_TAB_INDEX = 5;
const hiddenTabs = {
  [SETTINGS_TAB_INDEX]: SettingsTab,   // component for index 5
};

  // Fetch loadshedding data using free API
  const fetchLoadsheddingData = async () => {
    try {
      console.log('Fetching loadshedding data...');
      
      // Using a free loadshedding API that doesn't require authentication
      const statusResponse = await fetch('https://loadshedding.eskom.co.za/LoadShedding/GetStatus', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!statusResponse.ok) {
        console.log('Status response not OK, using mock data');
        // Use mock data for testing if API fails
        setLoadsheddingMockData();
        return;
      }
      
      const statusText = await statusResponse.text();
      console.log('Status response:', statusText);
      
      // The Eskom API returns just a number (0-8) as plain text
      const stage = parseInt(statusText) || 0;
      
      // Get user's area from profile
      const userArea = await getUserArea();
      
      // Calculate next slot based on stage and area (simplified)
      const nextSlot = calculateNextSlot(stage, userArea);
      
      setLoadshedding({
        stage: stage,
        nextSlot: nextSlot,
        area: userArea?.name || 'Not configured',
      });
      
      console.log('Loadshedding data updated:', { stage, area: userArea?.name });
      
    } catch (error) {
      console.error('Error fetching loadshedding data:', error);
      // Use mock data instead of showing error
      setLoadsheddingMockData();
    }
  };

  // Set mock data for testing/demo purposes
  const setLoadsheddingMockData = () => {
    const mockStage = Math.floor(Math.random() * 5); // Random stage 0-4
    const now = new Date();
    const nextStart = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const nextEnd = new Date(nextStart.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hours duration
    
    setLoadshedding({
      stage: mockStage,
      nextSlot: mockStage > 0 ? {
        start: nextStart.toISOString(),
        end: nextEnd.toISOString(),
        note: 'Demo schedule - Configure your area in settings for accurate times',
      } : null,
      area: 'Demo Area (Gauteng)',
    });
    
    console.log('Using mock loadshedding data - Stage:', mockStage);
  };

  // Calculate next loadshedding slot (simplified calculation)
  const calculateNextSlot = (stage, userArea) => {
    if (stage === 0) return null;
    
    // This is a simplified calculation
    // In production, you'd fetch actual schedules from your area's municipality
    const now = new Date();
    const hour = now.getHours();
    
    // Simple logic: calculate next slot based on current time and stage
    let nextSlotHour = Math.ceil(hour / 2) * 2; // Round to next even hour
    if (nextSlotHour === hour) nextSlotHour += 2;
    if (nextSlotHour >= 24) nextSlotHour = 0;
    
    const nextStart = new Date(now);
    nextStart.setHours(nextSlotHour, 0, 0, 0);
    if (nextStart <= now) {
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    const nextEnd = new Date(nextStart.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hours
    
    return {
      start: nextStart.toISOString(),
      end: nextEnd.toISOString(),
      note: userArea ? `Stage ${stage} loadshedding for ${userArea.name}` : 'Configure your area for accurate schedules',
    };
  };

  // Get user's area from profile
  const getUserArea = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('loadshedding_area_name, loadshedding_area_id')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.log('No area configured in profile');
        return null;
      }
      
      return {
        id: data?.loadshedding_area_id,
        name: data?.loadshedding_area_name || 'Unknown Area',
      };
    } catch (error) {
      console.error('Error getting user area:', error);
      return null;
    }
  };

  // Fetch appliances data
  const fetchAppliances = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching appliances:', error);
        return;
      }

      setAppliances(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error in fetchAppliances:', error);
    }
  };

  const calculateStats = (applianceList) => {
    const activeAppliances = applianceList.filter(app => app.status === 'on');
    const totalUsage = activeAppliances.reduce((sum, app) => sum + app.normal_usage, 0);

    const kWh = totalUsage / 1000;
    const hoursPerMonth = 24 * 30;
    const monthlyCost = kWh * hoursPerMonth * 2.50;

    const avgUsagePerDevice = totalUsage / Math.max(activeAppliances.length, 1);
    let efficiency = 100;
    if (avgUsagePerDevice > 300) efficiency = 60;
    else if (avgUsagePerDevice > 200) efficiency = 70;
    else if (avgUsagePerDevice > 100) efficiency = 80;
    else efficiency = 90;

    setStats({
      totalUsage: Math.round(totalUsage),
      monthlyCost: Math.round(monthlyCost),
      activeDevices: activeAppliances.length,
      efficiency,
    });
  };

  useEffect(() => {
    if (user?.id) {
      fetchAppliances();
      fetchLoadsheddingData();
      
      // Refresh loadshedding data every 15 minutes
      const interval = setInterval(fetchLoadsheddingData, 15 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id]);

const renderActiveComponent = () => {
  if (activeTab === 5) {
    const SettingsComponent = hiddenTabs[5];
    return <SettingsComponent />;
  }

  const ActiveComponent = tabs[activeTab].component;

  if (activeTab === 1) {
    return <ActiveComponent appliances={appliances} />;
  }
  if (activeTab === 2) {
    return <ActiveComponent appliances={appliances} stats={stats} />;
  }
  if (activeTab === 3) {             
    return <ActiveComponent loadshedding={loadshedding} onRefresh={fetchLoadsheddingData} />;
  }

  return <ActiveComponent />;
};

const handleUserSettings = () => setActiveTab(SETTINGS_TAB_INDEX);

  const handleStageIndicatorPress = () => {
    setShowOverviewModal(true);
  };

  const handlePrepareDevices = async () => {
    setShowOverviewModal(false);
    const activeDevices = appliances.filter(app => app.status === 'on');
    const essentialDevices = appliances.filter(app => 
      ['refrigerator', 'router', 'camera'].includes(app.type)
    );
    
    if (activeDevices.length === 0) {
      Alert.alert('All Set!', 'All your devices are already turned off.');
      return;
    }

    const nonEssential = activeDevices.filter(app => 
      !essentialDevices.find(e => e.id === app.id)
    );

    if (nonEssential.length === 0) {
      Alert.alert('Only Essential Devices', 'Only essential devices are currently active.');
      return;
    }

    Alert.alert(
      'Prepare for Loadshedding',
      `Turn off ${nonEssential.length} non-essential device${nonEssential.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn Off',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appliances')
                .update({ status: 'off' })
                .in('id', nonEssential.map(app => app.id));

              if (error) throw error;

              await fetchAppliances();
              Alert.alert('Success', `Turned off ${nonEssential.length} device${nonEssential.length !== 1 ? 's' : ''}.`);
            } catch (error) {
              console.error('Error preparing devices:', error);
              Alert.alert('Error', 'Failed to update some devices');
            }
          }
        }
      ]
    );
  };

  const handleGoToLoadshedding = () => {
    setShowOverviewModal(false);
    setActiveTab(3);
  };

  const handleGoToControls = () => {
    setShowOverviewModal(false)
    setActiveTab(1);
  };

  // Get stage color
  const getStageColor = () => {
    if (loadshedding.stage === 0) return '#10b981';
    if (loadshedding.stage <= 2) return '#f59e0b';
    if (loadshedding.stage <= 4) return '#f97316';
    return '#ef4444';
  };

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top, paddingBottom: insets.bottom }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Loadshedding Indicator - Now clickable */}
        <TouchableOpacity 
          style={styles.loadsheddingIndicator}
          onPress={handleStageIndicatorPress}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name="flash-off" 
            size={16} 
            color={getStageColor()} 
          />
          <Text style={[styles.stageText, { color: getStageColor() }]}>
            Stage {loadshedding.stage}
          </Text>
        </TouchableOpacity>
  
        <UserAvatar onPress={handleUserSettings} />
      </View>

      {/* Main Content with Swipe Gesture */}
      <View 
        style={styles.content}
        {...panResponder.panHandlers}
      >
        {renderActiveComponent()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navButton}
            onPress={() => setActiveTab(index)}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={tab.icon} 
              size={24} 
              color={activeTab === index ? '#10b981' : '#6c757d'} 
            />
            <Text style={[
              styles.navText,
              activeTab === index && styles.activeNavText
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loadshedding Overview Modal */}
      <LoadsheddingOverviewModal
        visible={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
        loadshedding={loadshedding}
        appliances={appliances}
        onPrepareDevices={handlePrepareDevices}
        onGoToLoadshedding={handleGoToLoadshedding}
        onGoToControls={handleGoToControls}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  header: {
    backgroundColor: '#0a0a0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
  },
  loadsheddingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0b',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: width < 375 ? 10 : 11,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
  },
  activeNavText: {
    color: '#10b981',
    fontWeight: '600',
  },
});

const App = () => {
  return (
    <SafeAreaProvider>
      <Dashboard />
    </SafeAreaProvider>
  );
};

export default Dashboard;