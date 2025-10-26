import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import mlService from '../../MLEngine/MLService';
import MLDataViewer from '../../MLEngine/MLDataViewer';
import SimulationControls from '../../Simulation/SimulationControls';
import styles from './AnalysisStyles';

const AnalyticsTab = ({ appliances, stats }) => {
  const { user, supabase } = useAuth();
  const [insights, setInsights] = useState({
    ready: false,
    predictions: [],
    recommendations: [],
    anomalies: { hasAnomaly: false, anomalies: [] },
    accuracy: 0,
    dataSamples: 0,
    dayPatterns: 0,
    averageDayAccuracy: 0,
    samplingMode: 'daily',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [showSimulationControls, setShowSimulationControls] = useState(false);
  const [expandedPredictions, setExpandedPredictions] = useState({});
  const [trainingProgress, setTrainingProgress] = useState({
    progress: 0,
    current: 0,
    required: 7,
    canTrain: false,
    samplingMode: 'daily',
  });

  // Initialize ML Service for current user
  const initializeMLService = async () => {
    try {
      if (!user?.id) {
        console.warn('No user available for ML service');
        return false;
      }

      console.log(`Initializing day-based ML Service for user: ${user.id}`);
      
      mlService.setCurrentUser(user.id, supabase);
      const initResult = await mlService.initialize(user.id, supabase);
      
      if (!initResult.success) {
        console.error('ML Service initialization failed:', initResult.error);
        return false;
      }

      console.log('✅ Day-based ML Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing ML Service:', error);
      return false;
    }
  };

  useEffect(() => {
    const initAndLoad = async () => {
      setLoading(true);
      const initialized = await initializeMLService();
      if (initialized) {
        await loadAnalytics();
      } else {
        setLoading(false);
        Alert.alert(
          'ML Engine Setup',
          'Setting up your personalized day-based ML engine. Please try again.',
          [{ text: 'OK', onPress: () => initAndLoad() }]
        );
      }
    };

    if (user?.id) {
      initAndLoad();
    }

    const interval = setInterval(() => {
      if (mlService.hasCurrentUser()) {
        loadAnalytics();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const loadAnalytics = async () => {
    try {
      if (!mlService.hasCurrentUser()) {
        console.warn('ML Service not available for analytics');
        setLoading(false);
        return;
      }

      const mlInsights = mlService.getMLInsights(appliances || []);
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
    const initialized = await initializeMLService();
    if (initialized) {
      await loadAnalytics();
    } else {
      setRefreshing(false);
    }
  };

  // Enhanced Quick Actions with better feedback
  const handleRefresh = async () => {
    Alert.alert('Refreshing Analytics', 'Updating all predictions and recommendations...');
    await loadAnalytics();
    Alert.alert('✅ Updated', 'Analytics data has been refreshed successfully!');
  };

  const handleViewData = () => {
    if (!mlService.hasCurrentUser()) {
      Alert.alert('ML Engine Required', 'Please initialize the ML engine first.');
      return;
    }
    setShowDataViewer(true);
  };

  const handlePlanDay = () => {
    if (!mlService.hasCurrentUser()) {
      Alert.alert(
        'ML Engine Setup Required',
        'Please wait while we set up your personalized ML engine.',
        [
          { 
            text: 'Setup Now', 
            onPress: async () => {
              const initialized = await initializeMLService();
              if (initialized) {
                setShowSimulationControls(true);
              }
            }
          }
        ]
      );
      return;
    }

    if (!appliances || appliances.length === 0) {
      Alert.alert(
        'No Devices Found',
        'Please add some appliances first to plan your day.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowSimulationControls(true);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Training Data',
      'This will delete all ML training data and reset your personalized insights. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await mlService.clearUserData();
              
              if (user?.id) {
                mlService.setCurrentUser(user.id, supabase);
                await mlService.initialize(user.id, supabase);
              }
              
              await loadAnalytics();
              Alert.alert('✅ Cleared', 'All training data has been cleared successfully.');
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

  // Toggle expanded state for predictions
  const togglePredictionExpansion = (index) => {
    setExpandedPredictions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const openTrainingSimulation = () => {
    handlePlanDay();
  };

  const startSimpleSimulation = async () => {
    try {
      if (!mlService.hasCurrentUser()) {
        Alert.alert(
          'ML Engine Setup Required',
          'Please wait while we set up your personalized ML engine.',
          [
            { 
              text: 'Setup Now', 
              onPress: async () => {
                const initialized = await initializeMLService();
                if (initialized) {
                  startSimpleSimulation();
                }
              }
            }
          ]
        );
        return;
      }

      if (!appliances || appliances.length === 0) {
        Alert.alert(
          'No Devices Found',
          'Please add some appliances first to generate training data.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLoading(true);
      console.log('Starting simple day-based simulation with appliances:', appliances.length);
      
      const initResult = mlService.initializeSimulation(appliances);
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      const result = await mlService.fastForwardSimulation(7, (progress) => {
        console.log(`Day simulation progress: ${progress.progress}%`);
      });

      if (result.success) {
        Alert.alert(
          'Day Simulation Complete! 🎉',
          `Generated ${result.samplesGenerated} full day patterns over ${result.simulatedDays} days.\n\nYour ML engine is now learning from realistic daily routines.`,
          [{ text: 'Great!', onPress: loadAnalytics }]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Day simulation error:', error);
      Alert.alert(
        'Simulation Error', 
        error.message || 'Failed to generate day-based simulation data',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: startSimpleSimulation }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const trainModelsDirectly = async () => {
    try {
      if (!mlService.hasCurrentUser()) {
        Alert.alert('ML Engine Error', 'ML Engine not available. Please refresh the page.');
        return;
      }

      setLoading(true);
      const result = await mlService.trainModels();
      
      if (result.success) {
        Alert.alert(
          'Day-Based Training Complete! 🎓',
          `Models trained successfully with day patterns!\n\nDay patterns analyzed: ${result.dayPatternsTrained || 0}\nDaily routines found: ${result.dailyRoutines || 0}\nAccuracy: ${(result.trainingAccuracy * 100).toFixed(1)}%\n\nYour ML engine understands your daily habits.`,
          [{ text: 'Excellent!', onPress: loadAnalytics }]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Training error:', error);
      Alert.alert('Training Error', error.message || 'Failed to train day-based models');
    } finally {
      setLoading(false);
    }
  };

  const clearTrainingData = async () => {
    handleClearData();
  };

  const handleSimulationUpdate = (update) => {
    console.log('Day simulation update:', update);
    loadAnalytics();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <MaterialIcons name="analytics" size={24} color="#10b981" />
        <Text style={styles.title}>Day-Based ML Analytics</Text>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: insights.ready ? '#10b981' : '#f59e0b' }]} />
          <Text style={styles.statusText}>
            {insights.ready ? 'Ready' : 'Learning'}
          </Text>
        </View>
        
        {insights.accuracy > 0 && (
          <Text style={styles.accuracyText}>
            {(insights.accuracy * 100).toFixed(1)}% accuracy
          </Text>
        )}
        
        {insights.samplingMode && (
          <Text style={styles.samplingModeText}>
            Daily Sampling
          </Text>
        )}
      </View>
    </View>
  );

  const renderTrainingProgress = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="school" size={20} color="#10b981" />
        <Text style={styles.cardTitle}>Day-Based Training Progress</Text>
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
          {trainingProgress.current} / {trainingProgress.required} days ({trainingProgress.progress}%)
        </Text>
        <Text style={styles.progressSubText}>
          Day patterns provide richer, more accurate training data
        </Text>
      </View>

      {!mlService.hasCurrentUser() && (
        <View style={styles.engineStatusCard}>
          <MaterialIcons name="info" size={16} color="#f59e0b" />
          <Text style={styles.engineStatusText}>
            ML Engine is being set up for your account...
          </Text>
        </View>
      )}

      <View style={styles.simulationOptionsSection}>
        <Text style={styles.sectionSubtitle}>Day-Based Data Generation</Text>
        <View style={styles.trainingActions}>
          <TouchableOpacity 
            style={[styles.actionButton, !mlService.hasCurrentUser() && styles.disabledButton]} 
            onPress={startSimpleSimulation}
            disabled={!mlService.hasCurrentUser()}
          >
            <MaterialIcons name="play-arrow" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Quick Generate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.dataViewerButton, !mlService.hasCurrentUser() && styles.disabledButton]}
            onPress={handlePlanDay}
            disabled={!mlService.hasCurrentUser()}
          >
            <MaterialIcons name="tune" size={16} color="#10b981" />
            <Text style={styles.dataViewerButtonText}>Plan Your Day</Text>
          </TouchableOpacity>
        </View>
      </View>

      {trainingProgress.canTrain && (
        <View style={styles.modelTrainingSection}>
          <Text style={styles.sectionSubtitle}>Model Training Ready</Text>
          <TouchableOpacity 
            style={[styles.actionButton, !mlService.hasCurrentUser() && styles.disabledButton]}
            onPress={trainModelsDirectly}
            disabled={!mlService.hasCurrentUser()}
          >
            <MaterialIcons name="model-training" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Train Day-Based Models</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dataStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.dayPatterns}</Text>
          <Text style={styles.statLabel}>Day Patterns</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor((insights.dataSamples || 0) / 24)}</Text>
          <Text style={styles.statLabel}>Full Days</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.predictions?.length || 0}</Text>
          <Text style={styles.statLabel}>Predictions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{insights.recommendations?.length || 0}</Text>
          <Text style={styles.statLabel}>Tips</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
        <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
        <Text style={styles.clearButtonText}>Clear Training Data</Text>
      </TouchableOpacity>
    </View>
  );

  // UPDATED: Compact Predictions Display
  const renderPredictions = () => {
    if (!insights.predictions || insights.predictions.length === 0) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="psychology" size={20} color="#3b82f6" />
            <Text style={styles.cardTitle}>Device Predictions & Timing</Text>
          </View>
          <View style={styles.emptyState}>
            <MaterialIcons name="psychology" size={48} color="#6c757d" />
            <Text style={styles.emptyText}>No predictions available</Text>
            <Text style={styles.emptySubText}>
              {!mlService.hasCurrentUser() 
                ? 'Setting up ML engine...' 
                : 'Generate patterns to get predictions'
              }
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="psychology" size={20} color="#3b82f6" />
          <Text style={styles.cardTitle}>Device Predictions & Timing</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Based on {insights.dayPatterns} day patterns
        </Text>
        
        {insights.predictions.slice(0, 5).map((prediction, index) => (
          <View key={index} style={styles.compactPredictionItem}>
            {/* Device Header Row */}
            <View style={styles.compactPredictionHeader}>
              <View style={styles.deviceInfoRow}>
                <Text style={styles.compactDeviceName}>{prediction.deviceName}</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.compactStatus}>
                    {prediction.prediction.willBeActive ? '🟢' : '🔴'}
                  </Text>
                  <Text style={styles.compactProbability}>
                    {Math.round(prediction.prediction.probability * 100)}%
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Main Info Row */}
            <View style={styles.mainInfoRow}>
              <Text style={styles.compactPower}>
                {Math.round(prediction.prediction.expectedPower)}W
              </Text>
              
              {/* Next Change - Compact */}
              {prediction.prediction.nextStateChange && (
                <View style={styles.nextChangeCompact}>
                  <Text style={styles.nextChangeCompactText}>
                    {prediction.prediction.nextStateChange.action === 'turn_on' ? '🟢' : '🔴'} 
                    {prediction.prediction.nextStateChange.timeLabel} 
                    ({prediction.prediction.nextStateChange.hoursFromNow}h)
                  </Text>
                </View>
              )}
              
              {/* Energy Impact - Compact */}
              {prediction.prediction.energyImpact && (
                <View style={styles.energyCompact}>
                  <Text style={styles.energyCompactText}>
                    {prediction.prediction.energyImpact.totalHoursOn}h • 
                    {prediction.prediction.energyImpact.totalEnergyKwh}kWh • 
                    R{prediction.prediction.energyImpact.totalCost}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Expandable Details */}
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => togglePredictionExpansion(index)}
            >
              <Text style={styles.expandButtonText}>
                {expandedPredictions[index] ? 'Less' : 'More'} Details
              </Text>
              <MaterialIcons 
                name={expandedPredictions[index] ? 'expand-less' : 'expand-more'} 
                size={16} 
                color="#3b82f6" 
              />
            </TouchableOpacity>
            
            {/* Expanded Details */}
            {expandedPredictions[index] && (
              <View style={styles.expandedDetails}>
                {prediction.prediction.nextStateChange && (
                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedLabel}>Next Change Details:</Text>
                    <Text style={styles.expandedText}>
                      {prediction.prediction.nextStateChange.reason}
                    </Text>
                    {prediction.prediction.nextStateChange.estimatedDuration && (
                      <Text style={styles.expandedSubText}>
                        Duration: {prediction.prediction.nextStateChange.estimatedDuration.description}
                      </Text>
                    )}
                  </View>
                )}
                
                {prediction.prediction.typicalUsageHours && prediction.prediction.typicalUsageHours.length > 0 && (
                  <View style={styles.expandedSection}>
                    <Text style={styles.expandedLabel}>Typical Hours:</Text>
                    <Text style={styles.expandedText}>
                      {prediction.prediction.typicalUsageHours.slice(0, 8).map(h => h.timeLabel).join(', ')}
                    </Text>
                  </View>
                )}
                
                <View style={styles.expandedSection}>
                  <Text style={styles.expandedLabel}>Confidence & Method:</Text>
                  <Text style={styles.expandedText}>
                    {Math.round(prediction.prediction.confidence * 100)}% confidence • 
                    {prediction.prediction.predictionMethod === 'day_based' ? 'Day patterns' : 'Hourly fallback'}
                    {prediction.prediction.basedOnDays && ` • ${prediction.prediction.basedOnDays} days`}
                  </Text>
                </View>
              </View>
            )}
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
            <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
            <Text style={styles.cardTitle}>Daily Energy Recommendations</Text>
          </View>
          <View style={styles.emptyState}>
            <MaterialIcons name="lightbulb" size={48} color="#6c757d" />
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <Text style={styles.emptySubText}>
              {!mlService.hasCurrentUser() 
                ? 'Setting up day-based ML engine...' 
                : 'Generate day patterns to get personalized insights'
              }
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
          <Text style={styles.cardTitle}>Daily Energy Recommendations</Text>
        </View>
        
        {insights.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <View style={styles.recommendationHeader}>
              <MaterialIcons 
                name={rec.priority === 'high' ? 'priority-high' : rec.priority === 'medium' ? 'remove' : 'low-priority'} 
                size={16} 
                color={rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981'} 
              />
              <Text style={styles.recommendationType}>{rec.type.replace(/_/g, ' ')}</Text>
              {rec.potentialSavings > 0 && (
                <Text style={styles.savings}>R{rec.potentialSavings}/month</Text>
              )}
            </View>
            
            <Text style={styles.recommendationText}>{rec.suggestion}</Text>
            
            {rec.data?.basedOnDays && (
              <Text style={styles.recommendationBasis}>
                Based on {rec.data.basedOnDays} day patterns
              </Text>
            )}
            
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
            <MaterialIcons name="security" size={20} color="#10b981" />
            <Text style={styles.cardTitle}>Daily Anomaly Detection</Text>
          </View>
          <View style={styles.normalStatus}>
            <MaterialIcons name="check-circle" size={24} color="#10b981" />
            <Text style={styles.normalText}>All daily patterns normal</Text>
            {insights.anomalies?.basedOnDayPatterns && (
              <Text style={styles.normalSubText}>
                Based on {insights.anomalies.basedOnDayPatterns} day patterns
              </Text>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="warning" size={20} color="#ef4444" />
          <Text style={styles.cardTitle}>Daily Anomaly Detection</Text>
        </View>
        
        {insights.anomalies.anomalies.map((anomaly, index) => (
          <View key={index} style={styles.anomalyItem}>
            <View style={styles.anomalyHeader}>
              <MaterialIcons 
                name={anomaly.severity === 'high' ? 'error' : 'warning'} 
                size={16} 
                color={anomaly.severity === 'high' ? '#ef4444' : '#f59e0b'} 
              />
              <Text style={styles.anomalyType}>{anomaly.type.replace(/_/g, ' ')}</Text>
              <Text style={[styles.severityBadge, { 
                backgroundColor: anomaly.severity === 'high' ? '#ef4444' : '#f59e0b' 
              }]}>
                {anomaly.severity}
              </Text>
            </View>
            
            <Text style={styles.anomalyMessage}>{anomaly.message}</Text>
            
            {anomaly.currentValue && (
              <Text style={styles.anomalyValue}>
                Current: {typeof anomaly.currentValue === 'number' ? Math.round(anomaly.currentValue) : anomaly.currentValue}
                {anomaly.expectedRange && ` (expected: 0-${Math.round(anomaly.expectedRange[1])})`}
              </Text>
            )}
          </View>
        ))}
        
        {insights.anomalies?.basedOnDayPatterns && (
          <Text style={styles.anomalyBasis}>
            Analysis based on {insights.anomalies.basedOnDayPatterns} day patterns
          </Text>
        )}
      </View>
    );
  };

  // UPDATED: Working Quick Actions
  const renderQuickActions = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="flash-on" size={20} color="#8b5cf6" />
        <Text style={styles.cardTitle}>Quick Actions</Text>
      </View>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickAction} onPress={handleRefresh}>
          <MaterialIcons name="refresh" size={24} color="#10b981" />
          <Text style={styles.quickActionText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickAction, !mlService.hasCurrentUser() && styles.disabledAction]}
          onPress={handlePlanDay}
          disabled={!mlService.hasCurrentUser()}
        >
          <MaterialIcons name="tune" size={24} color="#8b5cf6" />
          <Text style={styles.quickActionText}>Plan Day</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickAction, !mlService.hasCurrentUser() && styles.disabledAction]}
          onPress={handleViewData}
          disabled={!mlService.hasCurrentUser()}
        >
          <MaterialIcons name="analytics" size={24} color="#f59e0b" />
          <Text style={styles.quickActionText}>View Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={handleClearData}>
          <MaterialIcons name="delete" size={24} color="#ef4444" />
          <Text style={styles.quickActionText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>
          {!mlService.hasCurrentUser() ? 'Setting up Day-Based ML Engine...' : 'Loading Day-Based Analytics...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        userId={user?.id || 'unknown'}
      />

      <SimulationControls 
        visible={showSimulationControls}
        onClose={() => setShowSimulationControls(false)}
        appliances={appliances || []}
        onSimulationUpdate={handleSimulationUpdate}
      />
    </View>
  );
};

export default AnalyticsTab;