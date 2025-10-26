import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  // Header
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  deviceStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceStat: {
    alignItems: 'center',
  },
  deviceStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  activeDeviceStat: {
    color: '#10b981',
  },
  deviceStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  deviceStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#374151',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#18181b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 6,
  },
  controlButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  controlButtonText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
  },
  controlButtonTextActive: {
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  efficiencyExcellent: {
    color: '#10b981',
  },
  efficiencyGood: {
    color: '#22c55e',
  },
  efficiencyFair: {
    color: '#f59e0b',
  },
  efficiencyPoor: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  // ML Features
  mlBanner: {
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  mlBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mlBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mlBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  mlBannerSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  mlBannerPreview: {
    fontSize: 14,
    color: '#d4d4d8',
    lineHeight: 20,
  },
  mlInsightsExpanded: {
    marginTop: 12,
    gap: 12,
  },
  mlInsightCard: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 12,
  },
  mlInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  mlPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mlInsightType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a1a1aa',
    textTransform: 'uppercase',
  },
  mlInsightText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  mlInsightSavings: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  mlPredictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  mlPredictionText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  mlPredictionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 3,
  },
  mlPredictionChipText: {
    fontSize: 10,
    color: '#8b5cf6',
    fontWeight: '700',
  },
  smartAutomationCard: {
    backgroundColor: '#8b5cf610',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  smartAutomationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  smartAutomationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  smartAutomationText: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  // Search and Filter
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center'
  },
  searchInput: {
    backgroundColor: '#18181b',
    color: '#ffffff',
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    minHeight: 48,
    marginHorizontal: 8,
    textAlignVertical: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    alignSelf: 'center',
    zIndex: 1,
  },
  filterButton: {
    backgroundColor: '#18181b',
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearChipText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  // Device Grid
  deviceGrid: {
    paddingHorizontal: 24,
    gap: 24,
    marginBottom: 24,
  },
  deviceList: {
    gap: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  deviceCard: {
    width: cardWidth,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    position: 'relative',
  },
  deviceOffline: {
    borderColor: '#ef4444',
    opacity: 0.7,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceCardIcon: {
    // Container for icon
  },
  favoriteButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineIndicator: {
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  deviceCardRoom: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 8,
  },
  // NEW: Energy badge containers for grid view (FIXED)
  deviceCardEnergyContainer: {
    marginBottom: 8,
  },
  deviceCardEnergyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deviceCardEnergyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  deviceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 45,
    alignItems: 'center',
  },
  statusOn: {
    backgroundColor: '#10b981',
  },
  statusOff: {
    backgroundColor: '#6b7280',
  },
  statusError: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  deviceCardUsage: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  cardMenuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Device List View
  deviceListItem: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  deviceListContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  deviceListIcon: {
    // Container for icon
  },
  deviceListInfo: {
    flex: 1,
  },
  deviceListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deviceListRoom: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  deviceListUsage: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  // NEW: Energy badge containers for list view (FIXED)
  deviceListEnergyContainer: {
    marginTop: 4,
  },
  deviceListEnergyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  deviceListEnergyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  deviceListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Error handling
  errorCard: {
    width: cardWidth,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  // Favorites
  favoritesSection: {
    marginBottom: 24,
    paddingLeft: 20,
  },
  favoriteCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  favoriteName: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  favoriteStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  favoriteStatusOn: {
    backgroundColor: '#10b981',
  },
  favoriteStatusOff: {
    backgroundColor: '#6b7280',
  },
  // Room Controls
  roomControlsContainer: {
    marginBottom: 24,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    paddingHorizontal: 0,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  roomDeviceCount: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 12,
  },
  roomButtons: {
    gap: 8,
  },
  roomButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  roomButtonOn: {
    backgroundColor: '#10b981',
  },
  roomButtonOff: {
    backgroundColor: '#ef4444',
  },
  roomButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  // Modal styles
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#0a0a0b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  filterContent: {
    padding: 20,
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterChipText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  applyFiltersButton: {
    backgroundColor: '#10b981',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  modalCancel: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalSave: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  modalContent: {
    padding: 24,
    paddingHorizontal: 32,
  },
  modalForm: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#18181b',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginHorizontal: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
    lineHeight: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
    marginTop: 4,
  },
  typeOptionTextActive: {
    color: '#ffffff',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Device Actions
  deviceActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  smallButton: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  smallButtonIcon: {
    marginRight: 4,
  },
  smallButtonText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
  },
  // REMOVED: Old overlapping energyBadge styles that caused the issue
  // Energy Badge - REMOVED ABSOLUTE POSITIONING
  // energyBadge: {
  //   position: 'absolute',
  //   top: 12,
  //   left: 12,
  //   paddingHorizontal: 8,
  //   paddingVertical: 4,
  //   borderRadius: 8,
  // },
  // energyBadgeText: {
  //   color: '#ffffff',
  //   fontSize: 10,
  //   fontWeight: '700',
  // },
  // Diagnostics
  diagnosticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  deviceListDiagnostics: {
    fontSize: 10,
    color: '#6b7280',
  },
});
