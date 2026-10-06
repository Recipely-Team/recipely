import type { InstagramReturnKind } from '@domain/instagram/connect/instagram-return-kind';

/** The login's outcome as the return link carried it. */
export type InstagramReturnType =
  | { readonly kind: typeof InstagramReturnKind.Authorized; readonly code: string }
  | { readonly kind: typeof InstagramReturnKind.Denied | typeof InstagramReturnKind.Failed | typeof InstagramReturnKind.Cancelled };
