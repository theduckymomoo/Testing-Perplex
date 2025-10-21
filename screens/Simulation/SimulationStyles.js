// SimulationStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  controlCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  controlSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
    lineHeight: 20,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  speedLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
    minWidth: 30,
  },
  currentSpeed: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#ef4444',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  buttonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  outlineButtonText: {
    color: '#a1a1aa',
    fontWeight: '600',
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
  },
  progressText: {
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  fastForwardGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fastForwardButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  fastForwardText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 8,
  },
  fastForwardSubtext: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 2,
  },
  trainingProgress: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  progressPercent: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  progressStatus: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a20',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#93c5fd',
    lineHeight: 20,
  },

  // NEW ENHANCED SCHEDULING STYLES
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#374151',
  },
  tabText: {
    color: '#9ca3af',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 12,
  },
  activeTabText: {
    color: '#10b981',
  },

  // Device scheduling styles
  deviceListContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  deviceItem: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedDeviceItem: {
    borderColor: '#10b981',
    backgroundColor: '#0d3d2b',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceType: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },

  // Pattern buttons
  patternsSection: {
    marginVertical: 16,
  },
  patternsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
  },
  patternsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  patternButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    minWidth: (width - 80) / 3,
  },
  patternText: {
    color: '#d1d5db',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Hour grid styles
  scheduleSection: {
    marginVertical: 16,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  copyButton: {
    padding: 8,
    backgroundColor: '#1f2937',
    borderRadius: 6,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  hourButton: {
    width: (width - 96) / 8,
    height: 36,
    backgroundColor: '#1f2937',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  activeHourButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  hourText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  activeHourText: {
    color: '#ffffff',
  },

  // Advanced settings
  advancedSettings: {
    paddingVertical: 16,
  },
  settingsCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  lastSettingRow: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
  },
  settingDescription: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  settingInput: {
    backgroundColor: '#374151',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  settingInputGroup: {
    alignItems: 'flex-end',
  },

  // Schedule preview styles
  previewSection: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  previewItemLast: {
    borderBottomWidth: 0,
  },
  previewDeviceInfo: {
    flex: 1,
  },
  previewDeviceName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewDeviceType: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  previewStats: {
    alignItems: 'flex-end',
  },
  previewHours: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCost: {
    color: '#fbbf24',
    fontSize: 12,
    marginTop: 2,
  },

  // Time selector styles
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  timeLabel: {
    color: '#d1d5db',
    fontSize: 14,
    marginRight: 12,
  },
  timePicker: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  timeInput: {
    backgroundColor: '#374151',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  timeColon: {
    color: '#9ca3af',
    fontSize: 16,
    alignSelf: 'center',
  },

  // Action button styles
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  primaryActionButton: {
    backgroundColor: '#10b981',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  dangerActionButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  primaryActionButtonText: {
    color: '#ffffff',
  },
  secondaryActionButtonText: {
    color: '#9ca3af',
  },

  // Enhanced grid styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  gridItem: {
    flex: 1,
    minWidth: (width - 80) / 3,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  gridItemActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  gridItemText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  gridItemActiveText: {
    color: '#ffffff',
  },

  // Legend and help styles
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#9ca3af',
    fontSize: 11,
  },

  // Enhanced info styles
  helpContainer: {
    backgroundColor: '#1e3a8a20',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#3b82f680',
  },
  helpTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  helpTitleText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    color: '#93c5fd',
    fontSize: 13,
    lineHeight: 18,
  },

  // Summary cards
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Loading states
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
  },

  // Modal enhancements
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0a0a0b',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    minWidth: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Enhanced device card styles
  deviceCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  deviceCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#0a2818',
  },
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceCardInfo: {
    flex: 1,
  },
  deviceCardName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceCardDetails: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  deviceCardStats: {
    alignItems: 'flex-end',
  },
  deviceCardPower: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceCardRoom: {
    color: '#6b7280',
    fontSize: 11,
  },

  // Schedule visualization
  scheduleVisualization: {
    marginTop: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  scheduleRowLabel: {
    color: '#9ca3af',
    fontSize: 12,
    minWidth: 80,
  },
  scheduleRowBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 1,
  },
  scheduleBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  scheduleBarActive: {
    backgroundColor: '#10b981',
  },

  // Time range picker
  timeRangeContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  timeRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeRangeTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeRangeInput: {
    backgroundColor: '#374151',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 50,
    textAlign: 'center',
  },
  timeRangeTo: {
    color: '#9ca3af',
    fontSize: 14,
  },

  // Batch actions
  batchActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  batchButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  batchButtonText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },

  // Floating action button
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Toast/notification styles
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 10,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
