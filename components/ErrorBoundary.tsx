import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SUPPORT_EMAIL } from '@/utils/links';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('=== ERROR BOUNDARY CAUGHT ERROR ===');
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Platform:', Platform.OS);
    console.error('===================================');

    this.setState({
      errorInfo: errorInfo.componentStack || 'No component stack available',
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleContactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=App%20Support`).catch(() => {
      // Mail client unavailable — silently ignore so we never crash the error screen.
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.emoji}>⚠️</Text>
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.subtitle}>
                An unexpected error occurred. Please try again.
              </Text>
            </View>

            <ScrollView style={styles.errorContainer} showsVerticalScrollIndicator={true}>
              {!__DEV__ && (
                <Text style={styles.prodMessage}>
                  We&apos;re sorry for the inconvenience. You can try again, and if the
                  problem continues, please contact our support team.
                </Text>
              )}

              {__DEV__ && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Error Message:</Text>
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{this.state.error.message}</Text>
                  </View>
                </View>
              )}

              {__DEV__ && this.state.error.stack && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Stack Trace:</Text>
                  <View style={styles.errorBox}>
                    <Text style={styles.stackText}>{this.state.error.stack}</Text>
                  </View>
                </View>
              )}

              {__DEV__ && this.state.errorInfo && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Component Stack:</Text>
                  <View style={styles.errorBox}>
                    <Text style={styles.stackText}>{this.state.errorInfo}</Text>
                  </View>
                </View>
              )}

              {__DEV__ && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Platform Info:</Text>
                  <View style={styles.errorBox}>
                    <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
                    <Text style={styles.infoText}>Version: {Platform.Version}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={this.handleReload}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={this.handleContactSupport}>
              <Text style={styles.secondaryButtonText}>Contact Support</Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              If the problem continues, please contact our support team.
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#ef4444',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    lineHeight: 20,
  },
  stackText: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    lineHeight: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  prodMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
