import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const GuideScreen = ({ navigation }) => {
  const { colors, shadows } = useTheme();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const guideContent = [
    {
      id: 'quick-start',
      title: '🚀 Quick Start',
      icon: 'rocket',
      color: colors.accent1,
      content: [
        {
          title: '1. Setup Your Wallet',
          steps: [
            'Install Petra Wallet browser extension',
            'Create wallet & save seed phrase',
            'Switch to Aptos Devnet',
          ],
        },
        {
          title: '2. Connect to AptPay',
          steps: [
            'Open AptPay app',
            'Click "Connect Wallet"',
            'Select Petra/Martian',
            'Approve connection',
          ],
        },
        {
          title: '3. Get Test Tokens',
          steps: [
            'Click "Request Faucet"',
            'Wait 10-30 seconds',
            'Receive 1 APT',
          ],
        },
      ],
    },
    {
      id: 'wallet',
      title: '💼 Wallet Features',
      icon: 'wallet',
      color: colors.accent5,
      content: [
        {
          title: 'Send Tokens',
          steps: [
            'Go to Home → Quick Access → Send',
            'Enter recipient address',
            'Enter amount to send',
            'Review and confirm',
          ],
        },
        {
          title: 'Receive Tokens',
          steps: [
            'Go to Home → Quick Access → Receive',
            'Show QR code or copy address',
            'Share with sender',
          ],
        },
        {
          title: 'View History',
          steps: [
            'Go to Home → Quick Access → History',
            'View all transactions',
            'Click for details',
          ],
        },
      ],
    },
    {
      id: 'trading',
      title: '📈 Trading',
      icon: 'trending-up',
      color: colors.accent3,
      content: [
        {
          title: 'Open Leveraged Position',
          steps: [
            'Go to Trading Tab',
            'Select trading pair',
            'Choose Long or Short',
            'Set leverage (1x-1000x)',
            'Enter amount',
            'Click Execute',
          ],
        },
        {
          title: 'Place Market Order',
          steps: [
            'Go to KanaTrade Tab',
            'Select Market Orders',
            'Choose trading pair',
            'Enter amount',
            'Click Buy/Sell',
          ],
        },
        {
          title: 'Place Limit Order',
          steps: [
            'Go to KanaTrade Tab',
            'Select Limit Orders',
            'Set your price',
            'Enter amount',
            'Submit order',
          ],
        },
      ],
    },
    {
      id: 'amm',
      title: '💧 AMM & Liquidity',
      icon: 'water',
      color: colors.accent4,
      content: [
        {
          title: 'Swap Tokens',
          steps: [
            'Go to AMM Tab',
            'Select Swap',
            'Choose From/To tokens',
            'Enter amount',
            'Review rate',
            'Confirm swap',
          ],
        },
        {
          title: 'Add Liquidity',
          steps: [
            'Go to AMM Tab',
            'Select Liquidity',
            'Choose token pair',
            'Enter amounts',
            'Review pool share',
            'Add liquidity',
          ],
        },
        {
          title: 'View Pools',
          steps: [
            'Go to AMM Tab',
            'Select Pools',
            'Browse available pools',
            'Compare APRs',
            'Check TVL and volume',
          ],
        },
      ],
    },
    {
      id: 'hedging',
      title: '🛡️ Risk Management',
      icon: 'shield-checkmark',
      color: colors.secondary,
      content: [
        {
          title: 'Set Up Hedge',
          steps: [
            'Go to Hedging Tab',
            'Choose strategy:',
            '  • Delta Neutral',
            '  • Protective Puts',
            '  • Covered Calls',
            '  • Iron Condors',
            'Configure parameters',
            'Execute hedge',
          ],
        },
        {
          title: 'Monitor Portfolio',
          steps: [
            'View risk metrics',
            'Check hedge effectiveness',
            'Adjust positions as needed',
          ],
        },
      ],
    },
    {
      id: 'theme',
      title: '🎨 Dark/Light Mode',
      icon: 'moon',
      color: colors.primary,
      content: [
        {
          title: 'Toggle Theme',
          steps: [
            'Look at Home Screen header',
            'Click moon/sun icon (top right)',
            'Theme switches instantly',
            'Preference auto-saved',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: '💡 Pro Tips',
      icon: 'bulb',
      color: colors.warning,
      content: [
        {
          title: 'Trading Tips',
          steps: [
            '✅ Start with low leverage (2x-5x)',
            '✅ Always set stop-losses',
            '✅ Monitor liquidation prices',
            '✅ Use limit orders for better prices',
            '✅ Check market depth before large trades',
          ],
        },
        {
          title: 'Security Tips',
          steps: [
            '✅ Verify addresses before sending',
            '✅ Start with small test amounts',
            '✅ Keep wallet extension updated',
            '✅ Never share private keys',
            '✅ Double-check transaction details',
          ],
        },
        {
          title: 'Liquidity Tips',
          steps: [
            '✅ Choose high-volume pairs',
            '✅ Monitor impermanent loss',
            '✅ Compare pool APRs',
            '✅ Compound your earnings',
            '✅ Start with stable pairs',
          ],
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: '🆘 Troubleshooting',
      icon: 'help-circle',
      color: colors.red,
      content: [
        {
          title: "Wallet Won't Connect?",
          steps: [
            '1. Check wallet extension installed',
            '2. Switch to Aptos Devnet',
            '3. Refresh page',
            '4. Try different wallet',
          ],
        },
        {
          title: 'Transaction Failed?',
          steps: [
            '1. Check balance sufficient',
            '2. Verify address format',
            '3. Ensure gas fee covered',
            '4. Check network status',
          ],
        },
        {
          title: 'Balance Not Updating?',
          steps: [
            '1. Pull down to refresh',
            '2. Reconnect wallet',
            '3. Check transaction status',
            '4. Wait for confirmation',
          ],
        },
      ],
    },
  ];

  const externalLinks = [
    {
      title: 'Complete Documentation',
      icon: 'document-text',
      links: [
        { name: 'Features Guide', url: 'https://github.com/yourrepo/FEATURES.md' },
        { name: 'User Guide', url: 'https://github.com/yourrepo/USER_GUIDE.md' },
        { name: 'Technical Docs', url: 'https://github.com/yourrepo/TECHNICAL_DOCS.md' },
      ],
    },
    {
      title: 'External Resources',
      icon: 'link',
      links: [
        { name: 'Aptos Documentation', url: 'https://aptos.dev' },
        { name: 'Petra Wallet', url: 'https://petra.app' },
        { name: 'Aptos Explorer', url: 'https://explorer.aptoslabs.com' },
      ],
    },
  ];

  const openURL = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../logo/aptpay_logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>User Guide</Text>
            <Text style={styles.headerSubtitle}>Learn how to use AptPay</Text>
          </View>
        </View>
      </View>

      {/* Guide Sections */}
      <View style={styles.content}>
        {guideContent.map((section) => (
          <View key={section.id} style={styles.sectionWrapper}>
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                { backgroundColor: colors.surface, ...shadows.sm },
              ]}
              onPress={() => toggleSection(section.id)}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.iconCircle, { backgroundColor: section.color + '20' }]}>
                  <Ionicons name={section.icon} size={24} color={section.color} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
              </View>
              <Ionicons
                name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {expandedSection === section.id && (
              <View style={[styles.sectionContent, { backgroundColor: colors.surface, ...shadows.sm }]}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.contentItem}>
                    <Text style={[styles.contentTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    {item.steps.map((step, stepIndex) => (
                      <View key={stepIndex} style={styles.stepRow}>
                        <Text style={[styles.stepBullet, { color: section.color }]}>•</Text>
                        <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* External Links */}
        <View style={styles.linksSection}>
          <Text style={[styles.linksSectionTitle, { color: colors.text }]}>
            Additional Resources
          </Text>

          {externalLinks.map((linkGroup, index) => (
            <View key={index} style={[styles.linkGroup, { backgroundColor: colors.surface, ...shadows.sm }]}>
              <View style={styles.linkGroupHeader}>
                <Ionicons name={linkGroup.icon} size={20} color={colors.primary} />
                <Text style={[styles.linkGroupTitle, { color: colors.text }]}>
                  {linkGroup.title}
                </Text>
              </View>
              {linkGroup.links.map((link, linkIndex) => (
                <TouchableOpacity
                  key={linkIndex}
                  style={[styles.linkButton, { borderTopColor: colors.border }]}
                  onPress={() => openURL(link.url)}
                >
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    {link.name}
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Need more help? Pull down to refresh this guide.
          </Text>
          <Text style={[styles.footerVersion, { color: colors.textSecondary }]}>
            Version 1.0.0 • Aptos Devnet
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  sectionWrapper: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
  },
  contentItem: {
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  stepBullet: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  linksSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  linksSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  linkGroup: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  linkGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerVersion: {
    fontSize: 12,
  },
});

export default GuideScreen;

