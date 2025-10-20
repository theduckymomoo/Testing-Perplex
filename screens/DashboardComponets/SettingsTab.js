// SettingsTab.js - Redesigned to match LoginScreen styling
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
  StatusBar,
  Vibration,
  Share,
  Linking,
  StyleSheet,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';

// ===== Config =====
const APP_NAME = 'HomeIQ';
const SUPPORT_EMAIL = 'support@homeiq.app';
const PRIVACY_URL = 'https://example.com/privacy';
const TERMS_URL = 'https://example.com/terms';
const HELP_URL = 'https://example.com/help';
const APP_STORE_ID = '';
const PLAY_STORE_PACKAGE_NAME = '';
// ==================

// ---------- Helpers ----------
const star = (filled) => (
  <MaterialIcons name={filled ? 'star' : 'star-border'} size={28} color="#f59e0b" />
);

const openStoreReviewPage = async () => {
  const iosUrl = APP_STORE_ID ? `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review` : null;
  const androidMarket = PLAY_STORE_PACKAGE_NAME ? `market://details?id=${PLAY_STORE_PACKAGE_NAME}` : null;
  const androidWeb = PLAY_STORE_PACKAGE_NAME ? `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_NAME}` : null;
  const fallback = `https://www.google.com/search?q=${encodeURIComponent(APP_NAME + ' app')}`;

  const target = Platform.OS === 'ios' ? (iosUrl ?? fallback) : (androidMarket ?? androidWeb ?? fallback);
  try {
    await Linking.openURL(target);
  } catch {
    await Linking.openURL(fallback);
  }
};

const mailto = (to, subject, body) =>
  Linking.openURL(
    `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  );

// ---------- UI Components ----------
const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SettingRow = ({ icon, title, subtitle, right, onPress, danger, border = true }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={[
      styles.row,
      border && styles.rowBorder,
      danger && styles.rowDanger,
    ]}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>
        <MaterialIcons name={icon} size={20} color={danger ? '#ef4444' : '#10b981'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    <View style={styles.rowRight}>
      {right ?? <MaterialIcons name="chevron-right" size={24} color="#6b7280" />}
    </View>
  </TouchableOpacity>
);

// ========== Main Component ==========
const SettingsTab = () => {
  const { user, userProfile, supabase, updateProfile, signOut, getUserSettings, upsertUserSettings } = useAuth();

  // ------- UI state -------
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [emailPrefsVisible, setEmailPrefsVisible] = useState(false);
  const [energyModalVisible, setEnergyModalVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [rateVisible, setRateVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Profile edits
  const [editProfile, setEditProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Settings (persisted)
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [energyAlerts, setEnergyAlerts] = useState(true);
  const [energyThreshold, setEnergyThreshold] = useState('300');
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [currency, setCurrency] = useState('ZAR');
  const [language, setLanguage] = useState('English');
  const [emailMarketing, setEmailMarketing] = useState(true);
  const [emailProduct, setEmailProduct] = useState(true);

  const version = useMemo(() => Constants.expoConfig?.version ?? '1.0.0', []);

  // Haptic helper
  const tick = () => {
    if (haptics) Vibration.vibrate(50);
  };

  // ---------- Load user + settings ----------
  const hydrateProfile = useCallback(() => {
    if (!userProfile) return;
    setEditProfile({
      firstName: userProfile.first_name || '',
      lastName: userProfile.last_name || '',
      phone: userProfile.phone || '',
    });
  }, [userProfile]);

  const loadUserSettings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingSettings(true);
      const settings = await getUserSettings();
      
      if (settings) {
        setDarkMode(!!settings.dark_mode);
        setNotifications(!!settings.notifications);
        setHaptics(!!settings.haptic_feedback);
        setEnergyAlerts(!!settings.energy_alerts);
        setEnergyThreshold(String(settings.energy_threshold ?? '300'));
        setAutoOptimize(!!settings.auto_optimization);
        setWeeklyReports(!!settings.weekly_reports);
        setCurrency(settings.currency ?? 'ZAR');
        setLanguage(settings.language ?? 'English');
        setEmailMarketing(!!settings.email_marketing);
        setEmailProduct(!!settings.email_product);
      }
    } catch (e) {
      console.warn('loadUserSettings error:', e.message);
      try {
        const cached = await AsyncStorage.getItem('@settings');
        if (cached) {
          const s = JSON.parse(cached);
          setDarkMode(!!s.darkMode);
          setNotifications(!!s.notifications);
          setHaptics(!!s.haptics);
          setEnergyAlerts(!!s.energyAlerts);
          setEnergyThreshold(String(s.energyThreshold ?? '300'));
          setAutoOptimize(!!s.autoOptimize);
          setWeeklyReports(!!s.weeklyReports);
          setCurrency(s.currency ?? 'ZAR');
          setLanguage(s.language ?? 'English');
          setEmailMarketing(!!s.emailMarketing);
          setEmailProduct(!!s.emailProduct);
        }
      } catch (cacheError) {
        console.warn('Cache fallback failed:', cacheError.message);
      }
    } finally {
      setLoadingSettings(false);
    }
  }, [user?.id, getUserSettings]);

  useEffect(() => {
    hydrateProfile();
  }, [hydrateProfile]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  // Cache to AsyncStorage on any change (as backup)
  useEffect(() => {
    const s = {
      darkMode, notifications, haptics,
      energyAlerts, energyThreshold, autoOptimize, weeklyReports,
      currency, language, emailMarketing, emailProduct,
    };
    AsyncStorage.setItem('@settings', JSON.stringify(s)).catch(() => {});
  }, [darkMode, notifications, haptics, energyAlerts, energyThreshold, autoOptimize, weeklyReports, currency, language, emailMarketing, emailProduct]);

  // ---------- Persistence ----------
  const saveSetting = useCallback(
    async (patch) => {
      if (!user?.id) return;
      
      try {
        await upsertUserSettings(patch);
      } catch (e) {
        Alert.alert('Save failed', e.message || 'Could not save setting.');
      }
    },
    [user?.id, upsertUserSettings]
  );

  // Handle dark mode toggle
  const handleDarkModeToggle = (value) => {
    tick();
    setDarkMode(value);
    saveSetting({ dark_mode: value });
  };

  // ---------- Actions ----------
  const handleSaveProfile = async () => {
    if (saving) return;
    const errs = [];
    if (!editProfile.firstName.trim()) errs.push('First name is required.');
    if (!editProfile.lastName.trim()) errs.push('Last name is required.');
    if (editProfile.phone && !/^[0-9+\-() ]{6,}$/.test(editProfile.phone.trim())) errs.push('Phone looks invalid.');
    if (errs.length) return Alert.alert('Please fix', errs.join('\n'));

    setSaving(true);
    try {
      const { error } = await updateProfile({
        first_name: editProfile.firstName.trim(),
        last_name: editProfile.lastName.trim(),
        phone: editProfile.phone.trim(),
      });
      if (error) throw error;
      setProfileModalVisible(false);
      Alert.alert('Success', 'Profile updated.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (current, next, confirm) => {
    if (!next || next.length < 8) return Alert.alert('Invalid', 'New password must be at least 8 characters.');
    if (next !== confirm) return Alert.alert('Invalid', 'Passwords do not match.');

    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      setPwdModalVisible(false);
      Alert.alert('Password changed', 'Use your new password next sign-in.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not change password.');
    }
  };

  const handleExportData = useCallback(async () => {
    try {
      const rows = [];
      if (user?.id) {
        const { data: p } = await supabase.from('profiles').select('first_name,last_name,phone').eq('id', user.id).maybeSingle();
        if (p) rows.push(['First Name', 'Last Name', 'Phone'], [p.first_name ?? '', p.last_name ?? '', p.phone ?? ''], ['','','']);
      }
      const { data: appliances } = await supabase.from('appliances').select('*').eq('user_id', user?.id);
      if (appliances?.length) {
        rows.push(['Name', 'Type', 'Room', 'Usage', 'Status']);
        appliances.forEach(a => rows.push([a.name, a.type, a.room, a.usage ?? '', a.status ?? '']));
      }
      try {
        const { data: usage } = await supabase.from('energy_usage').select('*').eq('user_id', user?.id);
        if (usage?.length) {
          rows.push(['','',''], ['Date', 'kWh', 'Cost']);
          usage.forEach(u => rows.push([u.date ?? '', u.kwh ?? '', u.cost ?? '']));
        }
      } catch {}

      const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      await Share.share({ title: `${APP_NAME} Export`, message: csv });
    } catch (e) {
      Alert.alert('Error', 'Failed to export data.');
    }
  }, [user?.id, supabase]);

  const handleBackup = useCallback(async () => {
    try {
      const snapshot = {
        at: new Date().toISOString(),
        profile: editProfile,
        settings: {
          darkMode, notifications, haptics, energyAlerts, energyThreshold, autoOptimize, weeklyReports, currency, language, emailMarketing, emailProduct,
        },
      };
      await Share.share({ title: `${APP_NAME} Backup`, message: JSON.stringify(snapshot, null, 2) });
    } catch {
      Alert.alert('Error', 'Failed to create backup.');
    }
  }, [editProfile, darkMode, notifications, haptics, energyAlerts, energyThreshold, autoOptimize, weeklyReports, currency, language, emailMarketing, emailProduct]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This removes your profile and settings. You will be signed out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) return;
              await supabase.from('appliances').delete().eq('user_id', user.id);
              await supabase.from('energy_usage').delete().eq('user_id', user.id);
              await supabase.from('user_settings').delete().eq('id', user.id);
              await supabase.from('profiles').delete().eq('id', user.id);
              await signOut();
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete account data.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [user?.id, supabase, signOut]);

  const handleRateSubmit = async (rating, feedback) => {
    if (rating >= 4) {
      await openStoreReviewPage();
    } else {
      await mailto(
        SUPPORT_EMAIL,
        `${APP_NAME} Feedback (${rating}★)`,
        `${feedback || ''}\n\nDevice: ${Platform.OS} ${Platform.Version}`
      );
    }
    setRateVisible(false);
  };

  // Show loading state
  if (loadingSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Render ----------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        howsVerticalScrollIndicator={false}
        directionalLockEnabled={true}
        scrollEventThrottle={16}
        nestedScrollEnabled={false}
        bounces={true}
        alwaysBounceHorizontal={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}` : user?.email || 'Manage your preferences'}
          </Text>
        </View>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={styles.section}>
          <SettingRow
            icon="person"
            title="Edit Profile"
            subtitle={`${userProfile?.first_name ?? ''} ${userProfile?.last_name ?? ''}`}
            onPress={() => setProfileModalVisible(true)}
          />
          <SettingRow
            icon="lock"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => setPwdModalVisible(true)}
            border={false}
          />
        </View>

        {/* Email Preferences */}
        <SectionHeader title="Email Preferences" />
        <View style={styles.section}>
          <SettingRow
            icon="mail"
            title="Manage email subscriptions"
            subtitle="Marketing & product updates"
            onPress={() => setEmailPrefsVisible(true)}
            border={false}
          />
        </View>

        {/* App Preferences */}
        <SectionHeader title="App Preferences" />
        <View style={styles.section}>
          <SettingRow
            icon="dark-mode"
            title="Dark Mode"
            subtitle={darkMode ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#3f3f46', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3f3f46"
              />
            }
          />
          <SettingRow
            icon="notifications"
            title="Notifications"
            subtitle={notifications ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={notifications}
                onValueChange={(v) => { tick(); setNotifications(v); saveSetting({ notifications: v }); }}
                trackColor={{ false: '#3f3f46', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3f3f46"
              />
            }
          />
          <SettingRow
            icon="vibration"
            title="Haptic Feedback"
            subtitle={haptics ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={haptics}
                onValueChange={(v) => { setHaptics(v); saveSetting({ haptic_feedback: v }); }}
                trackColor={{ false: '#3f3f46', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3f3f46"
              />
            }
            border={false}
          />
        </View>

        {/* Energy */}
        <SectionHeader title="Energy Management" />
        <View style={styles.section}>
          <SettingRow
            icon="bolt"
            title="Energy Alerts"
            subtitle={energyAlerts ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={energyAlerts}
                onValueChange={(v) => { tick(); setEnergyAlerts(v); saveSetting({ energy_alerts: v }); }}
                trackColor={{ false: '#3f3f46', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3f3f46"
              />
            }
          />
          <SettingRow
            icon="trending-up"
            title="Energy Threshold"
            subtitle={`${energyThreshold} kWh`}
            onPress={() => setEnergyModalVisible(true)}
          />
          <SettingRow
            icon="auto-awesome"
            title="Auto-Optimization"
            subtitle={autoOptimize ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={autoOptimize}
                onValueChange={(v) => { tick(); setAutoOptimize(v); saveSetting({ auto_optimization: v }); }}
                trackColor={{ false: '#3f3f46', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3f3f46"
              />
            }
          />
          <SettingRow
            icon="assessment"
            title="Weekly Reports"
            subtitle={weeklyReports ? 'Subscribed' : 'Unsubscribed'}
            right={
              <Switch
                value={weeklyReports}
                onValueChange={(v) => { tick(); setWeeklyReports(v); saveSetting({ weekly_reports: v }); }}
                trackColor={{ false: '#3f3f46', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3f3f46"
              />
            }
            border={false}
          />
        </View>

        {/* Locale */}
        <SectionHeader title="Locale" />
        <View style={styles.section}>
          <SettingRow
            icon="attach-money"
            title="Currency"
            subtitle={currency}
            onPress={() => {
              const options = ['ZAR', 'USD', 'EUR', 'GBP'];
              Alert.alert('Currency', 'Choose display currency', [
                ...options.map(c => ({ text: c, onPress: () => { setCurrency(c); saveSetting({ currency: c }); } })),
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
          <SettingRow
            icon="language"
            title="Language"
            subtitle={language}
            onPress={() => {
              const opts = ['English', 'Afrikaans', 'Xhosa', 'Zulu'];
              Alert.alert('Language', 'Choose app language', [
                ...opts.map(l => ({ text: l, onPress: () => { setLanguage(l); saveSetting({ language: l }); } })),
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            border={false}
          />
        </View>

        {/* Data & Privacy */}
        <SectionHeader title="Data & Privacy" />
        <View style={styles.section}>
          <SettingRow icon="backup" title="Backup Data" subtitle="Create a portable backup" onPress={handleBackup} />
          <SettingRow icon="file-download" title="Export Data" subtitle="Download your data (CSV)" onPress={handleExportData} />
          <SettingRow icon="privacy-tip" title="Privacy Policy" subtitle="Read our privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <SettingRow icon="article" title="Terms of Service" subtitle="Review our terms" onPress={() => Linking.openURL(TERMS_URL)} border={false} />
        </View>

        {/* Support & About */}
        <SectionHeader title="Support & About" />
        <View style={styles.section}>
          <SettingRow
            icon="help"
            title="Help & FAQ"
            subtitle="Find answers to common questions"
            onPress={() => Linking.openURL(HELP_URL)}
          />
          <SettingRow
            icon="phone"
            title="Contact Support"
            subtitle={SUPPORT_EMAIL}
            onPress={() => mailto(SUPPORT_EMAIL, `${APP_NAME} Support`, '')}
          />
          <SettingRow
            icon="star"
            title="Rate App"
            subtitle="Rate us on the app store"
            onPress={() => setRateVisible(true)}
          />
          <SettingRow
            icon="info"
            title="About"
            subtitle={`Version ${version}`}
            onPress={() => setAboutVisible(true)}
            border={false}
          />
        </View>

        {/* Account Actions */}
        <SectionHeader title="Account Actions" />
        <View style={styles.section}>
          <SettingRow
            icon="logout"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={() => {
              Alert.alert('Sign Out', 'Do you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => signOut().catch(() => Alert.alert('Error', 'Failed to sign out.')) },
              ]);
            }}
          />
          <SettingRow
            icon="delete-forever"
            title="Delete Account"
            subtitle="Permanently delete your account data"
            onPress={handleDeleteAccount}
            danger
            border={false}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* -------- Modals -------- */}

      {/* Edit Profile */}
      <Modal visible={profileModalVisible} animationType="slide" transparent onRequestClose={() => setProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  placeholder="Enter first name"
                  placeholderTextColor="#6b7280"
                  value={editProfile.firstName}
                  onChangeText={(v) => setEditProfile(s => ({ ...s, firstName: v }))}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  placeholder="Enter last name"
                  placeholderTextColor="#6b7280"
                  value={editProfile.lastName}
                  onChangeText={(v) => setEditProfile(s => ({ ...s, lastName: v }))}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  placeholder="Enter phone number"
                  placeholderTextColor="#6b7280"
                  value={editProfile.phone}
                  onChangeText={(v) => setEditProfile(s => ({ ...s, phone: v }))}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setProfileModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password */}
      <ChangePasswordModal
        visible={pwdModalVisible}
        onClose={() => setPwdModalVisible(false)}
        onSubmit={handleChangePassword}
      />

      {/* Email Preferences */}
      <EmailPrefsModal
        visible={emailPrefsVisible}
        marketing={emailMarketing}
        product={emailProduct}
        onClose={() => setEmailPrefsVisible(false)}
        onChange={(m, p) => {
          setEmailMarketing(m);
          setEmailProduct(p);
          saveSetting({ email_marketing: m, email_product: p });
        }}
      />

      {/* Energy Threshold */}
      <Modal visible={energyModalVisible} animationType="fade" transparent onRequestClose={() => setEnergyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Energy Threshold</Text>
              <TouchableOpacity onPress={() => setEnergyModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Set alert threshold (kWh)</Text>
              <TextInput
                value={energyThreshold}
                onChangeText={(v) => setEnergyThreshold(v.replace(/[^\d.]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#6b7280"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setEnergyModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => { saveSetting({ energy_threshold: Number(energyThreshold || 0) }); setEnergyModalVisible(false); }}
              >
                <Text style={styles.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* About */}
      <Modal visible={aboutVisible} animationType="fade" transparent onRequestClose={() => setAboutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About {APP_NAME}</Text>
              <TouchableOpacity onPress={() => setAboutVisible(false)}>
                <MaterialIcons name="close" size={24} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Version {version}</Text>
              <Text style={styles.aboutText}>
                {APP_NAME} helps you monitor and optimize home energy usage with smart insights and automation.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => setAboutVisible(false)}>
                <Text style={styles.btnPrimaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rate App */}
      <RateAppModal
        visible={rateVisible}
        onClose={() => setRateVisible(false)}
        onSubmit={handleRateSubmit}
      />
    </SafeAreaView>
  );
};

// --------- Change Password Modal ----------
const ChangePasswordModal = ({ visible, onClose, onSubmit }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!visible) { setCurrent(''); setNext(''); setConfirm(''); }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  placeholder="Enter current password"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showCurrent}
                  style={[styles.input, styles.passwordInput]}
                  value={current}
                  onChangeText={setCurrent}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowCurrent(!showCurrent)}
                >
                  <MaterialIcons 
                    name={showCurrent ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#a1a1aa" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>New Password (min 8)</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  placeholder="Enter new password"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showNext}
                  style={[styles.input, styles.passwordInput]}
                  value={next}
                  onChangeText={setNext}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowNext(!showNext)}
                >
                  <MaterialIcons 
                    name={showNext ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#a1a1aa" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  placeholder="Confirm new password"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showConfirm}
                  style={[styles.input, styles.passwordInput]}
                  value={confirm}
                  onChangeText={setConfirm}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <MaterialIcons 
                    name={showConfirm ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#a1a1aa" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => onSubmit(current, next, confirm)}>
              <Text style={styles.btnPrimaryText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --------- Email Prefs Modal ----------
const EmailPrefsModal = ({ visible, marketing, product, onClose, onChange }) => {
  const [m, setM] = useState(marketing);
  const [p, setP] = useState(product);

  useEffect(() => {
    setM(marketing); setP(product);
  }, [marketing, product, visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Email Preferences</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.switchRow}>
              <View style={styles.switchRowLeft}>
                <MaterialIcons name="campaign" size={20} color="#10b981" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.switchRowTitle}>Marketing emails</Text>
                  <Text style={styles.switchRowSubtitle}>{m ? 'Subscribed' : 'Unsubscribed'}</Text>
                </View>
              </View>
              <Switch 
                value={m} 
                onValueChange={(v) => setM(v)}
                trackColor={{ false: '#3f3f46', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3f3f46"
              />
            </View>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View style={styles.switchRowLeft}>
                <MaterialIcons name="construction" size={20} color="#10b981" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.switchRowTitle}>Product updates</Text>
                  <Text style={styles.switchRowSubtitle}>{p ? 'Subscribed' : 'Unsubscribed'}</Text>
                </View>
              </View>
              <Switch 
                value={p} 
                onValueChange={(v) => setP(v)}
                trackColor={{ false: '#3f3f46', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3f3f46"
              />
            </View>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => { onChange(m, p); onClose(); }}
            >
              <Text style={styles.btnPrimaryText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --------- Rate App Modal ----------
const RateAppModal = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!visible) { setRating(0); setFeedback(''); }
  }, [visible]);

  const cta = rating >= 4 ? 'Rate on Store' : 'Send Feedback';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enjoying {APP_NAME}?</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalSubtitle}>Tap to rate</Text>
            <View style={styles.stars}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)} style={{ padding: 4 }}>
                  {star(rating >= i)}
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder={rating >= 4 ? 'Anything we should highlight?' : 'Tell us what to improve...'}
              placeholderTextColor="#6b7280"
              style={[styles.input, styles.textArea]}
              multiline
              maxLength={800}
              value={feedback}
              onChangeText={setFeedback}
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
              <Text style={styles.btnSecondaryText}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, rating === 0 && styles.btnDisabled]}
              onPress={() => onSubmit(rating, feedback)}
              disabled={rating === 0}
            >
              <Text style={styles.btnPrimaryText}>{rating === 0 ? 'Pick stars' : cta}</Text>
            </TouchableOpacity>
          </View>
          {rating >= 4 && (!APP_STORE_ID || !PLAY_STORE_PACKAGE_NAME) ? (
            <Text style={styles.hintText}>
              Tip: set APP_STORE_ID (iOS) and PLAY_STORE_PACKAGE_NAME (Android) for direct review links.
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

export default SettingsTab;

// ---------- Styles ----------
const styles = StyleSheet.create({
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
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a1a1aa',
  },
  sectionHeader: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 24,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowDanger: {
    borderBottomColor: 'rgba(239, 68, 68, 0.2)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  rowTitleDanger: {
    color: '#ef4444',
  },
  rowSubtitle: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 2,
  },
  rowRight: {
    marginLeft: 12,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Input styles
  inputField: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '600',
    marginBottom: 8,
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
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  
  // Button styles
  btnPrimary: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  
  // Switch row styles
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  switchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchRowTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  switchRowSubtitle: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 2,
  },
  
  // Star rating
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 4,
  },
  
  // Other
  aboutText: {
    color: '#e5e7eb',
    fontSize: 15,
    lineHeight: 22,
  },
  hintText: {
    color: '#a1a1aa',
    fontSize: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    fontStyle: 'italic',
  },
});