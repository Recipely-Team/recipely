import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { ATTESTED_ROUTES } from '@infrastructure/constants/api/attested-routes';

describe('ATTESTED_ROUTES', () => {
  // The flag fetch and the key registration go through the same client: attesting them would recurse.
  it('never attests the routes attestation itself depends on', () => {
    for (const route of [ApiRoutes.flags, ApiRoutes.attestation.challenge, ApiRoutes.attestation.appleKey]) {
      expect(ATTESTED_ROUTES.has(route)).toBe(false);
    }
  });
});
