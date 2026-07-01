import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import aesjs from 'aes-js';

/**
 * LargeSecureStore — encrypt-at-rest for values too large for expo-secure-store
 * (which caps at ~2048 bytes on Android).
 *
 * Pattern (from Supabase's official Expo guide):
 *   - A random AES-256 key is generated per stored value and kept in expo-secure-store
 *     (hardware-backed Keystore / Keychain). Only the 32-byte key lives there — well
 *     under the size cap.
 *   - The (potentially large) value is AES-CTR encrypted and the ciphertext is stored
 *     in AsyncStorage. Without the Keystore-held key the ciphertext is useless.
 *
 * Web has no expo-secure-store backend, so we fall back to plaintext AsyncStorage
 * there (the app targets iOS/Android; web is dev-only).
 */

const isWeb = Platform.OS === 'web';

function keyStoreName(key: string): string {
  // SecureStore keys allow [A-Za-z0-9._-] only. Suffix to avoid colliding with the
  // ciphertext entry in AsyncStorage (same key name, different store).
  return `${key}__enckey`;
}

async function encrypt(key: string, value: string): Promise<string> {
  const encryptionKey = Crypto.getRandomBytes(256 / 8); // 32-byte AES-256 key
  const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
  const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

  await SecureStore.setItemAsync(keyStoreName(key), aesjs.utils.hex.fromBytes(encryptionKey));
  return aesjs.utils.hex.fromBytes(encryptedBytes);
}

async function decrypt(key: string, ciphertextHex: string): Promise<string | null> {
  const encryptionKeyHex = await SecureStore.getItemAsync(keyStoreName(key));
  if (!encryptionKeyHex) {
    // Key was wiped (e.g. biometric re-enrollment invalidated the Keychain item,
    // or app data was partially cleared). The ciphertext can no longer be read.
    return null;
  }

  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(encryptionKeyHex),
    new aesjs.Counter(1)
  );
  const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(ciphertextHex));
  return aesjs.utils.utf8.fromBytes(decryptedBytes);
}

/**
 * Read and decrypt a value. Returns null if absent or undecryptable.
 */
export async function secureGet(key: string): Promise<string | null> {
  const stored = await AsyncStorage.getItem(key);
  if (stored === null) return null;
  if (isWeb) return stored;

  try {
    return await decrypt(key, stored);
  } catch (error) {
    console.warn(`secureGet: failed to decrypt "${key}", treating as absent`, error);
    return null;
  }
}

/**
 * Encrypt and store a value.
 */
export async function secureSet(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  const ciphertext = await encrypt(key, value);
  await AsyncStorage.setItem(key, ciphertext);
}

/**
 * Remove a value and its encryption key.
 */
export async function secureRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
  if (!isWeb) {
    try {
      await SecureStore.deleteItemAsync(keyStoreName(key));
    } catch {
      // best-effort
    }
  }
}
