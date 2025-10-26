import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  Share,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import mlService from './MLService';

const { width } = Dimensions.get('window');

const MLDataViewer = ({ visible, onClose, userId }) => {
  const [trainingData, setTrainingData] = useState({
    deviceUsage: [],
    userActions: [],
  });
  const [summary, setSummary] = useState({
    totalSamples: 0,
    dateRange: { first: null, last: null },
    samplesPerDay: 0,
    samplesPerHour: 0,
    userId: userId,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadData = async () => {
    try {
      setLoading(true);
      const engine = mlService.getCurrentEngine();
      if (!engine) {
        console.warn('No ML engine available for data viewer');
        return;
      }

      const deviceUsage = engine.trainingData?.deviceUsage || [];
      const userActions = engine.trainingData?.userActions || [];

      setTrainingData({ deviceUsage, userActions });

      if (deviceUsage.length > 0) {
        const timestamps = deviceUsage.map(d => new Date(d.timestamp)).sort();
        const firstDate = timestamps[0];
        const lastDate = timestamps[timestamps.length - 1];
        const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
        
        setSummary({
          totalSamples: deviceUsage.length,
          dateRange: { first: firstDate, last: lastDate },
          samplesPerDay: Math.round(deviceUsage.length / daysDiff),
          samplesPerHour: Math.round(deviceUsage.length / (daysDiff * 24)),
          userId: userId,
        });
      } else {
        setSummary({
          totalSamples: 0,
          dateRange: { first: null, last: null },
          samplesPerDay: 0,
          samplesPerHour: 0,
          userId: userId,
        });
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (date) => {
    if (!date) return 'No data available';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDataHealth = () => {
    const total = summary.totalSamples;
    if (total === 0) return { status: 'empty', color: '#64748b', text: 'No Data' };
    if (total < 100) return { status: 'low', color: '#f59e0b', text: 'Insufficient' };
    if (total < 1000) return { status: 'moderate', color: '#3b82f6', text: 'Moderate' };
    return { status: 'good', color: '#10b981', text: 'Healthy' };
  };

  const renderMetricCard = (title, value, subtitle, icon, color = '#10b981') => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const renderOverview = () => {
    const dataHealth = getDataHealth();
    
    return (
      <ScrollView 
        style={styles.tabContent} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Data Health Status */}
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: dataHealth.color }]} />
              <Text style={styles.statusTitle}>System Status</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.pulsingDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: dataHealth.color }]}>
                Data Quality
              </Text>
              <Text style={styles.statusValue}>{dataHealth.text}</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>ML Engine</Text>
              <Text style={[styles.statusValue, { 
                color: mlService.isSimulating ? '#10b981' : '#f59e0b' 
              }]}>
                {mlService.isSimulating ? 'Active' : 'Idle'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>User ID</Text>
              <Text style={styles.statusValue}>{summary.userId || 'Unknown'}</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Last Updated</Text>
              <Text style={styles.statusValue}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Key Metrics */}
        <View style={styles.sectionHeader}>
          <MaterialIcons name="analytics" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Key Metrics</Text>
        </View>

        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Total Samples', 
            summary.totalSamples.toLocaleString(), 
            'Data Points Collected',
            'storage',
            '#10b981'
          )}
          
          {renderMetricCard(
            'Daily Average', 
            summary.samplesPerDay.toString(), 
            'Samples Per Day',
            'trending-up',
            '#3b82f6'
          )}
          
          {renderMetricCard(
            'User Actions', 
            trainingData.userActions.length.toString(), 
            'Recorded Interactions',
            'touch-app',
            '#8b5cf6'
          )}
          
          {renderMetricCard(
            'Collection Rate', 
            `${summary.samplesPerHour}/hr`, 
            'Hourly Frequency',
            'schedule',
            '#f59e0b'
          )}
        </View>

        {/* Data Timeline */}
        <View style={styles.sectionHeader}>
          <MaterialIcons name="timeline" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Data Timeline</Text>
        </View>

        <View style={styles.timelineCard}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#10b981' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>First Data Point</Text>
              <Text style={styles.timelineDate}>{formatDate(summary.dateRange.first)}</Text>
            </View>
          </View>
          
          <View style={styles.timelineLine} />
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#3b82f6' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Latest Data Point</Text>
              <Text style={styles.timelineDate}>{formatDate(summary.dateRange.last)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionButton} onPress={exportAsJSON}>
            <MaterialIcons name="code" size={24} color="#3b82f6" />
            <Text style={styles.quickActionText}>Export JSON</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={exportAsCSV}>
            <MaterialIcons name="table-chart" size={24} color="#10b981" />
            <Text style={styles.quickActionText}>Export CSV</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={loadData}>
            <MaterialIcons name="refresh" size={24} color="#f59e0b" />
            <Text style={styles.quickActionText}>Refresh Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, { borderColor: '#ef4444' }]} 
            onPress={clearAllData}
          >
            <MaterialIcons name="delete-forever" size={24} color="#ef4444" />
            <Text style={[styles.quickActionText, { color: '#ef4444' }]}>Clear Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderDeviceSample = ({ item, index }) => (
    <View style={styles.dataCard}>
      <View style={styles.dataCardHeader}>
        <View style={styles.dataCardTitle}>
          <MaterialIcons name="memory" size={18} color="#10b981" />
          <Text style={styles.dataCardTitleText}>Sample #{index + 1}</Text>
        </View>
        <Text style={styles.dataCardTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.dataCardContent}>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Time Context</Text>
          <Text style={styles.dataValue}>
            {item.hour}:00 • {item.isWeekend ? 'Weekend' : 'Weekday'}
          </Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Device Activity</Text>
          <Text style={styles.dataValue}>
            {item.activeDeviceCount}/{item.devices?.length || 0} active
          </Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Power Consumption</Text>
          <Text style={[styles.dataValue, { color: '#f59e0b' }]}>
            {Math.round(item.totalPower || 0)}W
          </Text>
        </View>
        
        {item.devices && item.devices.length > 0 && (
          <View style={styles.devicesSection}>
            <Text style={styles.devicesSectionTitle}>Active Devices</Text>
            <View style={styles.devicesGrid}>
              {item.devices.filter(d => d.isActive).map((device, idx) => (
                <View key={idx} style={styles.deviceChip}>
                  <MaterialIcons name="check-circle" size={12} color="#10b981" />
                  <Text style={styles.deviceChipText}>
                    {device.type} ({Math.round(device.power || 0)}W)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderUserAction = ({ item, index }) => (
    <View style={styles.dataCard}>
      <View style={styles.dataCardHeader}>
        <View style={styles.dataCardTitle}>
          <MaterialIcons name="touch-app" size={18} color="#3b82f6" />
          <Text style={styles.dataCardTitleText}>Action #{index + 1}</Text>
        </View>
        <Text style={styles.dataCardTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.dataCardContent}>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Device</Text>
          <Text style={styles.dataValue}>{item.deviceType || 'Unknown'}</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Action</Text>
          <Text style={[styles.dataValue, { 
            color: item.action === 'turn_on' ? '#10b981' : '#ef4444' 
          }]}>
            {item.action.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Context</Text>
          <Text style={styles.dataValue}>
            {item.context?.manual ? 'Manual' : 'Automated'} • Hour {item.hour}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAnalytics = () => {
    const hourCounts = Array(24).fill(0);
    trainingData.deviceUsage.forEach(sample => {
      if (sample.hour >= 0 && sample.hour < 24) {
        hourCounts[sample.hour]++;
      }
    });
    
    const maxCount = Math.max(...hourCounts, 1);
    
    return (
      <ScrollView 
        style={styles.tabContent} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <MaterialIcons name="bar-chart" size={24} color="#10b981" />
            <Text style={styles.chartTitle}>24-Hour Activity Distribution</Text>
          </View>
          <Text style={styles.chartSubtitle}>
            Data collection patterns throughout the day
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartContainer}>
              {hourCounts.map((count, hour) => {
                const height = Math.max(8, (count / maxCount) * 120);
                const isActive = count > 0;
                
                return (
                  <View key={hour} style={styles.barContainer}>
                    <Text style={styles.barCount}>{count}</Text>
                    <LinearGradient
                      colors={isActive ? ['#10b981', '#059669'] : ['#374151', '#374151']}
                      style={[styles.bar, { height }]}
                    />
                    <Text style={styles.hourLabel}>{hour.toString().padStart(2, '0')}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Active Hours</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#374151' }]} />
              <Text style={styles.legendText}>Inactive Hours</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const exportAsJSON = async () => {
    try {
      const exportData = {
        summary,
        trainingData,
        exportedAt: new Date().toISOString(),
        userId: userId,
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: jsonString,
        title: `ML_Training_Data_${userId}_${Date.now()}.json`,
      });
    } catch (error) {
      Alert.alert('Export Error', error.message);
    }
  };

  const exportAsCSV = async () => {
    try {
      let csvContent = 'Timestamp,Hour,DayOfWeek,IsWeekend,TotalPower,ActiveDevices,DeviceCount\n';
      
      trainingData.deviceUsage.forEach(sample => {
        csvContent += `${sample.timestamp},${sample.hour},${sample.dayOfWeek},${sample.isWeekend},${sample.totalPower || 0},${sample.activeDeviceCount || 0},${sample.devices?.length || 0}\n`;
      });
      
      await Share.share({
        message: csvContent,
        title: `ML_Training_Data_${userId}_${Date.now()}.csv`,
      });
    } catch (error) {
      Alert.alert('Export Error', error.message);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear Training Data',
      'This will permanently delete all collected data. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await mlService.clearUserData();
              await loadData();
              Alert.alert('Success', 'Training data has been cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollView}
      >
        {[
          { key: 'overview', icon: 'dashboard', label: 'Overview' },
          { key: 'samples', icon: 'list', label: `Samples (${trainingData.deviceUsage.length})` },
          { key: 'actions', icon: 'touch-app', label: `Actions (${trainingData.userActions.length})` },
          { key: 'analytics', icon: 'analytics', label: 'Analytics' }
        ].map((tab) => (
          <TouchableOpacity 
            key={tab.key}
            style={[styles.tabButton, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <MaterialIcons 
              name={tab.icon} 
              size={16} 
              color={selectedTab === tab.key ? '#10b981' : '#64748b'} 
            />
            <Text style={[
              styles.tabText, 
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTabContent = () => {
    const emptyState = (icon, title, subtitle) => (
      <View style={styles.emptyState}>
        <MaterialIcons name={icon} size={64} color="#374151" />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={loadData}>
          <MaterialIcons name="refresh" size={20} color="#10b981" />
          <Text style={styles.emptyButtonText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>
    );

    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'samples':
        return (
          <FlatList
            data={trainingData.deviceUsage}
            renderItem={renderDeviceSample}
            keyExtractor={(_, index) => index.toString()}
            style={styles.tabContent}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#10b981']}
                tintColor="#10b981"
              />
            }
            ListEmptyComponent={() => emptyState(
              'storage', 
              'No Training Data', 
              'Start simulation to collect device usage patterns'
            )}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'actions':
        return (
          <FlatList
            data={trainingData.userActions}
            renderItem={renderUserAction}
            keyExtractor={(_, index) => index.toString()}
            style={styles.tabContent}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#10b981']}
                tintColor="#10b981"
              />
            }
            ListEmptyComponent={() => emptyState(
              'touch-app', 
              'No User Actions', 
              'Interact with devices to see recorded actions here'
            )}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Enhanced Header */}
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Analysis Dashboard</Text>
              <Text style={styles.headerSubtitle}>ML Training Data Insights</Text>
            </View>
            
            <TouchableOpacity onPress={loadData} style={styles.headerButton}>
              <MaterialIcons 
                name="refresh" 
                size={24} 
                color={loading ? '#64748b' : '#ffffff'} 
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {renderTabButtons()}
        {renderTabContent()}
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  tabContainer: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabScrollView: {
    paddingHorizontal: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#10b981',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '48%',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  timelineCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748b',
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#27272a',
    marginLeft: 5,
    marginVertical: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 6,
  },
  dataCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  dataCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  dataCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataCardTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  dataCardTime: {
    fontSize: 12,
    color: '#64748b',
  },
  dataCardContent: {
    padding: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  devicesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  devicesSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  devicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  deviceChipText: {
    fontSize: 10,
    color: '#10b981',
    marginLeft: 4,
  },
  chartCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 32,
  },
  barCount: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
    height: 14,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  hourLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 6,
  },
};

export default MLDataViewer;
