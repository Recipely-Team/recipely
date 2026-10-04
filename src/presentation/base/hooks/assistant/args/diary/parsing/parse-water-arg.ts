import { CharConstants, ValueConstants } from '@core/constants';
import type { ArgParse } from '@presentation/base/hooks/assistant/args/diary/arg-parse';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';

/** `addWater`'s arg: whole glasses to add, negative to remove; zero is nothing to do and is refused. */
export const parseWaterArg = (arg: string | undefined): ArgParse<number> => {
  const glasses = Number((arg ?? CharConstants.empty).trim());
  if (!Number.isInteger(glasses) || glasses === ValueConstants.zero) return { ok: false, error: DiaryArgError.InvalidNumber };
  return { ok: true, value: glasses };
};
