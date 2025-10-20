import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform, // Import Platform for better date formatting
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../Context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function AdminScreen() {
  const { supabase, user, signOut } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null); // New state for refresh time
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    activeDevices: 0,
    recentUsers: [],
  });

  useEffect(() => {
    checkAdminAccess();
    fetchAdminStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        Alert.alert(
          'Access Denied',
          'You do not have admin privileges',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Dashboard'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigation.replace('Dashboard');
    }
  };

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total devices
      const { count: deviceCount } = await supabase
        .from('appliances')
        .select('*', { count: 'exact', head: true });

      // Fetch active devices
      const { count: activeCount } = await supabase
        .from('appliances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'on');

      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: userCount || 0,
        totalDevices: deviceCount || 0,
        activeDevices: activeCount || 0,
        recentUsers: recentUsers || [],
      });
      
      setLastRefreshed(new Date()); // Set refresh time on successful fetch

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      Alert.alert('Error', 'Failed to load admin statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminStats();
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.replace('Login');
          },
        },
      ]
    );
  };
  
  // --- NEW NAVIGATION HANDLERS ---
  const handleManageUsers = () => {
    // In a real app, this would navigate to a detailed screen.
    navigation.navigate('ManageUsers'); 
  };
  
  const handleManageDevices = () => {
    navigation.navigate('ManageDevices');
  };
  
  const handleViewReports = () => {
    navigation.navigate('Reports');
  };
  
  const handleSystemSettings = () => {
    navigation.navigate('SystemSettings');
  };

  const handleViewUserDetail = (user) => {
    // Basic Alert as a placeholder for navigating to a 'UserDetailScreen'
    Alert.alert(
      'User Details (Action Placeholder)',
      `Details for: ${user.first_name || 'User'} ${user.last_name || ''}\nEmail: ${user.email}\nID: ${user.id}`,
      [{ text: 'OK' }]
    );
    // In a real app: navigation.navigate('UserDetail', { userId: user.id });
  };
  // -------------------------------
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    // Use Intl.DateTimeFormat for better cross-platform compatibility
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const StatCard = ({ icon, title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIconContainer}>
        <MaterialIcons name={icon} size={32} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const QuickActionButton = ({ icon, title, onPress, color }) => (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const UserListItem = ({ user, onPress }) => ( // New component for better structure
    <TouchableOpacity onPress={() => onPress(user)} style={styles.userItem}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.email}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      <Text style={styles.userDate}>
        {new Date(user.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading Admin Panel...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>
            System Overview 
            {lastRefreshed && (
              <Text style={styles.lastRefreshText}> | Last updated: {formatDate(lastRefreshed)}</Text>
            )}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <MaterialIcons name="logout" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="people"
              title="Total Users"
              value={stats.totalUsers}
              color="#10b981"
            />
            <StatCard
              icon="devices"
              title="Total Devices"
              value={stats.totalDevices}
              color="#3b82f6"
            />
            <StatCard
              icon="power"
              title="Active Devices"
              value={stats.activeDevices}
              color="#f59e0b"
            />
            <StatCard
              icon="bolt"
              title="System Status"
              value="Online"
              color="#8b5cf6"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionButton
              icon="person-add"
              title="Manage Users"
              color="#10b981"
              onPress={handleManageUsers} // Updated
            />
            <QuickActionButton
              icon="devices-other"
              title="Manage Devices"
              color="#3b82f6"
              onPress={handleManageDevices} // Updated
            />
            <QuickActionButton
              icon="analytics"
              title="View Reports"
              color="#f59e0b"
              onPress={handleViewReports} // Updated
            />
            <QuickActionButton
              icon="settings"
              title="System Settings"
              color="#8b5cf6"
              onPress={handleSystemSettings} // Updated
            />
          </View>
        </View>

        {/* Recent Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity onPress={handleManageUsers}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.usersList}>
            {stats.recentUsers.map((user) => (
              <UserListItem // Used new component
                key={user.id} 
                user={user} 
                onPress={handleViewUserDetail} // Added onPress handler
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
  },
  lastRefreshText: { // New style for refresh time
    fontSize: 14,
    color: '#a1a1aa',
    fontStyle: 'italic',
  },
  signOutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  sectionLink: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  usersList: {
    gap: 12,
  },
  userItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  userDate: {
    fontSize: 12,
    color: '#a1a1aa',
  },
});