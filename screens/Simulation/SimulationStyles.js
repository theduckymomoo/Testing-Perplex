import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Base Container - Match Analysis Page
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },

  // Header - Match Analysis Page Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#0a0a0b',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: '#18181b',
    marginHorizontal: 4,
    flex: 1,
  },
  activeTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  tabText: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#10b981',
  },

  // Content Layout
  content: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  tabContentScroll: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },

  // Section Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 16,
  },

  // Day Type Selector
  dayTypeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  dayTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeDayType: {
    backgroundColor: '#10b981',
  },
  dayTypeText: {
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeDayTypeText: {
    color: '#ffffff',
  },

  // Presets Section
  presetsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  presetsGrid: {
    gap: 8,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#18181b',
    gap: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  presetDescription: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Device List
  deviceListContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  deviceScrollContainer: {
    maxHeight: 250,
  },
  deviceItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  selectedDeviceItem: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceType: {
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // NEW: Device Scheduler with better time display
  deviceScheduler: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  deviceSchedulerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedDeviceName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedDeviceType: {
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  copyScheduleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  copyScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  copyScheduleText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },

  // IMPROVED: Time period visualization
  timePeriodsContainer: {
    marginBottom: 16,
  },
  schedulerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  timePeriodsLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  timePeriodLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timePeriodColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timePeriodText: {
    color: '#6c757d',
    fontSize: 9,
    fontWeight: '500',
  },

  // IMPROVED: Hour Grid with better time display
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 16,
    justifyContent: 'center',
  },
  hourButton: {
    width: (width - 130) / 6, // 6 buttons per row for better fit
    height: 48, // Taller for two lines of text
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  activeHourButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  hourText: {
    color: '#6c757d',
    fontSize: 10,
    fontWeight: '700',
  },
  activeHourText: {
    color: '#ffffff',
  },
  hourSubText: {
    color: '#6c757d',
    fontSize: 8,
    fontWeight: '500',
    marginTop: 1,
  },
  activeHourSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Schedule Summary
  scheduleSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#6c757d',
    fontSize: 10,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  // Generate Section
  generateSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  generateButton: {
    marginBottom: 12,
  },

  // IMPROVED: Advanced Settings with better explanations
  advancedSettings: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  settingRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  settingLabelContainer: {
    marginBottom: 8,
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingHelpText: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  settingInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#18181b',
    minWidth: 80,
    alignSelf: 'center',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  sliderValue: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'center',
  },
  behaviorSlider: {
    flex: 1,
    height: 30,
  },

  // Preview Content
  previewCard: {
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
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatLabel: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '500',
  },
  previewStatValue: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },

  // Timeline View
  timelineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  timelineDescription: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 12,
  },
  timelineDeviceInfo: {
    width: 100,
  },
  timelineDeviceName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  timelineDeviceType: {
    color: '#6c757d',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  timelineHours: {
    flexDirection: 'row',
    flex: 1,
    gap: 1,
  },
  timelineHour: {
    flex: 1,
    height: 16,
    backgroundColor: '#18181b',
    borderRadius: 2,
  },
  activeTimelineHour: {
    backgroundColor: '#10b981',
  },

  // Button Styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Progress Styles
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#18181b',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: '500',
    lineHeight: 18,
  },
});
