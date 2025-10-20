// FILE: ManageDevicesScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ManageDevicesScreen() {
  // Access to supabase and auth context is available if needed
  const { supabase } = useAuth(); 
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Devices</Text>
        <TouchableOpacity onPress={() => alert('Add Device Action')}>
          <MaterialIcons name="add" size={24} color="#10b981" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <MaterialIcons name="devices" size={60} color="#3b82f6" style={styles.icon} />
        <Text style={styles.title}>Device Management</Text>
        <Text style={styles.subtitle}>
          List of all registered appliances and their current status (e.g., 'on' or 'off')
          would be displayed here, based on the 'appliances' table.
        </Text>
        <Text style={styles.placeholderText}>
          A list or grid of devices with options to view/edit settings, status, and usage.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#f59e0b',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b50',
    padding: 10,
    borderRadius: 8,
  }
});