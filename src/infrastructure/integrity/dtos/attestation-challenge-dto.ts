/** `GET /attestation/challenge`: a single-use, short-lived challenge for one key attestation. */
export interface AttestationChallengeDto {
  challenge: string;
}
