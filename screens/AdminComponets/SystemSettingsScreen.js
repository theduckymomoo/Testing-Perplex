// FILE: SystemSettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function SystemSettingsScreen() {
  const navigation = useNavigation();
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [emailAlerts, setEmailAlerts] = React.useState(true);

  const SettingItem = ({ title, value, onValueChange, icon }) => (
    <View style={settingStyles.item}>
      <MaterialIcons name={icon} size={24} color="#8b5cf6" style={{ marginRight: 10 }} />
      <Text style={settingStyles.title}>{title}</Text>
      <Switch
        onValueChange={onValueChange}
        value={value}
        trackColor={{ false: '#767577', true: '#10b981' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <SettingItem
            title="Maintenance Mode"
            icon="construction"
            value={maintenanceMode}
            onValueChange={() => setMaintenanceMode(prev => !prev)}
          />
          <SettingItem
            title="Admin Email Alerts"
            icon="email"
            value={emailAlerts}
            onValueChange={() => setEmailAlerts(prev => !prev)}
          />
          
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Database Management</Text>
          <TouchableOpacity 
            style={settingStyles.button} 
            onPress={() => alert('Confirm database backup.')}
          >
            <MaterialIcons name="backup" size={24} color="#ffffff" />
            <Text style={settingStyles.buttonText}>Initiate Database Backup</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[settingStyles.button, { backgroundColor: '#ef444450' }]} 
            onPress={() => alert('Confirm logs purge.')}
          >
            <MaterialIcons name="delete-sweep" size={24} color="#ef4444" />
            <Text style={[settingStyles.buttonText, { color: '#ef4444' }]}>Purge Old System Logs</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (Re-use styles from previous stubs)
  container: { flex: 1, backgroundColor: '#0a0a0b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    paddingLeft: 10,
  },
});

const settingStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f650',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});