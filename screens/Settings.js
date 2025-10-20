import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const Settings = ({ onBack }) => {
  const { user, userProfile, updateProfile, signOut, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user profile data when component mounts or userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfile({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        email: userProfile.email || user?.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        emergencyName: userProfile.emergency_contact || '',
        emergencyPhone: userProfile.emergency_phone || '',
      });
    }
  }, [userProfile, user]);

  const updateProfileField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes to save');
      return;
    }

    setLoading(true);

    const updates = {
      first_name: profile.firstName.trim(),
      last_name: profile.lastName.trim(),
      phone: profile.phone.trim(),
      address: profile.address.trim(),
      emergency_contact: profile.emergencyName.trim(),
      emergency_phone: profile.emergencyPhone.trim(),
    };

    const { error } = await updateProfile(updates);
    
    if (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } else {
      Alert.alert('Success', 'Profile updated successfully');
      setHasChanges(false);
    }
    
    setLoading(false);
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
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const InputField = ({ icon, label, value, onChangeText, editable = true, keyboardType = "default" }) => (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <MaterialIcons name={icon} size={20} color="#10b981" />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable && !loading}
        keyboardType={keyboardType}
        autoCapitalize="words"
      />
    </View>
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your profile</Text>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <InputField
            icon="email"
            label="Email"
            value={profile.email}
            editable={false}
          />
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <InputField
            icon="person"
            label="First Name"
            value={profile.firstName}
            onChangeText={(value) => updateProfileField('firstName', value)}
          />
          
          <InputField
            icon="person"
            label="Last Name"
            value={profile.lastName}
            onChangeText={(value) => updateProfileField('lastName', value)}
          />
          
          <InputField
            icon="phone"
            label="Phone"
            value={profile.phone}
            onChangeText={(value) => updateProfileField('phone', value)}
            keyboardType="phone-pad"
          />
          
          <InputField
            icon="location-on"
            label="Address"
            value={profile.address}
            onChangeText={(value) => updateProfileField('address', value)}
          />
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <InputField
            icon="contact-emergency"
            label="Name"
            value={profile.emergencyName}
            onChangeText={(value) => updateProfileField('emergencyName', value)}
          />
          
          <InputField
            icon="phone-in-talk"
            label="Phone"
            value={profile.emergencyPhone}
            onChangeText={(value) => updateProfileField('emergencyPhone', value)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.saveBtn, 
            (loading || !hasChanges) && styles.saveBtnDisabled
          ]} 
          onPress={handleSave}
          disabled={loading || !hasChanges}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={loading}
        >
          <MaterialIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    color: '#a1a1aa',
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 32,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  logo: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputDisabled: {
    color: '#6b7280',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveBtnDisabled: {
    backgroundColor: '#6b7280',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginBottom: 20,
  },
  signOutBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default Settings;