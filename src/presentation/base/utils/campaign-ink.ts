import { relativeLuminance } from '@presentation/base/theme/colors/contrast/contrast';

/** The CTA label colour on the white pill: the darker of the campaign's two gradient stops. */
export const campaignInk = (colorStart: string, colorEnd: string): string =>
  relativeLuminance(colorStart) <= relativeLuminance(colorEnd) ? colorStart : colorEnd;
