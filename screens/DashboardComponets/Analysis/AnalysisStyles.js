import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Base Container Styles
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0b',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Header Styles
  header: {
    marginBottom: 24,
  },
  
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  accuracyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  
  samplingModeText: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Card Styles
  card: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  
  cardSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },

  // Progress Styles
  progressContainer: {
    marginBottom: 20,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    marginBottom: 8,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  
  progressSubText: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Engine Status Styles
  engineStatusCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  
  engineStatusText: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 8,
    flex: 1,
  },

  // Simulation & Training Styles
  simulationOptionsSection: {
    marginBottom: 20,
  },
  
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 12,
  },
  
  trainingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  
  actionButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  
  disabledButton: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  dataViewerButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  
  dataViewerButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  modelTrainingSection: {
    marginBottom: 20,
  },

  // Stats Styles
  dataStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },

  // Clear Button Styles
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  
  clearButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Enhanced Prediction Styles
  predictionItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  predictionDevice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  
  predictionBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  predictionProbability: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  predictionDetails: {
    gap: 8,
  },
  
  predictionStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  predictionPower: {
    fontSize: 13,
    color: '#d1d5db',
  },

  // Next State Change Styles
  nextChangeContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  
  nextChangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  
  nextChangeTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  
  nextChangeReason: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  
  usageDuration: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },

  // Energy Impact Styles
  energyImpactContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  
  energyImpactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  
  energyStats: {
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 4,
  },
  
  efficiencyBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },

  // Typical Hours Styles
  typicalHoursContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  
  typicalHoursLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  
  typicalHoursList: {
    fontSize: 12,
    color: '#d1d5db',
  },
  
  predictionConfidence: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  
  predictionMethod: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
    textAlign: 'center',
  },
  
  emptySubText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },

  // Recommendation Styles
  recommendationItem: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  
  recommendationType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textTransform: 'capitalize',
  },
  
  savings: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  
  recommendationText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
    lineHeight: 20,
  },
  
  recommendationBasis: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  
  affectedDevices: {
    marginTop: 8,
  },
  
  devicesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  
  devicesList: {
    fontSize: 12,
    color: '#d1d5db',
  },

  // Anomaly Styles
  normalStatus: {
    alignItems: 'center',
    padding: 24,
  },
  
  normalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 12,
  },
  
  normalSubText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  
  anomalyItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  
  anomalyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textTransform: 'capitalize',
  },
  
  severityBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  
  anomalyMessage: {
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 8,
    lineHeight: 18,
  },
  
  anomalyValue: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  
  anomalyBasis: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Quick Actions Styles
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  quickAction: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    flex: 1,
    minWidth: (width - 80) / 2,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  
  disabledAction: {
    backgroundColor: 'rgba(75, 85, 99, 0.1)',
    borderColor: 'rgba(75, 85, 99, 0.2)',
    opacity: 0.5,
  },
  
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
    marginTop: 8,
    textAlign: 'center',
  },

  // Legacy/Additional Styles (if you have any existing ones)
  // Add any existing styles from your current AnalysisStyles.js here
  
  // Common utility styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  flexOne: {
    flex: 1,
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  marginVerticalSmall: {
    marginVertical: 4,
  },
  
  marginVerticalMedium: {
    marginVertical: 8,
  },
  
  marginVerticalLarge: {
    marginVertical: 16,
  },
  
  paddingHorizontalSmall: {
    paddingHorizontal: 8,
  },
  
  paddingHorizontalMedium: {
    paddingHorizontal: 12,
  },
  
  paddingHorizontalLarge: {
    paddingHorizontal: 16,
  },

  // Color utility styles
  textPrimary: {
    color: '#ffffff',
  },
  
  textSecondary: {
    color: '#d1d5db',
  },
  
  textMuted: {
    color: '#9ca3af',
  },
  
  textSuccess: {
    color: '#10b981',
  },
  
  textWarning: {
    color: '#f59e0b',
  },
  
  textError: {
    color: '#ef4444',
  },
  
  textInfo: {
    color: '#3b82f6',
  },

  // Background utility styles
  backgroundPrimary: {
    backgroundColor: '#18181b',
  },
  
  backgroundSecondary: {
    backgroundColor: '#27272a',
  },
  
  backgroundSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  
  backgroundWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  
  backgroundError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  
  backgroundInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
// Compact Prediction Styles
compactPredictionItem: {
  backgroundColor: 'rgba(59, 130, 246, 0.05)',
  borderRadius: 8,
  padding: 12,
  marginBottom: 8,
  borderLeftWidth: 3,
  borderLeftColor: '#3b82f6',
},

compactPredictionHeader: {
  marginBottom: 8,
},

deviceInfoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

compactDeviceName: {
  fontSize: 15,
  fontWeight: '600',
  color: '#ffffff',
  flex: 1,
},

statusRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

compactStatus: {
  fontSize: 14,
},

compactProbability: {
  fontSize: 12,
  fontWeight: '600',
  color: '#3b82f6',
  backgroundColor: 'rgba(59, 130, 246, 0.15)',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 6,
},

// Main Info Row Styles
mainInfoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
  flexWrap: 'wrap',
  gap: 8,
},

compactPower: {
  fontSize: 12,
  color: '#d1d5db',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
},

nextChangeCompact: {
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  flex: 1,
},

nextChangeCompactText: {
  fontSize: 11,
  color: '#10b981',
  fontWeight: '500',
  textAlign: 'center',
},

energyCompact: {
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
},

energyCompactText: {
  fontSize: 11,
  color: '#f59e0b',
  fontWeight: '500',
},

// Expandable Details Styles
expandButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 8,
  paddingHorizontal: 12,
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: 6,
  marginTop: 4,
  gap: 4,
},

expandButtonText: {
  fontSize: 12,
  color: '#3b82f6',
  fontWeight: '500',
},

expandedDetails: {
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: 'rgba(59, 130, 246, 0.2)',
  gap: 8,
},

expandedSection: {
  marginBottom: 8,
},

expandedLabel: {
  fontSize: 11,
  fontWeight: '600',
  color: '#3b82f6',
  marginBottom: 2,
},

expandedText: {
  fontSize: 12,
  color: '#d1d5db',
  lineHeight: 16,
},

expandedSubText: {
  fontSize: 11,
  color: '#9ca3af',
  marginTop: 2,
},

});

export default styles;
