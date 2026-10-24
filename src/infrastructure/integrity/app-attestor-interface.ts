/**
 * Proves a request comes from the genuine app on a genuine device.
 *
 * @remarks
 * - **`binding` ties the proof to one request** (`requestBinding`): the backend
 *   rebuilds the same string and refuses a proof minted for another request.
 * - **`null` means "no proof"**, never an error: an unsupported device, a
 *   platform outage or a key the OS lost all send the request without one, and
 *   the backend decides what an unattested request may do.
 */
export interface AppAttestorInterface {
  headersFor(binding: string): Promise<Readonly<Record<string, string>> | null>;
}
