import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  RefreshControl,
  Alert,
  Modal,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import styles from './AnalysisStyles';
import SimulationControls from '../../Simulation/SimulationControls';
import { useAnalyticsData } from './useAnalyticsData';
import {
  MLInsightsSection,
  StatsOverviewSection,
  EfficiencySection,
  ChartsSection,
  InsightsSection,
  AdditionalAnalyticsSection,
} from './AnalyticsSections'; // The sections file

export default function AnalysisTab({ appliances = [], stats = {} }) {
  // --- Animation values (Kept in main component for orchestration) ---
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));

  // --- UI/Modal States (Kept in main component) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulatedAppliances, setSimulatedAppliances] = useState(appliances); // Used for simulation mode

  // --- Custom Hook for Data and Logic ---
  const {
    refreshing,
    loadingML,
    selectedTimeFrame,
    selectedChart,
    expandedSection,
    onRefresh,
    toggleSection,
    handleTimeFramePress,
    handleChartTypePress,
    analytics,
    generatedInsights,
    chartConfig,
    mlData,
  } = useAnalyticsData(appliances);


  // --- Effects (Animation) ---

  // Pulsing animation for important elements
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1)), useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 700, easing: Easing.elastic(1), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);


  // --- Modal/Export Handlers (Kept in main component) ---

  const showModal = (content) => {
    Vibration.vibrate(30);
    setModalContent(content);
    setModalVisible(true);
  };

  const exportReport = () => {
    setShowExportModal(true);
    setTimeout(() => {
      Alert.alert(
        'Report Exported',
        'Your energy report has been saved and is ready to share.',
        [{ text: 'OK' }]
      );
      setShowExportModal(false);
    }, 2000);
  };

  const renderModalContent = () => {
    if (!modalContent) return null;

    switch (modalContent.type) {
      case 'insight':
        const insightAnalytics = modalContent.analytics || analytics; // Use current analytics if modalContent doesn't have it
        const potentialSavings = Math.round(insightAnalytics.totalCost * 0.15);

        return (
          <View>
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalDescription}>{modalContent.content.details}</Text>
            {modalContent.content.devices && modalContent.content.devices.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Affected Devices:</Text>
                {modalContent.content.devices.map((device, index) => (
                  <Text key={index} style={styles.modalListItem}>• {device}</Text>
                ))}
              </View>
            )}
            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>R{potentialSavings}</Text>
                <Text style={styles.modalStatLabel}>Monthly Savings</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>{insightAnalytics.efficiencyScore}%</Text>
                <Text style={styles.modalStatLabel}>Efficiency</Text>
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View>
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalDescription}>Detailed predictive analytics based on your current ACTIVE device usage patterns.</Text>
          </View>
        );
    }
  };


  // --- Empty State Check ---
  if (!appliances || appliances.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
          }
        >
          <Animated.View style={[styles.emptyIcon, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialIcons name="analytics" size={64} color="#6b7280" />
          </Animated.View>
          <Text style={styles.emptyTitle}>No Data Available</Text>
          <Text style={styles.emptySubtitle}>
            Connect some devices to see predictive analytics and energy insights
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.7}
            onPress={() => Vibration.vibrate(30)}
          >
            <Text style={styles.emptyButtonText}>Add Devices</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.title}>AI-Powered Analytics</Text>
            <Text style={styles.subtitle}>Real-time insights with machine learning</Text>
          </View>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportReport}
          >
            <MaterialIcons name="share" size={20} color="#ffffff" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 1. ML Insights Section (Status, Alerts, Predictions, Recommendations, Forecast) */}
        <MLInsightsSection
          mlData={mlData}
          loadingML={loadingML}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          expandedSection={expandedSection}
          toggleSection={toggleSection}
          setShowSimulationModal={setShowSimulationModal}
          showModal={showModal}
        />

        {/* 2. Stats Overview Section */}
        <StatsOverviewSection
          analytics={analytics}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
        />

        {/* 3. Efficiency Section */}
        <EfficiencySection
          analytics={analytics}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
        />

        {/* 4. Charts Section (Energy/Cost/Device Charts & Selectors) */}
        <ChartsSection
          chartData={{ predictiveChartData: mlData.predictiveChartData, deviceUsageData: mlData.deviceUsageData, chartConfig }}
          selectedTimeFrame={selectedTimeFrame}
          selectedChart={selectedChart}
          handleTimeFramePress={handleTimeFramePress}
          handleChartTypePress={handleChartTypePress}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          expandedSection={expandedSection}
          toggleSection={toggleSection}
          scaleAnim={scaleAnim}
        />

        {/* 5. Real-time Insights Section */}
        <InsightsSection
          generatedInsights={generatedInsights}
          analytics={analytics}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          expandedSection={expandedSection}
          toggleSection={toggleSection}
          showModal={showModal}
        />

        {/* 6. Additional Analytics Sections (Peak Usage, Info Card) */}
        <AdditionalAnalyticsSection
          analytics={analytics}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          expandedSection={expandedSection}
          toggleSection={toggleSection}
        />

      </ScrollView>

      {/* Detail Modal (Kept in main container) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalContent?.title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {renderModalContent()}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalActionText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Export Modal (Kept in main container) */}
      <Modal
        visible={showExportModal}
        animationType="fade"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.modalText}>Generating Report...</Text>
          </View>
        </View>
      </Modal>

      {/* Simulation Controls Modal (Kept in main container) */}
      <SimulationControls
        visible={showSimulationModal}
        onClose={() => setShowSimulationModal(false)}
        appliances={appliances}
        onSimulationUpdate={(update) => {
          setSimulatedAppliances(update.appliances);
          // Calling refreshMLInsights from the hook via mlData
          mlData.refreshMLInsights();
        }}
      />
    </SafeAreaView>
  );
}