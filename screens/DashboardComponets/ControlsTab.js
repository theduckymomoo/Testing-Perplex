// ControlsTab.js - Updated version with ML Service fix and centered power usage
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Vibration,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { styles } from './styles/ControlStyles';
import mlService from '../MLEngine/MLService';

const { width } = Dimensions.get('window');

const FAVORITES_STORAGE_KEY = '@device_favorites';

export default function ControlsTab() {
  const { user, supabase } = useAuth();
  const [appliances, setAppliances] = useState([]);
  const [filteredAppliances, setFilteredAppliances] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState(null);
  const [newAppliance, setNewAppliance] = useState({
    name: '',
    type: '',
    room: '',
    normal_usage: '',
    average_hours_per_day: '8',
  });
  const [stats, setStats] = useState({
    totalUsage: 0,
    monthlyCost: 0,
    activeDevices: 0,
    efficiency: 'Good',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [energySavingMode, setEnergySavingMode] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [togglingDevices, setTogglingDevices] = useState(new Set());
  
  // ML Features
  const [mlRecommendations, setMLRecommendations] = useState([]);
  const [showMLInsights, setShowMLInsights] = useState(false);

  // Get unique rooms from appliances
  const rooms = [...new Set(appliances.map(app => app.room))].sort();

  // Load favorites and initialize ML service - FIXED
  useEffect(() => {
    loadFavorites();
    if (user?.id) {
      initializeMLService();
    }
  }, [user?.id]);

  // Initialize ML Service on mount - FIXED VERSION
  const initializeMLService = async () => {
    if (!user?.id) {
      console.log('⚠️ No user available for ML initialization');
      return;
    }

    try {
      // First set the current user for the ML service
      await mlService.setCurrentUser(user.id);
      console.log('✅ ML Service user set:', user.id);
      
      // Then initialize the service
      const result = await mlService.initialize();
      if (result.success) {
        console.log('✅ ML Service initialized in ControlsTab');
      } else {
        console.log('⚠️ ML Service initialization failed:', result.error);
      }
    } catch (error) {
      console.error('ML initialization error:', error);
    }
  };

  // Update ML when appliances change - FIXED
  useEffect(() => {
    if (appliances.length > 0 && user?.id) {
      mlService.updateAppliances(appliances);
      updateMLRecommendations();
    }
  }, [appliances, user?.id]);

  const updateMLRecommendations = async () => {
    if (!user?.id) return;
    
    try {
      const recs = mlService.getRecommendations(appliances);
      setMLRecommendations(recs.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('Error getting ML recommendations:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Enhanced filter and sort appliances
  useEffect(() => {
    let result = [...appliances];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(appliance => 
        appliance.name.toLowerCase().includes(query) ||
        appliance.room.toLowerCase().includes(query) ||
        appliance.type.toLowerCase().includes(query)
      );
    }
    
    if (filterRoom !== 'all') {
      result = result.filter(appliance => appliance.room === filterRoom);
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(appliance => appliance.status === filterStatus);
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.normal_usage - a.normal_usage;
        case 'room':
          return a.room.localeCompare(b.room);
        case 'status':
          return (b.status === 'on' ? 1 : 0) - (a.status === 'on' ? 1 : 0);
        case 'favorites':
          return (favorites.includes(b.id) ? 1 : 0) - (favorites.includes(a.id) ? 1 : 0);
        default:
          return 0;
      }
    });
    
    setFilteredAppliances(result);
  }, [appliances, searchQuery, sortBy, filterRoom, filterStatus, favorites]);

  const getApplianceIcon = (type) => {
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
  };

  const getEnergyInsight = (appliance) => {
    const power = appliance.normal_usage;
    
    if (power > 500) {
      return { 
        level: 'High',
        color: '#ef4444',
        suggestion: `Save ~R${Math.round(power * 0.18)}/month by using less`
      };
    }
    if (power > 200) {
      return { 
        level: 'Medium', 
        color: '#f59e0b',
        suggestion: 'Consider turning off when not in use'
      };
    }
    return { 
      level: 'Low', 
      color: '#10b981',
      suggestion: 'Efficient usage'
    };
  };

  // Simple toggle with ML tracking - FIXED VERSION
  const toggleAppliance = async (applianceId, currentStatus) => {
    const newStatus = currentStatus === 'on' ? 'off' : 'on';
    
    setTogglingDevices(prev => new Set(prev).add(applianceId));
    Vibration.vibrate(50);
    
    try {
      // Record user action for ML learning - only if user is set
      if (user?.id) {
        await mlService.recordUserAction(
          applianceId, 
          newStatus === 'on' ? 'toggle_on' : 'toggle_off',
          {
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            manual: true,
          }
        );
      }

      // Update Supabase
      const { error } = await supabase
        .from('appliances')
        .update({ status: newStatus })
        .eq('id', applianceId);

      if (error) throw error;

      // Update local state
      const updatedAppliances = appliances.map(app =>
        app.id === applianceId ? { ...app, status: newStatus } : app
      );
      setAppliances(updatedAppliances);
      calculateStats(updatedAppliances);
      
      // Update ML recommendations after toggle - only if user is set
      if (user?.id) {
        await updateMLRecommendations();
      }
      
      Vibration.vibrate(100);
        
    } catch (error) {
      console.error('Error toggling appliance:', error);
      Vibration.vibrate(200);
      
      Alert.alert(
        'Connection Error',
        'Failed to update device status. Please check your connection.',
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Retry', 
            onPress: () => toggleAppliance(applianceId, currentStatus) 
          }
        ]
      );
    } finally {
      setTogglingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(applianceId);
        return newSet;
      });
    }
  };

  // Energy saving mode
  const toggleEnergySavingMode = async () => {
    const newMode = !energySavingMode;
    setEnergySavingMode(newMode);
    
    if (newMode) {
      const highUsageAppliances = appliances.filter(app => 
        app.normal_usage > 200 && app.status === 'on'
      );
      
      if (highUsageAppliances.length > 0) {
        const totalSavings = highUsageAppliances.reduce((sum, app) => 
          sum + Math.round(app.normal_usage * 0.18), 0
        );
        
        Alert.alert(
          'Energy Saving Mode',
          `Turn off ${highUsageAppliances.length} high-usage devices to save approximately R${totalSavings}/month?`,
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Turn Off & Save',
              onPress: async () => {
                try {
                  // Update Supabase
                  const { error } = await supabase
                    .from('appliances')
                    .update({ status: 'off' })
                    .in('id', highUsageAppliances.map(app => app.id));

                  if (error) throw error;

                  // Update local state
                  const updatedAppliances = appliances.map(app => {
                    const highUsageApp = highUsageAppliances.find(h => h.id === app.id);
                    return highUsageApp ? { ...app, status: 'off' } : app;
                  });
                  
                  setAppliances(updatedAppliances);
                  calculateStats(updatedAppliances);
                  Vibration.vibrate(100);
                } catch (error) {
                  console.error('Error in energy saving mode:', error);
                  Alert.alert('Error', 'Failed to update some devices');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Energy Efficient!', 'All your high-usage devices are already off. Great job!');
      }
    }
  };

  const toggleFavorite = (applianceId, event) => {
    event?.stopPropagation();
    const newFavorites = favorites.includes(applianceId)
      ? favorites.filter(id => id !== applianceId)
      : [...favorites, applianceId];
    
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    Vibration.vibrate(50);
  };

  // Room controls
  const toggleRoomDevices = async (room, status) => {
    const roomDevices = appliances.filter(app => app.room === room);
    const deviceIds = roomDevices.map(app => app.id);
    
    if (deviceIds.length === 0) return;

    try {
      // Update Supabase
      const { error } = await supabase
        .from('appliances')
        .update({ status })
        .in('id', deviceIds);

      if (error) throw error;

      // Update local state
      const updatedAppliances = appliances.map(app => 
        deviceIds.includes(app.id) ? { ...app, status } : app
      );
      
      setAppliances(updatedAppliances);
      calculateStats(updatedAppliances);
      Vibration.vibrate(100);
    } catch (error) {
      console.error('Error toggling room devices:', error);
      Alert.alert('Error', 'Failed to update some room devices');
    }
  };

  // Stats calculation
  const calculateStats = (applianceList) => {
    const activeAppliances = applianceList.filter(app => app.status === 'on');
    
    const totalUsage = activeAppliances.reduce((sum, app) => 
      sum + app.normal_usage, 0
    );

    // Calculate realistic monthly cost
    let monthlyCost = 0;
    activeAppliances.forEach(app => {
      const kWh = app.normal_usage / 1000;
      const hoursPerDay = app.average_hours_per_day || 8;
      const daysPerMonth = 30;
      const monthlyKwh = kWh * hoursPerDay * daysPerMonth;
      monthlyCost += monthlyKwh * 2.50;
    });

    let efficiency = 'Excellent';
    const highUsageActive = activeAppliances.filter(app => 
      app.normal_usage > 300
    ).length;
    
    if (highUsageActive > 2) efficiency = 'Poor';
    else if (highUsageActive > 1) efficiency = 'Fair';
    else if (totalUsage > 1000) efficiency = 'Good';

    setStats({
      totalUsage: Math.round(totalUsage),
      monthlyCost: Math.round(monthlyCost),
      activeDevices: activeAppliances.length,
      efficiency,
    });
  };

  // Fetch appliances
  const fetchAppliances = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAppliances(data || []);
      calculateStats(data || []);
      
    } catch (error) {
      console.error('Error in fetchAppliances:', error);
      Alert.alert(
        'Connection Error',
        'Failed to load devices',
        [
          { text: 'OK', style: 'default' },
          { text: 'Retry', onPress: fetchAppliances }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, supabase]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppliances();
  }, [fetchAppliances]);

  useEffect(() => {
    if (user?.id) {
      fetchAppliances();
    }
  }, [user?.id, fetchAppliances]);

  // Add appliance
  const addAppliance = async () => {
    if (!newAppliance.name || !newAppliance.type || !newAppliance.room || !newAppliance.normal_usage) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const usage = parseInt(newAppliance.normal_usage);
    if (isNaN(usage) || usage <= 0) {
      Alert.alert('Error', 'Power usage must be a positive number');
      return;
    }

    const hoursPerDay = parseInt(newAppliance.average_hours_per_day) || 8;

    try {
      const { data, error } = await supabase
        .from('appliances')
        .insert([{
          user_id: user.id,
          name: newAppliance.name,
          type: newAppliance.type,
          room: newAppliance.room,
          normal_usage: usage,
          average_hours_per_day: hoursPerDay,
          status: 'off',
        }])
        .select();

      if (error) throw error;

      const newDevice = data[0];
      setAppliances([...appliances, newDevice]);
      calculateStats([...appliances, newDevice]);
      setNewAppliance({ name: '', type: '', room: '', normal_usage: '', average_hours_per_day: '8' });
      setShowAddModal(false);
      Vibration.vibrate(100);
      
    } catch (error) {
      console.error('Error in addAppliance:', error);
      Alert.alert('Error', 'Failed to add device');
    }
  };

  const editAppliance = async () => {
    if (!editingAppliance) return;

    if (!editingAppliance.name?.trim() || !editingAppliance.type || !editingAppliance.room?.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const usage = parseInt(editingAppliance.normal_usage);
    if (isNaN(usage) || usage <= 0) {
      Alert.alert('Error', 'Power usage must be a positive number');
      return;
    }

    const hoursPerDay = parseInt(editingAppliance.average_hours_per_day) || 8;

    try {
      const { error } = await supabase
        .from('appliances')
        .update({
          name: editingAppliance.name.trim(),
          type: editingAppliance.type,
          room: editingAppliance.room.trim(),
          normal_usage: usage,
          average_hours_per_day: hoursPerDay,
        })
        .eq('id', editingAppliance.id);

      if (error) throw error;

      const updatedAppliances = appliances.map(app =>
        app.id === editingAppliance.id ? { ...editingAppliance, normal_usage: usage, average_hours_per_day: hoursPerDay } : app
      );
      setAppliances(updatedAppliances);
      calculateStats(updatedAppliances);
      setShowEditModal(false);
      setEditingAppliance(null);
      Vibration.vibrate(100);
    } catch (error) {
      console.error('Error in editAppliance:', error);
      Alert.alert('Error', 'Failed to update device');
    }
  };

  const deleteAppliance = async (applianceId) => {
    Alert.alert(
      'Delete Device',
      'Are you sure you want to delete this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appliances')
                .delete()
                .eq('id', applianceId);

              if (error) throw error;

              const updatedAppliances = appliances.filter(app => app.id !== applianceId);
              setAppliances(updatedAppliances);
              calculateStats(updatedAppliances);
              
              // Remove from favorites if present
              if (favorites.includes(applianceId)) {
                const newFavorites = favorites.filter(id => id !== applianceId);
                setFavorites(newFavorites);
                saveFavorites(newFavorites);
              }
              
              Vibration.vibrate(100);
            } catch (error) {
              console.error('Error in deleteAppliance:', error);
              Alert.alert('Error', 'Failed to delete device');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (appliance) => {
    setEditingAppliance({ ...appliance });
    setShowEditModal(true);
  };

  // ML Insights Banner
  const renderMLInsightsBanner = () => {
    if (mlRecommendations.length === 0) return null;

    const topRec = mlRecommendations[0];

    return (
      <TouchableOpacity 
        style={styles.mlBanner}
        onPress={() => setShowMLInsights(!showMLInsights)}
        activeOpacity={0.8}
      >
        <View style={styles.mlBannerHeader}>
          <View style={styles.mlBannerLeft}>
            <MaterialIcons name="psychology" size={24} color="#8b5cf6" />
            <View>
              <Text style={styles.mlBannerTitle}>AI Insight</Text>
              <Text style={styles.mlBannerSubtitle}>
                {mlRecommendations.length} recommendation{mlRecommendations.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <MaterialIcons 
            name={showMLInsights ? "expand-less" : "expand-more"} 
            size={24} 
            color="#a1a1aa" 
          />
        </View>

        {!showMLInsights && (
          <Text style={styles.mlBannerPreview} numberOfLines={2}>
            {topRec.suggestion}
          </Text>
        )}

        {showMLInsights && (
          <View style={styles.mlInsightsExpanded}>
            {mlRecommendations.map((rec, index) => (
              <View key={index} style={styles.mlInsightCard}>
                <View style={styles.mlInsightHeader}>
                  <View style={[
                    styles.mlPriorityDot,
                    { backgroundColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981' }
                  ]} />
                  <Text style={styles.mlInsightType}>
                    {rec.type.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.mlInsightText}>{rec.suggestion}</Text>
                {rec.potentialSavings && (
                  <Text style={styles.mlInsightSavings}>
                    💰 Save R{rec.potentialSavings}/month
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Smart automation suggestions - FIXED VERSION
  const renderSmartAutomation = (deviceId) => {
    if (!user?.id) return null;
    
    try {
      const schedule = mlService.getSmartSchedule(deviceId, 1);
      
      if (!schedule.success || schedule.recommendedSlots.length === 0) return null;

      return (
        <View style={styles.smartAutomationCard}>
          <View style={styles.smartAutomationHeader}>
            <MaterialIcons name="schedule" size={16} color="#8b5cf6" />
            <Text style={styles.smartAutomationTitle}>Smart Schedule</Text>
          </View>
          <Text style={styles.smartAutomationText}>
            Best time: {schedule.recommendedSlots[0].timeLabel} ({schedule.recommendedSlots[0].savingsPercent}% savings)
          </Text>
        </View>
      );
    } catch (error) {
      console.error('Error getting smart schedule:', error);
      return null;
    }
  };

  // Device card rendering - FIXED ML prediction section
  const renderDeviceCard = ({ item, index }) => {
    if (!item || !item.id || !item.name) {
      return (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Invalid device data</Text>
        </View>
      );
    }

    try {
      const energyInsight = getEnergyInsight(item);
      const isToggling = togglingDevices.has(item.id);
      const isFavorite = favorites.includes(item.id);
      const currentPower = item.normal_usage || 0;

      // Get ML prediction for this device - FIXED VERSION
      let hasPrediction = false;
      let prediction = { success: false };
      
      if (user?.id) {
        try {
          const allPredictions = mlService.getPredictions([item], 1);
          prediction = allPredictions.success ? 
            allPredictions.predictions.find(p => p.deviceId === item.id) : 
            { success: false };
          hasPrediction = prediction.success && prediction.confidence > 0.6;
        } catch (error) {
          console.error('Error getting ML predictions:', error);
          hasPrediction = false;
        }
      }

      if (viewMode === 'list') {
        return (
          <TouchableOpacity 
            style={styles.deviceListItem}
            onPress={() => toggleAppliance(item.id, item.status)}
            activeOpacity={0.7}
            disabled={isToggling}
          >
            <View style={styles.deviceListContent}>
              <View style={styles.deviceListLeft}>
                <View style={styles.deviceListIcon}>
                  <MaterialIcons 
                    name={getApplianceIcon(item.type)} 
                    size={32} 
                    color={item.status === 'on' ? '#10b981' : '#a1a1aa'} 
                  />
                </View>
                <View style={styles.deviceListInfo}>
                  <Text style={styles.deviceListName}>{item.name}</Text>
                  <Text style={styles.deviceListRoom}>{item.room}</Text>
                  <Text style={styles.deviceListUsage}>{currentPower}W • {item.status}</Text>
                  
                  {/* Energy insight inline with usage info */}
                  <View style={styles.deviceListEnergyContainer}>
                    <View style={[styles.deviceListEnergyBadge, { backgroundColor: energyInsight.color }]}>
                      <Text style={styles.deviceListEnergyText}>{energyInsight.level}</Text>
                    </View>
                  </View>
                  
                  {/* ML Prediction Badge */}
                  {hasPrediction && item.status === 'off' && prediction.prediction.willBeActive && (
                    <View style={styles.mlPredictionBadge}>
                      <MaterialIcons name="lightbulb" size={10} color="#8b5cf6" />
                      <Text style={styles.mlPredictionText}>
                        AI: Turn on soon ({prediction.prediction.probability}%)
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.deviceListRight}>
                <TouchableOpacity 
                  onPress={(e) => toggleFavorite(item.id, e)}
                  style={styles.favoriteButton}
                >
                  <MaterialIcons 
                    name={isFavorite ? "star" : "star-border"} 
                    size={20} 
                    color={isFavorite ? "#f59e0b" : "#a1a1aa"} 
                  />
                </TouchableOpacity>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <View style={[
                    styles.statusIndicator,
                    item.status === 'on' ? styles.statusOn : styles.statusOff
                  ]}>
                    <Text style={styles.statusText}>
                      {item.status === 'on' ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  onPress={() => openEditModal(item)}
                  style={styles.menuButton}
                >
                  <MaterialIcons name="more-vert" size={20} color="#a1a1aa" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Smart Automation */}
            {renderSmartAutomation(item.id)}
          </TouchableOpacity>
        );
      }

      // Grid View - UPDATED VERSION with centered power usage
      return (
        <TouchableOpacity 
          style={styles.deviceCard}
          onPress={() => toggleAppliance(item.id, item.status)}
          activeOpacity={0.7}
          disabled={isToggling}
        >
          <View style={styles.deviceHeader}>
            <View style={styles.deviceCardIcon}>
              <MaterialIcons 
                name={getApplianceIcon(item.type)} 
                size={28} 
                color={item.status === 'on' ? '#10b981' : '#a1a1aa'} 
              />
            </View>
            
            <TouchableOpacity 
              onPress={(e) => toggleFavorite(item.id, e)}
              style={styles.favoriteButton}
            >
              <MaterialIcons 
                name={isFavorite ? "star" : "star-border"} 
                size={18} 
                color={isFavorite ? "#f59e0b" : "#a1a1aa"} 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.deviceCardName}>{item.name}</Text>
          <Text style={styles.deviceCardRoom}>{item.room}</Text>
          
          {/* Centered Power Usage */}
          <View style={styles.deviceCardCenterSection}>
            <Text style={styles.deviceCardUsageCentered}>{currentPower}W</Text>
            
            {/* Energy insight badge centered below power usage */}
            <View style={styles.deviceCardEnergyContainer}>
              <View style={[styles.deviceCardEnergyBadge, { backgroundColor: energyInsight.color }]}>
                <Text style={styles.deviceCardEnergyText}>{energyInsight.level}</Text>
              </View>
            </View>
          </View>
          
          {/* ML Prediction for grid view */}
          {hasPrediction && (
            <View style={styles.mlPredictionChip}>
              <MaterialIcons name="psychology" size={10} color="#8b5cf6" />
              <Text style={styles.mlPredictionChipText}>
                {prediction.prediction.probability}%
              </Text>
            </View>
          )}
          
          <View style={styles.deviceCardFooter}>
            {isToggling ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <View style={[
                styles.statusIndicator,
                item.status === 'on' ? styles.statusOn : styles.statusOff
              ]}>
                <Text style={styles.statusText}>
                  {item.status === 'on' ? 'ON' : 'OFF'}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => openEditModal(item)}
            style={styles.cardMenuButton}
          >
            <MaterialIcons name="more-vert" size={18} color="#a1a1aa" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('Error rendering device card:', error);
      return (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Error loading device</Text>
        </View>
      );
    }
  };

  // Filter Modal
  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent>
      <View style={styles.overlayModal}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <MaterialIcons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Room</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterChip, filterRoom === 'all' && styles.filterChipActive]}
                  onPress={() => setFilterRoom('all')}
                >
                  <Text style={[styles.filterChipText, filterRoom === 'all' && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {rooms.map(room => (
                  <TouchableOpacity
                    key={room}
                    style={[styles.filterChip, filterRoom === room && styles.filterChipActive]}
                    onPress={() => setFilterRoom(room)}
                  >
                    <Text style={[styles.filterChipText, filterRoom === room && styles.filterChipTextActive]}>{room}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterRow}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'on', label: 'Active' },
                  { key: 'off', label: 'Inactive' }
                ].map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filterChip, filterStatus === item.key && styles.filterChipActive]}
                    onPress={() => setFilterStatus(item.key)}
                  >
                    <Text style={[styles.filterChipText, filterStatus === item.key && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterRow}>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'usage', label: 'Usage' },
                  { key: 'room', label: 'Room' },
                  { key: 'status', label: 'Status' },
                  { key: 'favorites', label: 'Favorites' }
                ].map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filterChip, sortBy === item.key && styles.filterChipActive]}
                    onPress={() => setSortBy(item.key)}
                  >
                    <Text style={[styles.filterChipText, sortBy === item.key && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={styles.applyFiltersButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyFiltersText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Add Modal
  const renderAddModal = () => (
    <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Device</Text>
              <TouchableOpacity onPress={addAppliance}>
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Device Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter device name"
                    placeholderTextColor="#6b7280"
                    value={newAppliance.name}
                    onChangeText={(text) => setNewAppliance(prev => ({ ...prev, name: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Device Type *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.typeSelector}>
                      {[
                        { key: 'refrigerator', label: 'Fridge', icon: 'kitchen' },
                        { key: 'tv', label: 'TV', icon: 'tv' },
                        { key: 'washing_machine', label: 'Washer', icon: 'local-laundry-service' },
                        { key: 'air_conditioner', label: 'AC', icon: 'ac-unit' },
                        { key: 'heater', label: 'Heater', icon: 'whatshot' },
                        { key: 'light', label: 'Light', icon: 'lightbulb-outline' },
                        { key: 'microwave', label: 'Microwave', icon: 'microwave' },
                        { key: 'dishwasher', label: 'Dishwasher', icon: 'dishwasher' },
                        { key: 'computer', label: 'Computer', icon: 'computer' },
                        { key: 'fan', label: 'Fan', icon: 'toys' },
                        { key: 'router', label: 'Router', icon: 'router' },
                        { key: 'speaker', label: 'Speaker', icon: 'speaker' },
                        { key: 'camera', label: 'Camera', icon: 'videocam' },
                      ].map(type => (
                        <TouchableOpacity
                          key={type.key}
                          style={[
                            styles.typeOption,
                            newAppliance.type === type.key && styles.typeOptionActive
                          ]}
                          onPress={() => setNewAppliance(prev => ({ ...prev, type: type.key }))}
                        >
                          <MaterialIcons 
                            name={type.icon} 
                            size={28} 
                            color={newAppliance.type === type.key ? '#ffffff' : '#a1a1aa'} 
                          />
                          <Text style={[
                            styles.typeOptionText,
                            newAppliance.type === type.key && styles.typeOptionTextActive
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Room *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Living Room, Kitchen"
                    placeholderTextColor="#6b7280"
                    value={newAppliance.room}
                    onChangeText={(text) => setNewAppliance(prev => ({ ...prev, room: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Power Usage (Watts) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter wattage"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={newAppliance.normal_usage}
                    onChangeText={(text) => setNewAppliance(prev => ({ 
                      ...prev, 
                      normal_usage: text.replace(/[^0-9]/g, '') 
                    }))}
                  />
                  <Text style={styles.inputHint}>
                    Power consumption when active
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Average Daily Usage (Hours)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 8"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={newAppliance.average_hours_per_day}
                    onChangeText={(text) => setNewAppliance(prev => ({ 
                      ...prev, 
                      average_hours_per_day: text.replace(/[^0-9]/g, '') 
                    }))}
                  />
                  <Text style={styles.inputHint}>
                    How many hours per day this device typically runs (for accurate cost calculation)
                  </Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Edit Modal
  const renderEditModal = () => (
    <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Device</Text>
              <TouchableOpacity onPress={editAppliance}>
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Device Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter device name"
                    placeholderTextColor="#6b7280"
                    value={editingAppliance?.name || ''}
                    onChangeText={(text) => setEditingAppliance(prev => ({ ...prev, name: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Device Type *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.typeSelector}>
                      {[
                        { key: 'refrigerator', label: 'Fridge', icon: 'kitchen' },
                        { key: 'tv', label: 'TV', icon: 'tv' },
                        { key: 'washing_machine', label: 'Washer', icon: 'local-laundry-service' },
                        { key: 'air_conditioner', label: 'AC', icon: 'ac-unit' },
                        { key: 'heater', label: 'Heater', icon: 'whatshot' },
                        { key: 'light', label: 'Light', icon: 'lightbulb-outline' },
                        { key: 'microwave', label: 'Microwave', icon: 'microwave' },
                        { key: 'dishwasher', label: 'Dishwasher', icon: 'dishwasher' },
                        { key: 'computer', label: 'Computer', icon: 'computer' },
                        { key: 'fan', label: 'Fan', icon: 'toys' },
                        { key: 'router', label: 'Router', icon: 'router' },
                        { key: 'speaker', label: 'Speaker', icon: 'speaker' },
                        { key: 'camera', label: 'Camera', icon: 'videocam' },
                      ].map(type => (
                        <TouchableOpacity
                          key={type.key}
                          style={[
                            styles.typeOption,
                            editingAppliance?.type === type.key && styles.typeOptionActive
                          ]}
                          onPress={() => setEditingAppliance(prev => ({ ...prev, type: type.key }))}
                        >
                          <MaterialIcons 
                            name={type.icon} 
                            size={28} 
                            color={editingAppliance?.type === type.key ? '#ffffff' : '#a1a1aa'} 
                          />
                          <Text style={[
                            styles.typeOptionText,
                            editingAppliance?.type === type.key && styles.typeOptionTextActive
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Room *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Living Room, Kitchen"
                    placeholderTextColor="#6b7280"
                    value={editingAppliance?.room || ''}
                    onChangeText={(text) => setEditingAppliance(prev => ({ ...prev, room: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Power Usage (Watts) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter wattage"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={editingAppliance?.normal_usage?.toString() || ''}
                    onChangeText={(text) => setEditingAppliance(prev => ({ 
                      ...prev, 
                      normal_usage: text.replace(/[^0-9]/g, '') 
                    }))}
                  />
                  <Text style={styles.inputHint}>
                    Power consumption when active
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Average Daily Usage (Hours)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 8"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={editingAppliance?.average_hours_per_day?.toString() || '8'}
                    onChangeText={(text) => setEditingAppliance(prev => ({ 
                      ...prev, 
                      average_hours_per_day: text.replace(/[^0-9]/g, '') 
                    }))}
                  />
                  <Text style={styles.inputHint}>
                    How many hours per day this device typically runs
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteAppliance(editingAppliance?.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete Device</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Room Controls
  const renderRoomControls = () => {
    if (rooms.length === 0) return null;
    
    return (
      <View style={styles.roomControlsContainer}>
        <Text style={styles.sectionTitle}>Quick Room Controls</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {rooms.map(room => {
            const roomDevices = appliances.filter(app => app.room === room);
            const activeCount = roomDevices.filter(app => app.status === 'on').length;
            
            return (
              <View key={room} style={styles.roomCard}>
                <Text style={styles.roomName}>{room}</Text>
                <Text style={styles.roomDeviceCount}>{activeCount}/{roomDevices.length} active</Text>
                <View style={styles.roomButtons}>
                  <TouchableOpacity 
                    style={[styles.roomButton, styles.roomButtonOn]}
                    onPress={() => toggleRoomDevices(room, 'on')}
                  >
                    <MaterialIcons name="power" size={14} color="#ffffff" />
                    <Text style={styles.roomButtonText}>All On</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roomButton, styles.roomButtonOff]}
                    onPress={() => toggleRoomDevices(room, 'off')}
                  >
                    <MaterialIcons name="power-off" size={14} color="#ffffff" />
                    <Text style={styles.roomButtonText}>All Off</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (loading && appliances.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading devices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.controlsHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Device Controls</Text>
            <View style={styles.deviceStatsContainer}>
              <View style={styles.deviceStat}>
                <Text style={styles.deviceStatNumber}>{appliances.length}</Text>
                <Text style={styles.deviceStatLabel}>Devices</Text>
              </View>
              <View style={styles.deviceStatDivider} />
              <View style={styles.deviceStat}>
                <Text style={[styles.deviceStatNumber, styles.activeDeviceStat]}>{stats.activeDevices}</Text>
                <Text style={styles.deviceStatLabel}>Active</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.controlButtons}>
              <TouchableOpacity 
                style={[styles.controlButton, energySavingMode && styles.controlButtonActive]}
                onPress={toggleEnergySavingMode}
              >
                <MaterialIcons 
                  name="eco" 
                  size={14} 
                  color={energySavingMode ? '#ffffff' : '#a1a1aa'} 
                />
                <Text style={[
                  styles.controlButtonText,
                  energySavingMode && styles.controlButtonTextActive
                ]}>
                  {energySavingMode ? 'Eco On' : 'Eco'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                <MaterialIcons 
                  name={viewMode === 'grid' ? 'view-list' : 'grid-view'} 
                  size={14} 
                  color="#a1a1aa" 
                />
                <Text style={styles.controlButtonText}>
                  {viewMode === 'grid' ? 'List' : 'Grid'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <MaterialIcons name="add" size={16} color="#ffffff" />
              <Text style={styles.addButtonText}>Add Device</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="flash-on" size={20} color="#10b981" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.totalUsage}W</Text>
            <Text style={styles.statLabel}>Current Usage</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="attach-money" size={20} color="#10b981" style={styles.statIcon} />
            <Text style={styles.statValue}>R{stats.monthlyCost}</Text>
            <Text style={styles.statLabel}>Monthly Cost</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="power" size={20} color="#10b981" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.activeDevices}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={20} color="#10b981" style={styles.statIcon} />
            <Text style={[
              styles.statValue, 
              stats.efficiency === 'Excellent' ? styles.efficiencyExcellent :
              stats.efficiency === 'Good' ? styles.efficiencyGood :
              stats.efficiency === 'Fair' ? styles.efficiencyFair : styles.efficiencyPoor
            ]}>
              {stats.efficiency}
            </Text>
            <Text style={styles.statLabel}>Efficiency</Text>
          </View>
        </View>

        {/* ML Insights Banner */}
        {renderMLInsightsBanner()}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search devices..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}>
              <MaterialIcons name="tune" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearChip}
              onPress={() => setSearchQuery('')}>
              <Text style={styles.clearChipText}>Clear search</Text>
              <MaterialIcons name="close" size={14} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>

        {favorites.length > 0 && (
          <View style={styles.favoritesSection}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="star" size={18} color="#f59e0b" /> Favorites
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {appliances.filter(app => favorites.includes(app.id)).map(item => (
                <TouchableOpacity 
                  key={`fav-${item.id}`}
                  style={styles.favoriteCard}
                  onPress={() => toggleAppliance(item.id, item.status)}
                >
                  <MaterialIcons 
                    name={getApplianceIcon(item.type)} 
                    size={24} 
                    color={item.status === 'on' ? '#10b981' : '#a1a1aa'} 
                  />
                  <Text style={styles.favoriteName}>{item.name}</Text>
                  <View style={[
                    styles.favoriteStatus,
                    item.status === 'on' ? styles.favoriteStatusOn : styles.favoriteStatusOff
                  ]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {filteredAppliances.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="power" size={64} color="#6b7280" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No devices found' : 'No Devices'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different keyword or pull down to refresh.'
                : 'Add your first device to get started monitoring energy usage.'}
            </Text>

            {!searchQuery ? (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}>
                <Text style={styles.emptyButtonText}>Add First Device</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setSearchQuery('')}>
                <Text style={styles.emptyButtonText}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredAppliances}
            renderItem={renderDeviceCard}
            keyExtractor={(item) => `device-${item.id}-${viewMode}`}
            numColumns={viewMode === 'grid' ? 2 : 1}
            scrollEnabled={false}
            contentContainerStyle={viewMode === 'grid' ? styles.deviceGrid : styles.deviceList}
            key={`${viewMode}-${filteredAppliances.length}`}
          />
        )}

        {renderRoomControls()}
      </ScrollView>
      
      {renderAddModal()}
      {renderEditModal()}
      {renderFilterModal()}
    </SafeAreaView>
  );
}
