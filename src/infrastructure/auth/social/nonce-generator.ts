import * as Crypto from 'expo-crypto';
import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { CharConstants, RadixConstants } from '@core/constants';

/** Pad character for a single-digit hex byte. */
const HEX_PAD = '0';

/** Generates a cryptographically random hex nonce of the given byte length. */
export const generateNonce = (byteLength = 32): string => {
  const bytes = Crypto.getRandomBytes(byteLength);
  return Array.from(bytes)
    .map((b) => b.toString(RadixConstants.hex).padStart(RadixConstants.hexCharsPerByte, HEX_PAD))
    .join(CharConstants.empty);
};

/** SHA-256 hashes a raw string nonce and returns the hex digest. */
export const hashNonce = (raw: string): Promise<string> =>
  digestStringAsync(CryptoDigestAlgorithm.SHA256, raw);
