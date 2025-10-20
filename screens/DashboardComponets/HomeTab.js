import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeTab = () => {
  const { user, userProfile, supabase } = useAuth();
  const navigation = useNavigation();
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState({});

  // Animation values - separate for native and non-native drivers
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinY = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const bounceValue = useRef(new Animated.Value(1)).current;
  const glowValue = useRef(new Animated.Value(0)).current;
  const floatValue = useRef(new Animated.Value(0)).current;

  // 3D Rotation animation (Native driver)
  useEffect(() => {
    const startRotation = () => {
      spinValue.setValue(0);
      spinY.setValue(0);
      
      Animated.parallel([
        // Y-axis rotation for 3D effect
        Animated.timing(spinY, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Z-axis rotation
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => startRotation());
    };

    startRotation();

    // Pulsing effect for active usage (Native driver)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatValue, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Glow effect with JS driver (separate from native animations)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // JS driver for opacity
        }),
        Animated.timing(glowValue, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // JS driver for opacity
        }),
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinYRotation = spinY.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatTranslate = floatValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const glowOpacity = glowValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const handlePowerIconPress = () => {
    // Bounce animation on press (Native driver)
    Animated.sequence([
      Animated.timing(bounceValue, {
        toValue: 0.8,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(bounceValue, {
        toValue: 1.2,
        duration: 150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(bounceValue, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Refresh data when power icon is pressed
    onRefresh();
  };

  const getApplianceIcon = useCallback((type) => {
    if (!type) return 'power';
    
    const iconMap = {
      refrigerator: 'kitchen',
      tv: 'tv',
      washing_machine: 'local-laundry-service',
      air_conditioner: 'ac-unit',
      heater: 'whatshot',
      light: 'lightbulb-outline',
      microwave: 'microwave',
      dishwasher: 'dishwasher',
      computer: 'computer',
      fan: 'toys',
      router: 'router',
      speaker: 'speaker',
      camera: 'videocam',
    };
    return iconMap[type.toLowerCase()] || 'power';
  }, []);

  const fetchAppliances = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching appliances:', error);
        Alert.alert('Error', 'Failed to load appliances. Please try again.');
        setAppliances([]);
        return;
      }

      console.log('Fetched appliances:', data?.length || 0, 'devices');
      setAppliances(data || []);
    } catch (error) {
      console.error('Error in fetchAppliances:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setAppliances([]);
    }
  }, [user?.id, supabase]);

  const toggleAppliance = useCallback(async (applianceId, currentStatus) => {
    if (!applianceId) {
      Alert.alert('Error', 'Invalid device ID');
      return;
    }

    const newStatus = currentStatus === 'on' ? 'off' : 'on';
    
    // Store original appliances for rollback
    const originalAppliances = [...appliances];

    // Optimistic update - update UI immediately
    const updatedAppliances = appliances.map(app =>
      app.id === applianceId ? { ...app, status: newStatus } : app
    );
    setAppliances(updatedAppliances);

    try {
      const { error } = await supabase
        .from('appliances')
        .update({ 
          status: newStatus
        })
        .eq('id', applianceId)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        console.error('Error updating appliance:', error);
        Alert.alert('Error', 'Failed to update device status. Please try again.');
        // Rollback to original state
        setAppliances(originalAppliances);
        return;
      }

      console.log(`Device ${applianceId} toggled to ${newStatus}`);
    } catch (error) {
      console.error('Error in toggleAppliance:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      // Rollback to original state
      setAppliances(originalAppliances);
    }
  }, [appliances, supabase, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppliances();
    setRefreshing(false);
  }, [fetchAppliances]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAppliances();
      setLoading(false);
    };

    if (user?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.id, fetchAppliances]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !loading) {
        fetchAppliances();
      }
    }, [user?.id, loading, fetchAppliances])
  );

  // Calculate real-time stats from database data
  const stats = {
    totalUsage: appliances
      .filter(a => a.status === 'on')
      .reduce((sum, a) => sum + (parseFloat(a.normal_usage) || 0), 0),
    activeDevices: appliances.filter(a => a.status === 'on').length,
    totalDevices: appliances.length,
    monthlyCost: Math.round(
      (appliances
        .filter(a => a.status === 'on')
        .reduce((sum, a) => sum + (parseFloat(a.normal_usage) || 0), 0) / 1000) *
        24 *
        30 *
        2.5 // R2.50 per kWh (average South African rate)
    ),
  };

  const filteredAppliances = selectedRoom === 'All'
    ? appliances
    : appliances.filter(a => a.room === selectedRoom);

  // Get unique rooms and filter out null/undefined
  const rooms = ['All', ...new Set(appliances.map(a => a.room).filter(room => room))];

  const getDisplayName = useCallback(() => {
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    if (userProfile?.username) {
      return userProfile.username;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  }, [userProfile, user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const showModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('');
    setModalData({});
  };

  const handleGoalSelection = (percentage) => {
    const targetCost = Math.round(stats.monthlyCost * (1 - percentage));
    const savingsAmount = stats.monthlyCost - targetCost;
    closeModal();
    
    setTimeout(() => {
      showModal('goalSet', {
        target: targetCost,
        current: stats.monthlyCost,
        savings: savingsAmount,
        percentage: percentage * 100
      });
    }, 300);
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'noData':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <MaterialIcons name="bar-chart" size={40} color="#8b5cf6" />
            </View>
            <Text style={styles.modalTitle}>No Data Available</Text>
            <Text style={styles.modalDescription}>
              Add some devices first to view reports and analytics.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                closeModal();
                navigation.navigate('Control');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalPrimaryButtonText}>Add Device</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSecondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        );

      case 'schedules':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <MaterialIcons name="schedule" size={40} color="#8b5cf6" />
            </View>
            <Text style={styles.modalTitle}>Schedules</Text>
            <Text style={styles.modalDescription}>
              Set up automatic schedules for your devices to optimize energy usage during off-peak hours.
            </Text>
            <View style={styles.modalFeatureList}>
              <View style={styles.modalFeatureItem}>
                <Text style={styles.modalFeatureBullet}>•</Text>
                <Text style={styles.modalFeatureText}>Auto turn off devices at night</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <Text style={styles.modalFeatureBullet}>•</Text>
                <Text style={styles.modalFeatureText}>Peak hour optimization</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <Text style={styles.modalFeatureBullet}>•</Text>
                <Text style={styles.modalFeatureText}>Custom time ranges</Text>
              </View>
            </View>
            <View style={styles.modalComingSoonBadge}>
              <Text style={styles.modalComingSoonText}>Coming Soon</Text>
            </View>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSecondaryButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        );

      case 'goals':
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <MaterialIcons name="flag" size={40} color="#8b5cf6" />
            </View>
            <Text style={styles.modalTitle}>Energy Goals</Text>
            <Text style={styles.modalDescription}>
              Set monthly energy consumption and cost savings goals to track your progress.
            </Text>
            <View style={styles.modalCurrentStats}>
              <Text style={styles.modalCurrentLabel}>Current Monthly Cost</Text>
              <Text style={styles.modalCurrentValue}>R{stats.monthlyCost}</Text>
            </View>
            <Text style={styles.modalSubtitle}>What would you like to achieve?</Text>
            <TouchableOpacity
              style={styles.modalGoalOption}
              onPress={() => handleGoalSelection(0.1)}
              activeOpacity={0.7}
            >
              <View style={styles.modalGoalOptionContent}>
                <Text style={styles.modalGoalOptionTitle}>Reduce by 10%</Text>
                <Text style={styles.modalGoalOptionTarget}>
                  Target: R{Math.round(stats.monthlyCost * 0.9)}/month
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="#a1a1aa" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalGoalOption}
              onPress={() => handleGoalSelection(0.2)}
              activeOpacity={0.7}
            >
              <View style={styles.modalGoalOptionContent}>
                <Text style={styles.modalGoalOptionTitle}>Reduce by 20%</Text>
                <Text style={styles.modalGoalOptionTarget}>
                  Target: R{Math.round(stats.monthlyCost * 0.8)}/month
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="#a1a1aa" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case 'goalSet':
        return (
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <MaterialIcons name="celebration" size={40} color="#10b981" />
            </View>
            <Text style={styles.modalTitle}>Goal Set!</Text>
            <View style={styles.modalGoalSetStats}>
              <View style={styles.modalGoalSetItem}>
                <Text style={styles.modalGoalSetLabel}>Target</Text>
                <Text style={styles.modalGoalSetValue}>R{modalData.target}</Text>
                <Text style={styles.modalGoalSetSub}>per month</Text>
              </View>
              <View style={styles.modalGoalSetDivider} />
              <View style={styles.modalGoalSetItem}>
                <Text style={styles.modalGoalSetLabel}>Savings</Text>
                <Text style={[styles.modalGoalSetValue, { color: '#10b981' }]}>
                  R{modalData.savings}
                </Text>
                <Text style={styles.modalGoalSetSub}>({modalData.percentage}% less)</Text>
              </View>
            </View>
            <Text style={styles.modalDescription}>
              Great goal! Start saving by turning off unused devices. We'll help you track your progress.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Text style={styles.modalPrimaryButtonText}>Let's Go!</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // Show loading state on initial load
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading your devices...</Text>
      </View>
    );
  }

  // Show auth required state
  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
        <MaterialIcons name="lock" size={64} color="#6b7280" />
        <Text style={styles.emptyTitle}>Authentication Required</Text>
        <Text style={styles.emptySubtitle}>Please sign in to view your devices</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10b981']}
            progressBackgroundColor="#18181b"
            tintColor="#10b981"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.container}
        directionalLockEnabled={true}
        scrollEventThrottle={16}
        nestedScrollEnabled={false}
        bounces={true}
        alwaysBounceHorizontal={false}
      >
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{getDisplayName()}</Text>
            </View>
          </View>

          {/* Main Usage Card */}
          <View style={styles.mainUsageCard}>
            <TouchableOpacity 
              onPress={handlePowerIconPress}
              activeOpacity={0.8}
              style={styles.powerIconTouchable}
            >
              <View style={styles.usageIconWrapper}>
                {/* Glow effect - separate from transform animations */}
                <Animated.View 
                  style={[
                    styles.powerIconGlow,
                    {
                      opacity: glowOpacity, // Uses JS driver
                    }
                  ]} 
                />
                
                {/* Main icon with transform animations (native driver) */}
                <Animated.View 
                  style={[
                    styles.usageIconContainer,
                    {
                      transform: [
                        { rotate: spin },
                        { rotateY: spinYRotation },
                        { scale: pulseValue },
                        { scale: bounceValue },
                        { translateY: floatTranslate }
                      ]
                    }
                  ]}
                >
                  <MaterialIcons name="flash-on" size={32} color="#10b981" />
                </Animated.View>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.currentUsageLabel}>Current Power Usage</Text>
            <Text style={styles.currentUsageValue}>
              {stats.totalUsage.toFixed(0)}
            </Text>
            <Text style={styles.currentUsageUnit}>Watts</Text>
            <View style={styles.usageDivider} />
            <View style={styles.usageFooter}>
              <View style={styles.usageFooterItem}>
                <Text style={styles.usageFooterValue}>
                  {stats.activeDevices}/{stats.totalDevices}
                </Text>
                <Text style={styles.usageFooterLabel}>Active</Text>
              </View>
              <View style={styles.usageFooterDivider} />
              <View style={styles.usageFooterItem}>
                <Text style={styles.usageFooterValue}>R{stats.monthlyCost}</Text>
                <Text style={styles.usageFooterLabel}>Est. Monthly</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Control')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="add" size={24} color="#10b981" />
            </View>
            <Text style={styles.actionText}>Add Device</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (appliances.length === 0) {
                showModal('noData');
                return;
              }
              // Navigate to Analysis tab
              navigation.navigate('Analysis');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="bar-chart" size={24} color="#10b981" />
            </View>
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showModal('schedules')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="schedule" size={24} color="#10b981" />
            </View>
            <Text style={styles.actionText}>Schedules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showModal('goals')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="flag" size={24} color="#10b981" />
            </View>
            <Text style={styles.actionText}>Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Room Filter - Only show if there are appliances */}
        {appliances.length > 0 && rooms.length > 1 && (
          <View style={styles.roomFilterSection}>
            <Text style={styles.sectionTitle}>Rooms</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.roomFilter}
              contentContainerStyle={styles.roomFilterContent}
            >
              {rooms.map(room => (
                <TouchableOpacity
                  key={room}
                  style={[
                    styles.roomChip,
                    selectedRoom === room && styles.roomChipActive,
                  ]}
                  onPress={() => setSelectedRoom(room)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.roomChipText,
                      selectedRoom === room && styles.roomChipTextActive,
                    ]}
                  >
                    {room}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Devices Grid */}
        <View style={styles.devicesSection}>
          <View style={styles.devicesSectionHeader}>
            <Text style={styles.sectionTitle}>Your Devices</Text>
            {appliances.length > 0 && (
              <Text style={styles.deviceCount}>
                {filteredAppliances.length} {filteredAppliances.length === 1 ? 'device' : 'devices'}
              </Text>
            )}
          </View>

          {filteredAppliances.length > 0 ? (
            <View style={styles.devicesGrid}>
              {filteredAppliances.map(device => (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceGridCard,
                    device.status === 'on' && styles.deviceGridCardActive,
                  ]}
                  onPress={() => toggleAppliance(device.id, device.status)}
                  activeOpacity={0.7}
                >
                  <View style={styles.deviceCardHeader}>
                    <View style={[
                      styles.deviceIconCircle,
                      device.status === 'on' && styles.deviceIconCircleActive,
                    ]}>
                      <MaterialIcons 
                        name={getApplianceIcon(device.type)} 
                        size={24} 
                        color={device.status === 'on' ? '#10b981' : '#a1a1aa'} 
                      />
                    </View>
                    <View style={[
                      styles.statusIndicator,
                      device.status === 'on' && styles.statusIndicatorActive,
                    ]} />
                  </View>
                  <Text style={styles.deviceGridName} numberOfLines={1}>
                    {device.name || 'Unnamed Device'}
                  </Text>
                  <Text style={styles.deviceGridRoom}>{device.room || 'No Room'}</Text>
                  <View style={styles.deviceGridFooter}>
                    <Text style={[
                      styles.deviceGridUsage,
                      device.status === 'on' && styles.deviceGridUsageActive,
                    ]}>
                      {parseFloat(device.normal_usage) || 0}W
                    </Text>
                    <Text style={[
                      styles.deviceGridStatus,
                      device.status === 'on' && styles.deviceGridStatusActive,
                    ]}>
                      {device.status === 'on' ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="power" size={40} color="#10b981" />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedRoom === 'All'
                  ? 'No devices yet'
                  : `No devices in ${selectedRoom}`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedRoom === 'All'
                  ? 'Start monitoring your energy by adding your first device'
                  : `Add devices to your ${selectedRoom} to get started`}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => navigation.navigate('Control')}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyActionText}>Add Your First Device</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Energy Saving Tip - Only show when there are active devices */}
        {stats.activeDevices > 0 && stats.monthlyCost > 0 && (
          <View style={styles.tipSection}>
            <View style={styles.tipHeader}>
              <MaterialIcons name="lightbulb-outline" size={24} color="#10b981" />
              <Text style={styles.tipTitle}>Energy Saving Tip</Text>
            </View>
            <Text style={styles.tipContent}>
              You could save up to R{Math.round(stats.monthlyCost * 0.2)} per month by turning off devices when not in use. Even standby mode consumes energy!
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Custom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color="#a1a1aa" />
            </TouchableOpacity>
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#a1a1aa',
  },
  heroHeader: {
    padding: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  mainUsageCard: {
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  powerIconTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  usageIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  powerIconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    zIndex: 1,
  },
  currentUsageLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentUsageValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 4,
  },
  currentUsageUnit: {
    fontSize: 16,
    color: '#71717a',
    marginBottom: 24,
  },
  usageDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#27272a',
    marginBottom: 20,
  },
  usageFooter: {
    flexDirection: 'row',
    width: '100%',
  },
  usageFooterItem: {
    flex: 1,
    alignItems: 'center',
  },
  usageFooterDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#27272a',
  },
  usageFooterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  usageFooterLabel: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  roomFilterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  roomFilter: {
    paddingHorizontal: 24,
  },
  roomFilterContent: {
    paddingRight: 24,
  },
  roomChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  roomChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  roomChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  roomChipTextActive: {
    color: '#ffffff',
  },
  devicesSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  devicesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceCount: {
    fontSize: 14,
    color: '#71717a',
    fontWeight: '600',
  },
  devicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deviceGridCard: {
    width: (width - 60) / 2,
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  deviceGridCardActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceIconCircleActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3f3f46',
  },
  statusIndicatorActive: {
    backgroundColor: '#10b981',
  },
  deviceGridName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  deviceGridRoom: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 12,
  },
  deviceGridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceGridUsage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  deviceGridUsageActive: {
    color: '#10b981',
  },
  deviceGridStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52525b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceGridStatusActive: {
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#18181b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptyActionButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  tipSection: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginLeft: 12,
  },
  tipContent: {
    fontSize: 14,
    color: '#86efac',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalPrimaryButton: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSecondaryButton: {
    width: '100%',
    backgroundColor: '#27272a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: '600',
  },
  modalFeatureList: {
    width: '100%',
    marginBottom: 20,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  modalFeatureBullet: {
    color: '#10b981',
    fontSize: 20,
    marginRight: 12,
    fontWeight: '700',
  },
  modalFeatureText: {
    color: '#d4d4d8',
    fontSize: 15,
    flex: 1,
  },
  modalComingSoonBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  modalComingSoonText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalCurrentStats: {
    width: '100%',
    backgroundColor: '#27272a',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  modalCurrentLabel: {
    fontSize: 13,
    color: '#a1a1aa',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalCurrentValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10b981',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  modalGoalOption: {
    width: '100%',
    backgroundColor: '#27272a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  modalGoalOptionContent: {
    flex: 1,
  },
  modalGoalOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalGoalOptionTarget: {
    fontSize: 13,
    color: '#10b981',
  },
  modalGoalSetStats: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  modalGoalSetItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalGoalSetDivider: {
    width: 1,
    backgroundColor: '#3f3f46',
    marginHorizontal: 16,
  },
  modalGoalSetLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalGoalSetValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalGoalSetSub: {
    fontSize: 11,
    color: '#71717a',
  },
});

export default HomeTab;