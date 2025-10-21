import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  // Base Container Styles - Match Analysis Page
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },

  // Header Styles - Match Analysis Page Header
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
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },

  // FIXED: Tab Navigation Styles
  tabContainer: {
    backgroundColor: '#0a0a0b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tabButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    minWidth: width - 32, // Account for horizontal padding
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: '#18181b',
    minWidth: 80, // Minimum width to prevent overlap
    flex: 0, // Don't flex to avoid stretching
  },
  activeTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  tabText: {
    color: '#6c757d',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
    flexShrink: 1, // Allow text to shrink if needed
  },
  activeTabText: {
    color: '#10b981',
  },

  // Content Styles
  tabContent: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Card Styles - Match Analysis Page Cards
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
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

  // Stats Row Styles
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  statLabel: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 0,
  },

  // Status Indicator Styles
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Sample Card Styles
  sampleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sampleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sampleTitle: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  sampleDate: {
    color: '#6c757d',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
    flex: 0,
  },
  sampleInfo: {
    marginBottom: 12,
  },
  sampleDetail: {
    color: '#d1d5db',
    fontSize: 12,
    marginVertical: 2,
    fontWeight: '500',
  },

  // Device Container Styles
  devicesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 8,
  },
  devicesTitle: {
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  deviceName: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Chart Styles
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 4,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 6,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  barLabel: {
    color: '#6c757d',
    fontSize: 7,
    marginBottom: 4,
    fontWeight: '500',
  },
  hourLabel: {
    color: '#4a5568',
    fontSize: 7,
    marginTop: 4,
    fontWeight: '500',
  },
  chartSubtitle: {
    color: '#6c757d',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },

  // Export Button Styles
  exportContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    backgroundColor: '#0a0a0b',
    gap: 8,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  exportButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 13,
  },

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    marginHorizontal: 20,
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    color: '#4a5568',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
});
