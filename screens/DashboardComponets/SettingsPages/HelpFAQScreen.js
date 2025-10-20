import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  StatusBar,
} from 'react-native';

const HelpFAQScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({});

  const faqCategories = [
    {
      id: 'getting-started',
      title: '🚀 Getting Started',
      items: [
        {
          question: 'How do I set up my first device?',
          answer: 'To add your first device:\n1. Tap the "+" button on the Home screen\n2. Select your device type from the list\n3. Follow the on-screen pairing instructions\n4. Name your device and assign it to a room\n5. Your device is now connected and ready to use!'
        },
        {
          question: 'What devices are compatible with HomeIQ?',
          answer: 'HomeIQ supports a wide range of smart home devices including:\n• Smart lights and switches\n• Thermostats and climate control\n• Security cameras and sensors\n• Smart plugs and outlets\n• Door locks and garage openers\n• Entertainment systems\n\nCheck our website for a complete compatibility list.'
        },
        {
          question: 'How do I create my first automation?',
          answer: 'Creating automations is simple:\n1. Go to the Automations tab\n2. Tap "Create Automation"\n3. Choose a trigger (time, device state, or sensor)\n4. Select the actions you want to happen\n5. Name your automation and save\n\nExample: "Turn on lights when I arrive home"'
        }
      ]
    },
    {
      id: 'device-management',
      title: '📱 Device Management',
      items: [
        {
          question: 'How do I remove a device?',
          answer: 'To remove a device:\n1. Go to the device details page\n2. Tap the three-dot menu in the top right\n3. Select "Remove Device"\n4. Confirm the removal\n\nNote: This will also remove the device from any automations or schedules.'
        },
        {
          question: 'Why is my device showing as offline?',
          answer: 'If a device appears offline, try these steps:\n1. Check your WiFi connection\n2. Ensure the device has power\n3. Move the device closer to your router\n4. Restart the device by unplugging for 10 seconds\n5. Check if the device needs a firmware update\n\nIf issues persist, contact our support team.'
        },
        {
          question: 'Can I control devices when away from home?',
          answer: 'Yes! HomeIQ allows full remote control from anywhere in the world. Simply ensure:\n• Your home WiFi is active\n• Your mobile device has internet access\n• Remote access is enabled in Settings\n\nAll communications are encrypted for security.'
        },
        {
          question: 'How do I share device access with family?',
          answer: 'To share access:\n1. Go to Settings > Family Sharing\n2. Tap "Invite Family Member"\n3. Enter their email address\n4. Set their permission level (Admin or User)\n5. They\'ll receive an invitation link\n\nFamily members can control shared devices from their own app.'
        }
      ]
    },
    {
      id: 'energy-monitoring',
      title: '⚡ Energy Monitoring',
      items: [
        {
          question: 'How accurate is the energy monitoring?',
          answer: 'HomeIQ provides real-time energy monitoring with 95-98% accuracy. Data is collected directly from smart plugs and compatible devices, updated every few seconds. Historical data helps you track patterns and reduce consumption.'
        },
        {
          question: 'How can I reduce my energy costs?',
          answer: 'HomeIQ offers several ways to save energy:\n• Set schedules to turn off devices when not needed\n• Use energy reports to identify power-hungry devices\n• Enable auto-optimization in Settings\n• Set up alerts for unusual consumption\n• Create automations for energy-saving scenarios\n\nMost users save 15-30% on their energy bills.'
        },
        {
          question: 'What do the energy threshold alerts mean?',
          answer: 'Energy threshold alerts notify you when consumption exceeds your set limit. This helps:\n• Prevent unexpected high bills\n• Identify malfunctioning devices\n• Track unusual usage patterns\n\nYou can customize the threshold in Settings > Energy Management.'
        }
      ]
    },
    {
      id: 'automations',
      title: '🤖 Automations & Schedules',
      items: [
        {
          question: 'What\'s the difference between schedules and automations?',
          answer: 'Schedules: Time-based actions that happen at specific times (e.g., "Turn on lights at 7 PM daily")\n\nAutomations: Trigger-based actions that respond to events (e.g., "Turn on lights when motion detected")\n\nBoth can be combined for powerful smart home experiences.'
        },
        {
          question: 'Can I create location-based automations?',
          answer: 'Yes! HomeIQ supports geofencing automations:\n• Actions when you arrive home\n• Actions when you leave home\n• Different actions for different family members\n\nEnable location services and set up geofences in the Automations tab.'
        },
        {
          question: 'How many automations can I create?',
          answer: 'Premium members can create unlimited automations. Free tier users can create up to 10 automations. Each automation can include multiple devices and conditions for complex scenarios.'
        }
      ]
    },
    {
      id: 'account-security',
      title: '🔐 Account & Security',
      items: [
        {
          question: 'How do I change my password?',
          answer: 'To change your password:\n1. Go to Settings > Account\n2. Tap "Change Password"\n3. Enter your current password\n4. Enter and confirm your new password\n5. Tap Save\n\nWe recommend using a strong, unique password.'
        },
        {
          question: 'Is my data secure?',
          answer: 'HomeIQ takes security seriously:\n• End-to-end encryption for all communications\n• Secure cloud storage with industry-standard protocols\n• Two-factor authentication available\n• Regular security audits\n• GDPR compliant data handling\n\nYour privacy and security are our top priorities.'
        },
        {
          question: 'Can I enable two-factor authentication?',
          answer: 'Yes! Two-factor authentication (2FA) adds an extra layer of security:\n1. Go to Settings > Security\n2. Enable "Two-Factor Authentication"\n3. Choose your preferred method (SMS or authenticator app)\n4. Follow the setup instructions\n\nWe highly recommend enabling 2FA for all accounts.'
        }
      ]
    },
    {
      id: 'billing',
      title: '💳 Billing & Subscription',
      items: [
        {
          question: 'What\'s included in the Premium subscription?',
          answer: 'Premium membership includes:\n• Unlimited devices and automations\n• Advanced energy analytics\n• Extended history (12 months vs 30 days)\n• Priority customer support\n• Family sharing for up to 6 members\n• Voice assistant integration\n• Early access to new features'
        },
        {
          question: 'How do I cancel my subscription?',
          answer: 'To cancel your subscription:\n1. Go to Settings > Subscription\n2. Tap "Manage Subscription"\n3. Select "Cancel Subscription"\n4. Choose a reason (optional)\n5. Confirm cancellation\n\nYou\'ll retain Premium access until the end of your billing period.'
        },
        {
          question: 'Can I get a refund?',
          answer: 'We offer a 30-day money-back guarantee for new Premium subscribers. If you\'re not satisfied, contact support within 30 days of purchase for a full refund. Refunds are processed within 5-7 business days.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: '🔧 Troubleshooting',
      items: [
        {
          question: 'The app is running slowly',
          answer: 'If you\'re experiencing performance issues:\n1. Close and restart the app\n2. Check your internet connection\n3. Clear the app cache (Settings > App Info)\n4. Ensure you have the latest app version\n5. Restart your mobile device\n\nIf issues persist, uninstall and reinstall the app.'
        },
        {
          question: 'I forgot my password',
          answer: 'To reset your password:\n1. On the login screen, tap "Forgot Password?"\n2. Enter your email address\n3. Check your email for a reset link\n4. Click the link and create a new password\n5. Log in with your new credentials\n\nIf you don\'t receive the email, check your spam folder.'
        },
        {
          question: 'Voice commands aren\'t working',
          answer: 'To fix voice command issues:\n1. Ensure voice assistant integration is enabled\n2. Check microphone permissions in phone settings\n3. Verify your wake word is configured correctly\n4. Re-link your HomeIQ account in the assistant app\n5. Make sure devices have proper names (avoid special characters)\n\nTry saying "Ask HomeIQ to turn on living room lights"'
        }
      ]
    }
  ];

  const quickActions = [
    {
      icon: '📧',
      title: 'Email Support',
      subtitle: 'support@homeiq.com',
      action: () => Linking.openURL('mailto:support@homeiq.com')
    },
    {
      icon: '💬',
      title: 'Live Chat',
      subtitle: 'Available 9 AM - 6 PM',
      action: () => Linking.openURL('https://homeiq.com/chat')
    },
    {
      icon: '📚',
      title: 'User Guide',
      subtitle: 'Complete documentation',
      action: () => Linking.openURL('https://homeiq.com/docs')
    },
    {
      icon: '🎥',
      title: 'Video Tutorials',
      subtitle: 'Step-by-step guides',
      action: () => Linking.openURL('https://youtube.com/@homeiq')
    }
  ];

  const toggleItem = (categoryId, itemIndex) => {
    const key = `${categoryId}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filterFAQs = () => {
    if (!searchQuery.trim()) return faqCategories;

    return faqCategories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.items.length > 0);
  };

  const filteredCategories = filterFAQs();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Help & FAQ</Text>
            <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              placeholderTextColor="#a1a1aa"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionCard}
                  onPress={action.action}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* FAQ Categories */}
          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            
            {filteredCategories.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsIcon}>🔍</Text>
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try different keywords or contact support
                </Text>
              </View>
            ) : (
              filteredCategories.map((category) => (
                <View key={category.id} style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  
                  {category.items.map((item, index) => {
                    const key = `${category.id}-${index}`;
                    const isExpanded = expandedItems[key];
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.faqItem}
                        onPress={() => toggleItem(category.id, index)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.faqQuestion}>
                          <Text style={styles.faqQuestionText}>{item.question}</Text>
                          <Text style={[
                            styles.faqArrow,
                            isExpanded && styles.faqArrowExpanded
                          ]}>
                            ›
                          </Text>
                        </View>
                        
                        {isExpanded && (
                          <View style={styles.faqAnswer}>
                            <Text style={styles.faqAnswerText}>{item.answer}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </View>

          {/* Contact Support Card */}
          <View style={styles.supportCard}>
            <Text style={styles.supportCardTitle}>Still need help?</Text>
            <Text style={styles.supportCardText}>
              Our support team is here to help you 24/7
            </Text>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => Linking.openURL('mailto:support@homeiq.com')}
            >
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </View>
    </>
  );
};
// Update the styles in HelpFAQScreen.js to match Dashboard.js

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  header: {
    backgroundColor: '#0a0a0b',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
  headerContent: {
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a1a1aa',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#a1a1aa',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    fontSize: 20,
    color: '#a1a1aa',
    paddingLeft: 12,
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: '#a1a1aa',
    textAlign: 'center',
  },
  faqSection: {
    marginBottom: 24,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 12,
  },
  faqArrow: {
    fontSize: 24,
    color: '#a1a1aa',
    fontWeight: '300',
    transform: [{ rotate: '90deg' }],
  },
  faqArrowExpanded: {
    transform: [{ rotate: '270deg' }],
    color: '#10b981',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 22,
  },
  noResults: {
    alignItems: 'center',
    padding: 48,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: '#a1a1aa',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
  },
  supportCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  supportCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  supportCardText: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 20,
  },
  supportButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  supportButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    height: 40,
  },
});

export default HelpFAQScreen;