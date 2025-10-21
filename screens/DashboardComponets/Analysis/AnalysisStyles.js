import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  // Base Container Styles - Match Dashboard
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0b',
  },
  loadingText: {
    color: '#6c757d',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Header Styles - Match Dashboard Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#0a0a0b',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  accuracyText: {
    color: '#10b981',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  samplingModeText: {
    color: '#3b82f6',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },

  // Card Styles - Match Dashboard Cards
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  cardSubtitle: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: -8,
  },

  // Engine Status Card
  engineStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  engineStatusText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Training Progress Styles
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#18181b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    color: '#6c757d',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressSubText: {
    color: '#4a5568',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
  },

  // Section organization styles
  simulationOptionsSection: {
    marginBottom: 16,
  },
  modelTrainingSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
  },
  sectionSubtitle: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },

  // Action Button Styles
  trainingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#374151',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 13,
  },
  dataViewerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    flex: 1,
    justifyContent: 'center',
  },
  dataViewerButtonText: {
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 13,
  },

  // Stats Styles
  dataStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#6c757d',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },

  // Clear Button Style
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
  },
  clearButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubText: {
    color: '#4a5568',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Prediction Styles
  predictionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionDevice: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  predictionBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  predictionProbability: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  predictionDetails: {
    gap: 4,
  },
  predictionStatus: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '500',
  },
  predictionPower: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '500',
  },
  predictionConfidence: {
    color: '#4a5568',
    fontSize: 11,
    fontWeight: '500',
  },
  predictionMethod: {
    color: '#8b5cf6',
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // Recommendation Styles
  recommendationItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationType: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    textTransform: 'capitalize',
  },
  savings: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationText: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    fontWeight: '500',
  },
  recommendationBasis: {
    color: '#8b5cf6',
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  affectedDevices: {
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 8,
  },
  devicesLabel: {
    color: '#6c757d',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '500',
  },
  devicesList: {
    color: '#4a5568',
    fontSize: 11,
    fontWeight: '500',
  },

  // Normal Status Styles
  normalStatus: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  normalText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  normalSubText: {
    color: '#6c757d',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },

  // Anomaly Styles
  anomalyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  anomalyType: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  anomalyMessage: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    fontWeight: '500',
  },
  anomalyValue: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '500',
  },
  anomalyBasis: {
    color: '#8b5cf6',
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },

  // Quick Actions Styles
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: (width - 64) / 2,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  disabledAction: {
    opacity: 0.5,
  },
  quickActionText: {
    color: '#d1d5db',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
});
