const styles = StyleSheet.create({
  // Base Styles
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
    marginTop: 16,
    fontSize: 16,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  
  // Enhanced Header
  header: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
    padding: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  panicButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  panicText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Energy Status Banner
  energyBanner: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  energyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  energyStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  energyStatusEmoji: {
    fontSize: 24,
  },
  energyStatusText: {
    flex: 1,
  },
  energyStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  energyStatusSubtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  energyOptimizeButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  energyOptimizeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Enhanced Quick Stats
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
    marginBottom: 8,
  },
  statTrend: {
    alignItems: 'center',
  },
  statTrendText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Quick Control Panel
  quickControlsScroll: {
    marginTop: 12,
  },
  quickControlCard: {
    width: 140,
    padding: 16,
    marginRight: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  quickControlIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  quickControlTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickControlSubtitle: {
    fontSize: 11,
    color: '#a1a1aa',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Enhanced Device Cards
  activeDevice: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeDeviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  deviceRoom: {
    fontSize: 11,
    color: '#a1a1aa',
    marginBottom: 8,
    fontWeight: '500',
  },
  deviceUsage: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
    marginBottom: 12,
  },
  deviceControlButtons: {
    width: '100%',
  },
  deviceControlButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  deviceControlButtonText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Room Overview
  roomOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  roomOverviewCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  roomOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomOverviewIcon: {
    fontSize: 24,
  },
  roomOverviewDeviceCount: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roomOverviewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  roomOverviewUsage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
  },
  roomOverviewStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roomOverviewStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Energy Insights
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  insightDescription: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    marginBottom: 12,
  },
  insightAction: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '700',
  },

  // Weather Tip Card
  weatherTipCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  weatherTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherTipIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  weatherTipTemp: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  weatherTipDescription: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  weatherTipAction: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 16,
  },
  weatherTipButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  weatherTipButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  efficiency: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  viewAllText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  clearAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearAllText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },

  // Enhanced Activity
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  activityImpact: {
    alignItems: 'flex-end',
  },
  activityImpactText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // No Active Devices State
  noActiveDevices: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noActiveText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  addFirstDeviceButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addFirstDeviceText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Controls Page Styles
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Device Grid
  deviceGrid: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deviceCard: {
    width: cardWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceCardIcon: {
    fontSize: 32,
  },
  deviceCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  deviceCardRoom: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 16,
    fontWeight: '500',
  },
  deviceCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deviceCardUsage: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  deviceCardCost: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  deviceCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  deviceCardBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Analysis Page
  analysisHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  analysisSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },

  // Usage Chart
  usageChart: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartFill: {
    width: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Monthly Stats
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  monthCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  monthLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 6,
    fontWeight: '500',
  },
  monthValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  monthChange: {
    fontSize: 12,
    fontWeight: '700',
  },
  monthChangeIncrease: {
    color: '#ef4444',
  },
  monthChangeDecrease: {
    color: '#10b981',
  },

  // Enhanced Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  modalCancel: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  modalContent: {
    flex: 1,
  },
  modalForm: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 16,
    fontWeight: '500',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 110,
  },
  typeOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  typeOptionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  typeOptionText: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },

  // Enhanced Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  navIconContainerActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  navIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  navIconTextActive: {
    color: '#ffffff',
  },
  navLabel: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#10b981',
    fontWeight: '800',
  },

  // Additional utility styles
  shadowSmall: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shadowMedium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },