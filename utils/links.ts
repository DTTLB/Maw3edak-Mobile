import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * Public, login-free legal / support links.
 * Apple requires the Privacy Policy to be reachable from inside the app
 * (Settings) and as a public URL on App Store Connect.
 */
export const PRIVACY_POLICY_URL = 'https://www.maw3edak.com/privacy';
export const TERMS_URL = 'https://www.maw3edak.com/terms';
export const SUPPORT_EMAIL = 'support@maw3edak.com';

/** Support phone numbers — `display` for the UI, `tel` for the dial link. */
export const SUPPORT_PHONES: { display: string; tel: string }[] = [
  { display: '+961 70 938 995', tel: '+96170938995' },
  { display: '+961 70 909 983', tel: '+96170909983' },
];

interface OpenUrlMessages {
  /** Title shown if the link cannot be opened. */
  errorTitle: string;
  /** Body shown if the link cannot be opened. */
  errorMessage: string;
}

/**
 * Open an external URL safely.
 *
 * Prefers the in-app browser (expo-web-browser / SFSafariViewController on iOS,
 * Custom Tabs on Android) since the project already depends on expo-web-browser,
 * and falls back to the system browser. Never throws — on failure it shows a
 * friendly localized alert instead of crashing or surfacing a developer error.
 */
export async function openExternalUrl(
  url: string,
  messages: OpenUrlMessages
): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
    return;
  } catch {
    // In-app browser unavailable — fall back to the system browser.
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // Fall through to the friendly error below.
  }

  Alert.alert(messages.errorTitle, messages.errorMessage);
}
