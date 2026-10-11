import type { FridgePhoto } from '@domain/fridge/scan/fridge-photo';

/** One scan: 1–`FridgeLimits.photosMax` photos; `locale` names the language the ingredients come back in (null: the server's choice). */
export interface FridgeScanInput {
  readonly photos: readonly FridgePhoto[];
  readonly locale: string | null;
}
