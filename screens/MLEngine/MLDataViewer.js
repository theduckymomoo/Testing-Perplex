import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  Dimensions,
  Share,
  RefreshControl,
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
  const [selectedTab, setSelectedTab] = useState('summary'); // summary, samples, actions, chart

  useEffect(() => {
    if (visible) {
      loadData();
      // Set up auto-refresh every 5 seconds when modal is open
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const engine = mlService.getCurrentEngine();
      if (!engine) {
        console.warn('No ML engine available');
        return;
      }

      const deviceUsage = engine.trainingData?.deviceUsage || [];
      const userActions = engine.trainingData?.userActions || [];

      setTrainingData({
        deviceUsage,
        userActions,
      });

      // Calculate summary stats
      if (deviceUsage.length > 0) {
        const timestamps = deviceUsage.map(d => new Date(d.timestamp)).sort();
        const firstDate = timestamps[0];
        const lastDate = timestamps[timestamps.length - 1];
        const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
        
        setSummary({
          totalSamples: deviceUsage.length,
          dateRange: {
            first: firstDate,
            last: lastDate,
          },
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
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getHourlyDistribution = () => {
    const hourCounts = Array(24).fill(0);
    trainingData.deviceUsage.forEach(sample => {
      if (sample.hour >= 0 && sample.hour < 24) {
        hourCounts[sample.hour]++;
      }
    });
    return hourCounts;
  };

  const renderSummary = () => (
    <ScrollView style={styles.tabContent} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }>
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>📊 Training Data Summary</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Samples:</Text>
          <Text style={styles.statValue}>{summary.totalSamples.toLocaleString()}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>User ID:</Text>
          <Text style={styles.statValue}>{summary.userId || 'Unknown'}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>First Sample:</Text>
          <Text style={styles.statValue}>{formatDate(summary.dateRange.first)}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Last Sample:</Text>
          <Text style={styles.statValue}>{formatDate(summary.dateRange.last)}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Samples/Day:</Text>
          <Text style={styles.statValue}>{summary.samplesPerDay}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Samples/Hour:</Text>
          <Text style={styles.statValue}>{summary.samplesPerHour}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>User Actions:</Text>
          <Text style={styles.statValue}>{trainingData.userActions.length}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>🔄 Live Status</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Simulation:</Text>
          <Text style={[styles.statValue, { color: mlService.isSimulating ? '#4CAF50' : '#FF9800' }]}>
            {mlService.isSimulating ? 'Running' : 'Stopped'}
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Auto-refresh:</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>Every 5s</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderDeviceSample = ({ item, index }) => (
    <View style={styles.sampleCard}>
      <View style={styles.sampleHeader}>
        <Text style={styles.sampleTitle}>Sample #{index + 1}</Text>
        <Text style={styles.sampleDate}>
          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      <View style={styles.sampleInfo}>
        <Text style={styles.sampleDetail}>Hour: {item.hour} | Weekend: {item.isWeekend ? 'Yes' : 'No'}</Text>
        <Text style={styles.sampleDetail}>
          Active devices: {item.activeDeviceCount}/{item.devices?.length || 0}
        </Text>
        <Text style={styles.sampleDetail}>Total power: {Math.round(item.totalPower || 0)}W</Text>
      </View>
      
      <View style={styles.devicesContainer}>
        <Text style={styles.devicesTitle}>Devices:</Text>
        {(item.devices || []).map((device, idx) => (
          <View key={idx} style={styles.deviceRow}>
            <MaterialIcons 
              name={device.isActive ? "check-circle" : "radio-button-unchecked"} 
              size={16} 
              color={device.isActive ? "#4CAF50" : "#666"} 
            />
            <Text style={[styles.deviceName, { color: device.isActive ? '#fff' : '#999' }]}>
              {device.type} - {Math.round(device.power || 0)}W
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderUserAction = ({ item, index }) => (
    <View style={styles.actionCard}>
      <View style={styles.sampleHeader}>
        <Text style={styles.sampleTitle}>Action #{index + 1}</Text>
        <Text style={styles.sampleDate}>
          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      <View style={styles.sampleInfo}>
        <Text style={styles.sampleDetail}>Device: {item.deviceType || 'Unknown'}</Text>
        <Text style={styles.sampleDetail}>Action: {item.action}</Text>
        <Text style={styles.sampleDetail}>Hour: {item.hour} | {item.dayOfWeek === 0 || item.dayOfWeek === 6 ? 'Weekend' : 'Weekday'}</Text>
        <Text style={styles.sampleDetail}>Context: {item.context?.manual ? 'Manual' : 'Automated'} action</Text>
      </View>
    </View>
  );

  const renderHourlyChart = () => {
    const hourCounts = getHourlyDistribution();
    const maxCount = Math.max(...hourCounts, 1);
    
    return (
      <ScrollView style={styles.tabContent} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>📈 Hourly Distribution</Text>
          <Text style={styles.chartSubtitle}>Samples collected per hour (0-23)</Text>
          
          <View style={styles.chartContainer}>
            {hourCounts.map((count, hour) => {
              const height = Math.max(4, (count / maxCount) * 100);
              return (
                <View key={hour} style={styles.barContainer}>
                  <Text style={styles.barLabel}>{count}</Text>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: height,
                        backgroundColor: count > 0 ? '#4CAF50' : '#333'
                      }
                    ]} 
                  />
                  <Text style={styles.hourLabel}>{hour}</Text>
                </View>
              );
            })}
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
      'Clear All Data',
      'Are you sure you want to delete all training data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await mlService.clearUserData();
              await loadData();
              Alert.alert('Success', 'All training data has been cleared.');
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
      <TouchableOpacity 
        style={[styles.tabButton, selectedTab === 'summary' && styles.activeTab]}
        onPress={() => setSelectedTab('summary')}
      >
        <MaterialIcons name="dashboard" size={16} color={selectedTab === 'summary' ? '#4CAF50' : '#666'} />
        <Text style={[styles.tabText, selectedTab === 'summary' && styles.activeTabText]}>
          Summary
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, selectedTab === 'samples' && styles.activeTab]}
        onPress={() => setSelectedTab('samples')}
      >
        <MaterialIcons name="list" size={16} color={selectedTab === 'samples' ? '#4CAF50' : '#666'} />
        <Text style={[styles.tabText, selectedTab === 'samples' && styles.activeTabText]}>
          Samples ({trainingData.deviceUsage.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, selectedTab === 'actions' && styles.activeTab]}
        onPress={() => setSelectedTab('actions')}
      >
        <MaterialIcons name="touch-app" size={16} color={selectedTab === 'actions' ? '#4CAF50' : '#666'} />
        <Text style={[styles.tabText, selectedTab === 'actions' && styles.activeTabText]}>
          Actions ({trainingData.userActions.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, selectedTab === 'chart' && styles.activeTab]}
        onPress={() => setSelectedTab('chart')}
      >
        <MaterialIcons name="bar-chart" size={16} color={selectedTab === 'chart' ? '#4CAF50' : '#666'} />
        <Text style={[styles.tabText, selectedTab === 'chart' && styles.activeTabText]}>
          Chart
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderExportButtons = () => (
    <View style={styles.exportContainer}>
      <TouchableOpacity style={styles.exportButton} onPress={exportAsJSON}>
        <MaterialIcons name="code" size={16} color="#fff" />
        <Text style={styles.exportButtonText}>JSON</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.exportButton} onPress={exportAsCSV}>
        <MaterialIcons name="table-chart" size={16} color="#fff" />
        <Text style={styles.exportButtonText}>CSV</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.exportButton, styles.clearButton]} onPress={clearAllData}>
        <MaterialIcons name="delete-forever" size={16} color="#fff" />
        <Text style={styles.exportButtonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'summary':
        return renderSummary();
      case 'samples':
        return (
          <FlatList
            data={trainingData.deviceUsage}
            renderItem={renderDeviceSample}
            keyExtractor={(_, index) => index.toString()}
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="storage" size={48} color="#666" />
                <Text style={styles.emptyText}>No training data available</Text>
                <Text style={styles.emptySubText}>Run simulation to collect data</Text>
              </View>
            }
          />
        );
      case 'actions':
        return (
          <FlatList
            data={trainingData.userActions}
            renderItem={renderUserAction}
            keyExtractor={(_, index) => index.toString()}
            style={styles.tabContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="touch-app" size={48} color="#666" />
                <Text style={styles.emptyText}>No user actions recorded</Text>
              </View>
            }
          />
        );
      case 'chart':
        return renderHourlyChart();
      default:
        return renderSummary();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#0a0a0b', '#1a1a1b']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>ML Training Data Viewer</Text>
          <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {renderTabButtons()}
        
        {renderTabContent()}
        
        {renderExportButtons()}
      </LinearGradient>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1b',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#2a2a2b',
  },
  activeTab: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#1a1a1b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2b',
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sampleCard: {
    backgroundColor: '#1a1a1b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionCard: {
    backgroundColor: '#1a1a1b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sampleTitle: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  sampleDate: {
    color: '#999',
    fontSize: 12,
  },
  sampleInfo: {
    marginBottom: 12,
  },
  sampleDetail: {
    color: '#ccc',
    fontSize: 13,
    marginVertical: 2,
  },
  devicesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
  },
  devicesTitle: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  deviceName: {
    marginLeft: 8,
    fontSize: 13,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 4,
    marginTop: 16,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginHorizontal: 1,
  },
  barLabel: {
    color: '#999',
    fontSize: 8,
    marginBottom: 4,
  },
  hourLabel: {
    color: '#666',
    fontSize: 8,
    marginTop: 4,
  },
  chartSubtitle: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  exportContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
};

export default MLDataViewer;
