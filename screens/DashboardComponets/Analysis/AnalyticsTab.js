import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import mlService from '../../MLEngine/MLService';
import MLDataViewer from '../../MLEngine/MLDataViewer';

const { width } = Dimensions.get('window');

const AnalyticsTab = ({ appliances, userProfile, onApplianceToggle }) => {
  const [insights, setInsights] = useState({
    ready: false,
    predictions: [],
    recommendations: [],
    anomalies: { hasAnomaly: false, anomalies: [] },
    accuracy: 0,
    dataSamples: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState({
    progress: 0,
    current: 0,
    required: 50,
    canTrain: false,
  });

  useEffect(() => {
    loadAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [appliances]);

  const loadAnalytics = async () => {
    try {
      if (!mlService.hasCurrentUser()) {
        console.warn('No user set for ML service');
        return;
      }

      // Get ML insights
      const mlInsights = mlService.getMLInsights(appliances || []);
      
      // Get training progress
      const progress = mlService.getTrainingProgress();
      
      setInsights(mlInsights);
      setTrainingProgress(progress);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Analytics Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const startSimulation = async () => {
    try {
      setLoading(true);
      
      // Initialize simulation with current appliances
      const initResult = mlService.initializeSimulation(appliances || []);
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      // Fast-forward 7 days of simulation data
      const result = await mlService.fastForwardSimulation(7, (progress) => {
        console.log(`Simulation progress: ${progress.progress}%`);
      });

      if (result.success) {
        Alert.alert(
          'Simulation Complete',
          `Generated ${result.samplesGenerated} training samples over ${result.simulatedDays} days.`,
          [{ text: 'OK', onPress: loadAnalytics }]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      Alert.alert('Simulation Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const trainModels = async () => {
    try {
      setLoading(true);
      const result = await mlService.trainModels();
      
      if (result.success) {
        Alert.alert(
          'Training Complete',
          `Models trained with ${result.modelInfo?.patternsDiscovered || 0} device patterns.\nAccuracy: ${(result.trainingAccuracy * 100).toFixed(1)}%`,
          [{ text: 'OK', onPress: loadAnalytics }]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Training error:', error);
      Alert.alert('Training Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearTrainingData = async () => {
    Alert.alert(
      'Clear Training Data',
      'Are you sure you want to delete all ML training data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await mlService.clearUserData();
              await loadAnalytics();
              Alert.alert('Success', 'All training data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <MaterialIcons name="analytics" size={24} color="#4CAF50" />
        <Text style={styles.title}>ML Analytics</Text>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: insights.ready ? '#4CAF50' : '#FF9800' }]} />
          <Text style={styles.statusText}>
            {insights.ready ? 'Ready' : 'Learning'}
          </Text>
        </View>
        
        {insights.accuracy > 0 && (
          <Text style={styles.accuracyText}>
            {(insights.accuracy * 100).toFixed(1)}% accuracy
          </Text>
        )}
      </View>
    </View>
  );

  const renderTrainingProgress = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="school" size={20} color="#4CAF50" />
        <Text style={styles.cardTitle}>Training Progress</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(100, trainingProgress.progress)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {trainingProgress.current} / {trainingProgress.required} samples ({trainingProgress.progress}%)
        </Text>
      </View>

      <View style={styles.trainingActions}>
        {!trainingProgress.canTrain && (
          <TouchableOpacity style={styles.actionButton} onPress={startSimulation}>
            <MaterialIcons name="play-arrow" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Generate Data</Text>
          </TouchableOpacity>
        )}
        
        {trainingProgress.canTrain && (
          <TouchableOpacity style={styles.actionButton} onPress={trainModels}>
            <MaterialIcons name="model-training" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Train Models</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.dataViewerButton}
          onPress={() => setShowDataViewer(true)}
        >
          <MaterialIcons name="storage" size={16} color="#4CAF50" />
          <Text style={styles.dataViewerButtonText}>View Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dataStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.dataSamples}</Text>
          <Text style={styles.statLabel}>Samples</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.predictions?.length || 0}</Text>
          <Text style={styles.statLabel}>Predictions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.recommendations?.length || 0}</Text>
          <Text style={styles.statLabel}>Tips</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.anomalies?.anomalies?.length || 0}</Text>
          <Text style={styles.statLabel}>Anomalies</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.clearButton} onPress={clearTrainingData}>
        <MaterialIcons name="delete-outline" size={16} color="#f44336" />
        <Text style={styles.clearButtonText}>Clear Training Data</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPredictions = () => {
    if (!insights.predictions || insights.predictions.length === 0) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="psychology" size={20} color="#2196F3" />
            <Text style={styles.cardTitle}>Device Predictions</Text>
          </View>
          <View style={styles.emptyState}>
            <MaterialIcons name="psychology" size={48} color="#666" />
            <Text style={styles.emptyText}>No predictions available</Text>
            <Text style={styles.emptySubText}>Need more training data</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="psychology" size={20} color="#2196F3" />
          <Text style={styles.cardTitle}>Device Predictions</Text>
        </View>
        
        {insights.predictions.slice(0, 5).map((prediction, index) => (
          <View key={index} style={styles.predictionItem}>
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionDevice}>{prediction.deviceName}</Text>
              <View style={styles.predictionBadge}>
                <Text style={styles.predictionProbability}>
                  {Math.round(prediction.prediction.probability * 100)}%
                </Text>
              </View>
            </View>
            
            <View style={styles.predictionDetails}>
              <Text style={styles.predictionStatus}>
                {prediction.prediction.willBeActive ? '🟢 Likely ON' : '🔴 Likely OFF'}
              </Text>
              <Text style={styles.predictionPower}>
                {Math.round(prediction.prediction.expectedPower)}W expected
              </Text>
              <Text style={styles.predictionConfidence}>
                Confidence: {Math.round(prediction.prediction.confidence * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!insights.recommendations || insights.recommendations.length === 0) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="lightbulb" size={20} color="#FF9800" />
            <Text style={styles.cardTitle}>Energy Recommendations</Text>
          </View>
          <View style={styles.emptyState}>
            <MaterialIcons name="lightbulb" size={48} color="#666" />
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <Text style={styles.emptySubText}>Keep using your devices to get insights</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="lightbulb" size={20} color="#FF9800" />
          <Text style={styles.cardTitle}>Energy Recommendations</Text>
        </View>
        
        {insights.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <View style={styles.recommendationHeader}>
              <MaterialIcons 
                name={rec.priority === 'high' ? 'priority-high' : rec.priority === 'medium' ? 'remove' : 'low-priority'} 
                size={16} 
                color={rec.priority === 'high' ? '#f44336' : rec.priority === 'medium' ? '#FF9800' : '#4CAF50'} 
              />
              <Text style={styles.recommendationType}>{rec.type.replace(/_/g, ' ')}</Text>
              {rec.potentialSavings > 0 && (
                <Text style={styles.savings}>R{rec.potentialSavings}/month</Text>
              )}
            </View>
            
            <Text style={styles.recommendationText}>{rec.suggestion}</Text>
            
            {rec.devices && rec.devices.length > 0 && (
              <View style={styles.affectedDevices}>
                <Text style={styles.devicesLabel}>Affected devices:</Text>
                <Text style={styles.devicesList}>
                  {rec.devices.map(deviceId => {
                    const device = appliances?.find(a => a.id === deviceId);
                    return device?.name || deviceId;
                  }).join(', ')}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderAnomalies = () => {
    if (!insights.anomalies?.hasAnomaly) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="security" size={20} color="#4CAF50" />
            <Text style={styles.cardTitle}>Anomaly Detection</Text>
          </View>
          <View style={styles.normalStatus}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.normalText}>All systems normal</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="warning" size={20} color="#f44336" />
          <Text style={styles.cardTitle}>Anomaly Detection</Text>
        </View>
        
        {insights.anomalies.anomalies.map((anomaly, index) => (
          <View key={index} style={styles.anomalyItem}>
            <View style={styles.anomalyHeader}>
              <MaterialIcons 
                name={anomaly.severity === 'high' ? 'error' : 'warning'} 
                size={16} 
                color={anomaly.severity === 'high' ? '#f44336' : '#FF9800'} 
              />
              <Text style={styles.anomalyType}>{anomaly.type.replace(/_/g, ' ')}</Text>
              <Text style={[styles.severityBadge, { 
                backgroundColor: anomaly.severity === 'high' ? '#f44336' : '#FF9800' 
              }]}>
                {anomaly.severity}
              </Text>
            </View>
            
            <Text style={styles.anomalyMessage}>{anomaly.message}</Text>
            
            {anomaly.currentValue && (
              <Text style={styles.anomalyValue}>
                Current: {Math.round(anomaly.currentValue)}
                {anomaly.expectedRange && ` (expected: 0-${Math.round(anomaly.expectedRange[1])})`}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="flash-on" size={20} color="#9C27B0" />
        <Text style={styles.cardTitle}>Quick Actions</Text>
      </View>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickAction} onPress={loadAnalytics}>
          <MaterialIcons name="refresh" size={24} color="#4CAF50" />
          <Text style={styles.quickActionText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={startSimulation}>
          <MaterialIcons name="play-circle-filled" size={24} color="#2196F3" />
          <Text style={styles.quickActionText}>Simulate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={() => setShowDataViewer(true)}>
          <MaterialIcons name="analytics" size={24} color="#FF9800" />
          <Text style={styles.quickActionText}>View Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={clearTrainingData}>
          <MaterialIcons name="delete" size={24} color="#f44336" />
          <Text style={styles.quickActionText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#0a0a0b', '#1a1a1b']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading ML Analytics...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0b', '#1a1a1b']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderTrainingProgress()}
        {renderPredictions()}
        {renderRecommendations()}
        {renderAnomalies()}
        {renderQuickActions()}
      </ScrollView>

      <MLDataViewer 
        visible={showDataViewer}
        onClose={() => setShowDataViewer(false)}
        userId={userProfile?.id || 'unknown'}
      />
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  accuracyText: {
    color: '#4CAF50',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1a1a1b',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  trainingActions: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  dataViewerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    flex: 1,
    justifyContent: 'center',
  },
  dataViewerButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  dataStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#999',
    fontSize: 11,
    marginTop: 2,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  clearButtonText: {
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  predictionItem: {
    backgroundColor: '#0f0f10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2b',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionDevice: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  predictionBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  predictionProbability: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  predictionDetails: {
    gap: 4,
  },
  predictionStatus: {
    color: '#ccc',
    fontSize: 12,
  },
  predictionPower: {
    color: '#999',
    fontSize: 11,
  },
  predictionConfidence: {
    color: '#666',
    fontSize: 11,
  },
  recommendationItem: {
    backgroundColor: '#0f0f10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2b',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationType: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    textTransform: 'capitalize',
  },
  savings: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  affectedDevices: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
  },
  devicesLabel: {
    color: '#999',
    fontSize: 11,
    marginBottom: 4,
  },
  devicesList: {
    color: '#666',
    fontSize: 11,
  },
  normalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  normalText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  anomalyItem: {
    backgroundColor: '#0f0f10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2b',
  },
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  anomalyType: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  anomalyMessage: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  anomalyValue: {
    color: '#999',
    fontSize: 11,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f10',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: (width - 64) / 2,
    borderWidth: 1,
    borderColor: '#2a2a2b',
  },
  quickActionText: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
};

export default AnalyticsTab;
