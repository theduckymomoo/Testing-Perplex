import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  // Base
  container: {
    flex: 1,
    backgroundColor: '#111827', // Dark background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    marginLeft: 5,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: Dimensions.get('window').height - 100,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeaderButton: {
    marginHorizontal: 0, // No margin here, section handles it
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sectionContent: {
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  expandIcon: {
    fontSize: 18,
    color: '#9ca3af',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
  },
  statCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    width: '48.5%', // Slightly less than half to accommodate margin
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },

  // Efficiency Card
  efficiencyCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  efficiencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  efficiencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  efficiencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  efficiencyRating: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  efficiencyExcellent: { color: '#10b981' }, // Green
  efficiencyGood: { color: '#3b82f6' },      // Blue
  efficiencyFair: { color: '#f59e0b' },      // Yellow
  efficiencyPoor: { color: '#ef4444' },      // Red
  efficiencyDescription: {
    flex: 1,
    marginLeft: 15,
    fontSize: 13,
    color: '#9ca3af',
  },

  // Charts
  chartsSection: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  chartControls: {
    marginBottom: 10,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeRangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  timeRangeButtonActive: {
    backgroundColor: '#10b981',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#a1a1aa',
    marginLeft: 4,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#ffffff',
  },
  chartSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 4,
  },
  chartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  chartButtonActive: {
    backgroundColor: '#1f2937',
  },
  chartButtonText: {
    fontSize: 12,
    color: '#a1a1aa',
    marginLeft: 4,
    fontWeight: '600',
  },
  chartButtonTextActive: {
    color: '#ffffff',
  },
  chartContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    marginVertical: 8,
  },
  emptyChartText: {
    color: '#6b7280',
    marginTop: 10,
    fontSize: 14,
  },
  chartLegend: {
    marginTop: 10,
    alignItems: 'center',
  },
  chartLegendText: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Insights
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    width: '48.5%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981', // Default
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    minHeight: 30, // Keep space for 2 lines
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  insightImpact: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  insightAction: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },

  // ML Status Card
  mlStatusCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderColor: '#8b5cf6',
    borderWidth: 1,
  },
  mlStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mlStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  mlStatusContent: {
    paddingHorizontal: 5,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
  mlStatusDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 10,
  },
  trainButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  trainButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  mlMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  mlMetric: {
    alignItems: 'center',
  },
  mlMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  mlMetricLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  retrainButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  retrainButtonText: {
    color: '#8b5cf6',
    fontSize: 12,
    marginLeft: 5,
  },
  mlActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  smallActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  smallActionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 5,
  },


  // Anomaly Alerts
  anomalyContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderColor: '#f59e0b',
    borderLeftWidth: 4,
  },
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  anomalyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 8,
  },
  anomalyCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  anomalyMessage: {
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 5,
  },
  anomalyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  anomalyDetailText: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // Predictions
  predictionCard: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  predictionDeviceName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  predictionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  predictionActive: {
    backgroundColor: '#10b981',
  },
  predictionInactive: {
    backgroundColor: '#9ca3af',
  },
  predictionBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  predictionText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Recommendations (MLInsightCard)
  recommendationCard: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  recommendationType: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  recommendationText: {
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 5,
  },
  savingsText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  confidenceText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Additional Analytics
  tipsList: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tipText: {
    marginLeft: 10,
    color: '#ffffff',
    fontSize: 13,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 12,
    borderColor: '#3b82f6',
    borderLeftWidth: 4,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#9ca3af',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalContent: {
    maxHeight: 400,
  },
  modalDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 15,
  },
  modalSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  modalListItem: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 5,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalActionButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalText: { // For export modal
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
});