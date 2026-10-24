import { ApiRoutes } from '@infrastructure/constants/api/api-routes';

/**
 * The routes whose requests carry an app attestation: the ones that spend
 * money (AI models, import workers, voice sessions) or mint accounts.
 *
 * @remarks
 * - **Not every request.** Play Integrity is metered per day and an assertion
 *   costs a Secure Enclave signature; reads and cheap writes are protected by
 *   authorisation and rate limits instead.
 * - **The backend keeps the same list** and is the one that enforces it.
 */
export const ATTESTED_ROUTES: ReadonlySet<string> = new Set([
  ApiRoutes.auth.register,
  ApiRoutes.auth.social,
  ApiRoutes.recipes.generate,
  ApiRoutes.recipes.refine,
  ApiRoutes.recipes.importJobs,
  ApiRoutes.recipes.importFile,
  ApiRoutes.fridge.scan,
  ApiRoutes.fridge.ideas,
  ApiRoutes.diary.mealParse,
  ApiRoutes.assistant.session,
  ApiRoutes.assistant.intentToken,
]);
