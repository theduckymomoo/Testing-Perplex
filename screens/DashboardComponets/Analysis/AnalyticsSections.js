import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Vibration,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import PropTypes from 'prop-types'; 
import styles from './AnalysisStyles'; 

const { width } = Dimensions.get('window');

// --- Reusable Components ---

const StatCard = ({ icon, value, label, color = '#10b981', onPress }) => (
  <TouchableOpacity
    style={styles.statCard}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <MaterialIcons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);
StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string,
  onPress: PropTypes.func,
};

const MLInsightCard = ({ rec }) => (
  <View style={[
    styles.recommendationCard,
    { borderLeftColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981' }
  ]}>
    <View style={styles.recommendationHeader}>
      <Text style={styles.recommendationType}>
        {rec.type ? rec.type.replace('_', ' ').toUpperCase() : 'RECOMMENDATION'}
      </Text>
      <View style={[
        styles.priorityBadge,
        { backgroundColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981' }
      ]}>
        <Text style={styles.priorityText}>{rec.priority}</Text>
      </View>
    </View>

    <Text style={styles.recommendationText}>{rec.suggestion}</Text>

    {rec.potentialSavings && (
      <Text style={styles.savingsText}>
        💰 Save R{rec.potentialSavings}/month
      </Text>
    )}

    {rec.confidence && (
      <Text style={styles.confidenceText}>
        Confidence: {rec.confidence}%
      </Text>
    )}
  </View>
);
MLInsightCard.propTypes = {
  rec: PropTypes.shape({
    priority: PropTypes.string,
    type: PropTypes.string,
    suggestion: PropTypes.string,
    potentialSavings: PropTypes.number,
    confidence: PropTypes.number,
  }).isRequired,
};

// --- Main Section Components ---

/**
 * Renders the ML Status Card, Anomaly Alerts, Predictions, and Recommendations.
 */
export function MLInsightsSection({
  mlData,
  loadingML,
  fadeAnim,
  slideAnim,
  expandedSection,
  toggleSection,
  setShowSimulationModal,
  showModal,
}) {
  const {
    mlInsights,
    trainingProgress,
    predictions,
    recommendations,
    anomalies,
    energyForecast,
    handleRetrain,
    handleReset,
    handleQuickTrainWithSimulator,
  } = mlData;

  // Render ML Status Card
  const renderMLStatusCard = () => (
    <Animated.View
      style={[
        styles.mlStatusCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.mlStatusHeader}>
        <MaterialIcons name="psychology" size={24} color="#8b5cf6" />
        <Text style={styles.mlStatusTitle}>AI Learning Status</Text>
      </View>

      {!mlInsights?.ready ? (
        <View style={styles.mlStatusContent}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${trainingProgress.progress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {trainingProgress.progress}% - Collecting data ({trainingProgress.current}/{trainingProgress.required} samples)
            </Text>
          </View>

          <Text style={styles.mlStatusDescription}>
            {trainingProgress.progress < 100
              ? `Collecting usage patterns. ${trainingProgress.required - trainingProgress.current} more samples needed.`
              : 'Ready to train! Tap the button below.'}
          </Text>

          {trainingProgress.canTrain && (
            <TouchableOpacity
              style={styles.trainButton}
              onPress={handleRetrain}
              disabled={loadingML}
            >
              {loadingML ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="model-training" size={16} color="#ffffff" />
                  <Text style={styles.trainButtonText}>Train Models</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.mlActionRow}>
            <TouchableOpacity
              style={[styles.smallActionButton, { backgroundColor: '#8b5cf6' }]}
              onPress={handleQuickTrainWithSimulator}
            >
              <MaterialIcons name="play-arrow" size={16} color="#ffffff" />
              <Text style={styles.smallActionButtonText}>Quick Train with Simulator</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallActionButton, { backgroundColor: '#ef4444' }]}
              onPress={handleReset}
            >
              <MaterialIcons name="delete-forever" size={16} color="#ffffff" />
              <Text style={styles.smallActionButtonText}>Reset Training</Text>
            </TouchableOpacity>
          </View>

        </View>
      ) : (
        <View style={styles.mlStatusContent}>
          <View style={styles.mlMetrics}>
            <View style={styles.mlMetric}>
              <Text style={styles.mlMetricValue}>
                {(mlInsights.accuracy * 100).toFixed(1)}%
              </Text>
              <Text style={styles.mlMetricLabel}>Accuracy</Text>
            </View>
            <View style={styles.mlMetric}>
              <Text style={styles.mlMetricValue}>{mlInsights.dataSamples}</Text>
              <Text style={styles.mlMetricLabel}>Samples</Text>
            </View>
            <View style={styles.mlMetric}>
              <Text style={styles.mlMetricValue}>
                {predictions.length}
              </Text>
              <Text style={styles.mlMetricLabel}>Predictions</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.retrainButton}
            onPress={handleRetrain}
          >
            <MaterialIcons name="refresh" size={14} color="#8b5cf6" />
            <Text style={styles.retrainButtonText}>Retrain</Text>
          </TouchableOpacity>

          {/* Action row with Reset button for ready state */}
          <View style={styles.mlActionRow}>
            <TouchableOpacity
              style={[styles.smallActionButton, { backgroundColor: '#8b5cf6' }]}
              onPress={handleQuickTrainWithSimulator}
            >
              <MaterialIcons name="play-arrow" size={16} color="#ffffff" />
              <Text style={styles.smallActionButtonText}>Quick Train with Simulator</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallActionButton, { backgroundColor: '#ef4444' }]}
              onPress={handleReset}
            >
              <MaterialIcons name="delete-forever" size={16} color="#ffffff" />
              <Text style={styles.smallActionButtonText}>Reset Training</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );

  // Render Anomaly Alerts
  const renderAnomalyAlerts = () => {
    if (!anomalies.hasAnomaly) return null;

    return (
      <Animated.View
        style={[
          styles.anomalyContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.anomalyHeader}>
          <MaterialIcons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.anomalyTitle}>Unusual Activity Detected</Text>
        </View>

        {anomalies.anomalies.map((anomaly, index) => (
          <View key={index} style={styles.anomalyCard}>
            <Text style={styles.anomalyMessage}>{anomaly.message}</Text>
            <View style={styles.anomalyDetails}>
              <Text style={styles.anomalyDetailText}>
                Current: {anomaly.currentPower}W
              </Text>
              <Text style={styles.anomalyDetailText}>
                Expected: {anomaly.expectedPower}W
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  // Render ML Predictions
  const renderPredictions = () => {
    if (!mlInsights?.ready || predictions.length === 0) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => { Vibration.vibrate(10); toggleSection('predictions'); }}
        style={styles.sectionHeaderButton}
      >
        <Animated.View
          style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>🔮 AI Predictions</Text>
              <Text style={styles.sectionSubtitle}>Next hour device activity</Text>
            </View>
            <Text style={styles.expandIcon}>
              {expandedSection === 'predictions' ? '▼' : '▶'}
            </Text>
          </View>
        </Animated.View>

        {expandedSection === 'predictions' && (
          <Animated.View style={[styles.sectionContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {predictions.slice(0, 5).map((pred, index) => (
              <View key={`${pred.deviceId}-${index}`} style={styles.predictionCard}>
                <View style={styles.predictionHeader}>
                  <Text style={styles.predictionDeviceName}>{pred.deviceName}</Text>
                  <View style={[
                    styles.predictionBadge,
                    pred.prediction.willBeActive ? styles.predictionActive : styles.predictionInactive
                  ]}>
                    <Text style={styles.predictionBadgeText}>
                      {pred.prediction.probability}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.predictionText}>
                  {pred.prediction?.willBeActive
                    ? `Likely to be ON (${pred.prediction?.expectedPower || 0}W)`
                    : 'Likely to remain OFF'}
                </Text>

                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${pred.prediction.probability}%`,
                        backgroundColor: pred.prediction.probability > 70 ? '#10b981' : '#f59e0b'
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  // Render ML Recommendations
  const renderRecommendations = () => {
    if (!mlInsights?.ready || recommendations.length === 0) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => { Vibration.vibrate(10); toggleSection('recommendations'); }}
        style={styles.sectionHeaderButton}
      >
        <Animated.View
          style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>💡 Smart Recommendations</Text>
              <Text style={styles.sectionSubtitle}>AI-powered savings tips</Text>
            </View>
            <Text style={styles.expandIcon}>
              {expandedSection === 'recommendations' ? '▼' : '▶'}
            </Text>
          </View>
        </Animated.View>

        {expandedSection === 'recommendations' && (
          <Animated.View style={[styles.sectionContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {recommendations.map((rec, index) => (
              <MLInsightCard key={index} rec={rec} />
            ))}
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  // Render Energy Forecast
  const renderEnergyForecast = () => {
    if (!energyForecast?.success) return null;

    const chartData = {
      labels: energyForecast.forecast.slice(0, 12).map(f => `${f.hour}h`),
      datasets: [{
        data: energyForecast.forecast.slice(0, 12).map(f => f.expectedPower / 100),
      }],
    };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => { Vibration.vibrate(10); toggleSection('forecast'); }}
        style={styles.sectionHeaderButton}
      >
        <Animated.View
          style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>📈 12-Hour Forecast</Text>
              <Text style={styles.sectionSubtitle}>
                Predicted: {energyForecast.totalExpectedEnergy}kWh (R{energyForecast.totalExpectedCost})
              </Text>
            </View>
            <Text style={styles.expandIcon}>
              {expandedSection === 'forecast' ? '▼' : '▶'}
            </Text>
          </View>
        </Animated.View>

        {expandedSection === 'forecast' && (
          <Animated.View style={[styles.sectionContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LineChart
              data={chartData}
              width={width - 48}
              height={220}
              chartConfig={{
                backgroundGradientFrom: '#18181b',
                backgroundGradientTo: '#18181b',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#8b5cf6' },
              }}
              bezier
              style={styles.chart}
            />

            <View style={styles.forecastSummary}>
              <View style={styles.forecastStat}>
                <Text style={styles.forecastStatValue}>
                  {energyForecast.totalExpectedEnergy}kWh
                </Text>
                <Text style={styles.forecastStatLabel}>Total Energy</Text>
              </View>
              <View style={styles.forecastStat}>
                <Text style={styles.forecastStatValue}>
                  R{energyForecast.totalExpectedCost}
                </Text>
                <Text style={styles.forecastStatLabel}>Total Cost</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {renderMLStatusCard()}
      {renderAnomalyAlerts()}
      {renderPredictions()}
      {renderRecommendations()}
      {renderEnergyForecast()}
    </>
  );
}
MLInsightsSection.propTypes = {
  mlData: PropTypes.object.isRequired,
  loadingML: PropTypes.bool.isRequired,
  fadeAnim: PropTypes.object.isRequired,
  slideAnim: PropTypes.object.isRequired,
  expandedSection: PropTypes.string,
  toggleSection: PropTypes.func.isRequired,
  setShowSimulationModal: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
};

/**
 * Renders the four main statistical cards.
 */
export function StatsOverviewSection({ analytics, fadeAnim, slideAnim }) {
  return (
    <Animated.View
      style={[
        styles.statsGrid,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <StatCard
        icon="devices"
        value={analytics.totalAppliances}
        label="Total Devices"
      />
      <StatCard
        icon="power"
        value={analytics.activeAppliances}
        label="Active Now"
      />
      <StatCard
        icon="flash-on"
        value={`${analytics.totalEnergy}kWh`}
        label="Monthly Usage"
      />
      <StatCard
        icon="attach-money"
        value={`R${analytics.totalCost}`}
        label="Monthly Cost"
      />
    </Animated.View>
  );
}
StatsOverviewSection.propTypes = {
  analytics: PropTypes.object.isRequired,
  fadeAnim: PropTypes.object.isRequired,
  slideAnim: PropTypes.object.isRequired,
};

/**
 * Renders the Efficiency Card.
 */
export function EfficiencySection({ analytics, fadeAnim, slideAnim }) {
  const getEfficiencyStyle = (score) => {
    if (score >= 80) return styles.efficiencyExcellent;
    if (score >= 60) return styles.efficiencyGood;
    if (score >= 40) return styles.efficiencyFair;
    return styles.efficiencyPoor;
  };

  const getEfficiencyDescription = (score) => {
    if (score >= 80) return 'Excellent! Your current device usage is very efficient.';
    if (score >= 60) return 'Good energy management. Some optimization possible.';
    if (score >= 40) return 'Moderate efficiency. Consider turning off unused devices.';
    return 'Needs improvement. Review active device usage patterns.';
  };

  return (
    <Animated.View
      style={[
        styles.efficiencyCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.efficiencyHeader}>
        <MaterialIcons name="eco" size={24} color="#10b981" />
        <Text style={styles.efficiencyTitle}>Current Efficiency Score</Text>
      </View>
      <View style={styles.efficiencyContent}>
        <Text style={[
          styles.efficiencyRating,
          getEfficiencyStyle(analytics.efficiencyScore),
        ]}>
          {analytics.efficiencyScore}%
        </Text>
        <Text style={styles.efficiencyDescription}>
          {getEfficiencyDescription(analytics.efficiencyScore)}
        </Text>
      </View>
    </Animated.View>
  );
}
EfficiencySection.propTypes = {
  analytics: PropTypes.object.isRequired,
  fadeAnim: PropTypes.object.isRequired,
  slideAnim: PropTypes.object.isRequired,
};

// Data for time frame and chart type selectors (moved from original)
const timeFrames = [
  { id: 'day', label: 'Today', icon: 'today' },
  { id: 'week', label: 'Week', icon: 'date-range' },
  { id: 'month', label: 'Month', icon: 'calendar-today' },
  { id: 'year', label: 'Year', icon: 'trending-up' },
];

const chartTypes = [
  { id: 'energy', label: 'Energy', icon: 'flash-on' },
  { id: 'cost', label: 'Cost', icon: 'attach-money' },
  { id: 'devices', label: 'Devices', icon: 'pie-chart' },
];

/**
 * Renders the main chart, selectors, and legend.
 */
export function ChartsSection({
  chartData,
  selectedTimeFrame,
  selectedChart,
  handleTimeFramePress,
  handleChartTypePress,
  fadeAnim,
  slideAnim,
  expandedSection,
  toggleSection,
  scaleAnim,
}) {
  const renderTimeFrameSelector = () => (
    <View style={styles.timeRangeSelector}>
      {timeFrames.map((frame) => (
        <TouchableOpacity
          key={frame.id}
          style={[
            styles.timeRangeButton,
            selectedTimeFrame === frame.id && styles.timeRangeButtonActive,
          ]}
          onPress={() => { Vibration.vibrate(10); handleTimeFramePress(frame.id); }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={frame.icon}
            size={16}
            color={selectedTimeFrame === frame.id ? '#ffffff' : '#a1a1aa'}
          />
          <Text style={[
            styles.timeRangeText,
            selectedTimeFrame === frame.id && styles.timeRangeTextActive,
          ]}>
            {frame.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChartSelector = () => (
    <View style={styles.chartSelector}>
      {chartTypes.map(chart => (
        <TouchableOpacity
          key={chart.id}
          style={[
            styles.chartButton,
            selectedChart === chart.id && styles.chartButtonActive,
          ]}
          onPress={() => { Vibration.vibrate(10); handleChartTypePress(chart.id); }}
        >
          <MaterialIcons
            name={chart.icon}
            size={16}
            color={selectedChart === chart.id ? '#ffffff' : '#a1a1aa'}
          />
          <Text style={[
            styles.chartButtonText,
            selectedChart === chart.id && styles.chartButtonTextActive,
          ]}>
            {chart.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChart = () => {
    const { predictiveChartData, deviceUsageData, chartConfig } = chartData;

    if (selectedChart === 'energy') {
      return (
        <LineChart
          data={predictiveChartData}
          width={width - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withVerticalLines={false}
          withHorizontalLines={false}
        />
      );
    } else if (selectedChart === 'cost') {
      const costData = {
        ...predictiveChartData,
        datasets: [{
          data: predictiveChartData.datasets[0].data.map(value => Math.round(value * 2.5)) // Convert to cost
        }]
      };

      return (
        <BarChart
          data={costData}
          width={width - 48}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      );
    } else {
      const deviceData = deviceUsageData;
      if (deviceData.length === 0) {
        return (
          <View style={styles.emptyChart}>
            <MaterialIcons name="pie-chart" size={48} color="#6b7280" />
            <Text style={styles.emptyChartText}>No active devices to display</Text>
          </View>
        );
      }

      return (
        <PieChart
          data={deviceData}
          width={width - 48}
          height={220}
          chartConfig={chartConfig}
          accessor="usage"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => { Vibration.vibrate(10); toggleSection('charts'); }}
      style={styles.sectionHeaderButton}
    >
      <Animated.View
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>📊 Real-time Analytics</Text>
            <Text style={styles.sectionSubtitle}>Based on currently active devices</Text>
          </View>
          <Text style={styles.expandIcon}>{expandedSection === 'charts' ? '▼' : '▶'}</Text>
        </View>
      </Animated.View>

      {expandedSection === 'charts' && (
        <Animated.View style={[styles.sectionContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.chartsSection}>
            <View style={styles.chartControls}>
              {renderTimeFrameSelector()}
              {renderChartSelector()}
            </View>

            <View style={styles.chartContainer}>
              {renderChart()}
            </View>

            <View style={styles.chartLegend}>
              <Text style={styles.chartLegendText}>
                {selectedChart === 'energy' && 'Current Energy Usage (kWh)'}
                {selectedChart === 'cost' && 'Current Cost (R)'}
                {selectedChart === 'devices' && 'Active Device Power Distribution (W)'}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}
ChartsSection.propTypes = {
  chartData: PropTypes.object.isRequired,
  selectedTimeFrame: PropTypes.string.isRequired,
  selectedChart: PropTypes.string.isRequired,
  handleTimeFramePress: PropTypes.func.isRequired,
  handleChartTypePress: PropTypes.func.isRequired,
  fadeAnim: PropTypes.object.isRequired,
  slideAnim: PropTypes.object.isRequired,
  expandedSection: PropTypes.string,
  toggleSection: PropTypes.func.isRequired,
  scaleAnim: PropTypes.object.isRequired,
};

/**
 * Renders the generated insights cards.
 */
export function InsightsSection({ generatedInsights, fadeAnim, slideAnim, expandedSection, toggleSection, showModal, analytics }) {
  const handleInsightPress = (insight) => {
    Vibration.vibrate(30);

    Alert.alert(
      insight.title,
      `${insight.description}\n\n${insight.impact}`,
      [
        { text: 'Later', style: 'cancel' },
        { text: 'View Details', onPress: () => showModal({
          type: 'insight',
          title: insight.title,
          content: insight,
          analytics: analytics,
        })},
        { text: insight.action, onPress: () => {
          Alert.alert('Action Taken', `Applied: ${insight.title}`);
          Vibration.vibrate(100);
        }},
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => { Vibration.vibrate(10); toggleSection('insights'); }}
      style={styles.sectionHeaderButton}
    >
      <Animated.View
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>🤖 Real-time Insights</Text>
            <Text style={styles.sectionSubtitle}>Based on current device status</Text>
          </View>
          <Text style={styles.expandIcon}>{expandedSection === 'insights' ? '▼' : '▶'}</Text>
        </View>
      </Animated.View>

      {expandedSection === 'insights' && (
        <Animated.View style={[styles.sectionContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.insightsGrid}>
            {generatedInsights.map((insight) => (
              <TouchableOpacity
                key={insight.id}
                style={[styles.insightCard, { borderLeftColor: insight.color }]}
                onPress={() => handleInsightPress(insight)}
                activeOpacity={0.7}
              >
                <View style={styles.insightHeader}>
                  <View style={styles.insightIconContainer}>
                    <MaterialIcons
                      name={insight.icon}
                      size={20}
                      color={insight.color}
                    />
                  </View>
                  <View style={[styles.insightBadge, { backgroundColor: insight.color + '20' }]}>
                    <Text style={[styles.insightBadgeText, { color: insight.color }]}>
                      {insight.type}
                    </Text>
                  </View>
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                <View style={styles.insightFooter}>
                  <Text style={styles.insightImpact}>{insight.impact}</Text>
                  <Text style={styles.insightAction}>{insight.action} →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}
InsightsSection.propTypes = {
  generatedInsights: PropTypes.array.isRequired,
  analytics: PropTypes.object.isRequired,
  fadeAnim: PropTypes.object.isRequired,
  slideAnim: PropTypes.object.isRequired,
  expandedSection: PropTypes.string,
  toggleSection: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
};

/**
 * Renders additional analytics like Peak Usage.
 */
export function AdditionalAnalyticsSection({ analytics, fadeAnim, slideAnim, expandedSection, toggleSection }) {
  // DeviceBreakdownSection and CostAnalysisSection are covered by ChartsSection, InsightsSection, and the Overview
  // We'll keep the Peak Hours section here for the "Additional" part.

  return (
    <>
      {analytics.peakHours && analytics.peakHours.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { Vibration.vibrate(10); toggleSection('peak'); }}
          style={styles.sectionHeaderButton}
        >
          <Animated.View
            style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>⏰ Current Peak Usage</Text>
                <Text style={styles.sectionSubtitle}>Based on active device patterns</Text>
              </View>
              <Text style={styles.expandIcon}>{expandedSection === 'peak' ? '▼' : '▶'}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {expandedSection === 'peak' && analytics.peakHours && (
        <Animated.View style={[styles.sectionContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.tipsList}>
            {analytics.peakHours.map((hour, index) => (
              <View key={index} style={styles.tipItem}>
                <MaterialIcons name="schedule" size={16} color="#10b981" />
                <Text style={styles.tipText}>
                  {hour.time}: {hour.usage}W ({hour.category})
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          AI learns your usage patterns over time. The more data collected, the more accurate predictions become.
        </Text>
      </View>
    </>
  );
}
AdditionalAnalyticsSection.propTypes = {
  analytics: PropTypes.object.isRequired,
  fadeAnim: PropTypes.object.isRequired,
  slideAnim: PropTypes.object.isRequired,
  expandedSection: PropTypes.string,
  toggleSection: PropTypes.func.isRequired,
};