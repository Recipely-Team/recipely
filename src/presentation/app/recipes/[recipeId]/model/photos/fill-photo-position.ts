import { ValueConstants } from '@core/constants';

const INDEX_SLOT = '{i}';
const TOTAL_SLOT = '{n}';

/** Fills a "{i} of {n}" template with a zero-based index, shown one-based. */
export const fillPhotoPosition = (template: string, index: number, total: number): string =>
  template.replace(INDEX_SLOT, String(index + ValueConstants.one)).replace(TOTAL_SLOT, String(total));
