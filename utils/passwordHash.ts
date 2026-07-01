import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Crypto from 'expo-crypto';

export async function hashPassword(password: string): Promise<string> {
  const iterations = 100000;
  const keyLength = 32;
  const saltLength = 16;

  const salt = await Crypto.getRandomBytesAsync(saltLength);

  const passwordBytes = new TextEncoder().encode(password);

  const hash = pbkdf2(sha256, passwordBytes, salt, {
    c: iterations,
    dkLen: keyLength
  });

  const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

export async function createPasswordHash(password: string): Promise<string> {
  return await hashPassword(password);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, storedHashHex] = storedHash.split(':');

  const salt = new Uint8Array(
    (saltHex.match(/.{1,2}/g) || []).map(byte => parseInt(byte, 16))
  );

  const passwordBytes = new TextEncoder().encode(password);

  const hash = pbkdf2(sha256, passwordBytes, salt, {
    c: 100000,
    dkLen: 32
  });

  const computedHashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');

  return computedHashHex === storedHashHex;
}
