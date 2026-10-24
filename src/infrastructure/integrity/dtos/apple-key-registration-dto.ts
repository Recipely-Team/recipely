/**
 * `POST /attestation/apple-key`: an App Attest key and Apple's statement about it.
 *
 * `attestation` is base64 CBOR, made over SHA-256 of `challenge` — the backend
 * verifies it against Apple's root and keeps the key's public half and counter.
 */
export interface AppleKeyRegistrationDto {
  keyId: string;
  attestation: string;
  challenge: string;
}
