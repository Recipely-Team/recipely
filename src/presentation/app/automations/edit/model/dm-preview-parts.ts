import { ValueConstants } from '@core/constants';
import { DmMessageToken } from '@domain/instagram/dm/dm-message-token';

/** One run of the DM preview: plain text, or the link drawn underlined. */
interface PreviewPart {
  text: string;
  isLink: boolean;
}

/**
 * The DM as the commenter will read it (spec step 4 → preview): `{name}`
 * becomes a sample name and `{link}` the recipe link, split into runs so the
 * link can be underlined.
 */
export const dmPreviewParts = (dmText: string, sampleName: string, link: string): PreviewPart[] =>
  dmText
    .split(DmMessageToken.Name)
    .join(sampleName)
    .split(DmMessageToken.Link)
    .flatMap((text, index) => (index === ValueConstants.zero ? [{ text, isLink: false }] : [{ text: link, isLink: true }, { text, isLink: false }]))
    .filter((part) => part.text.length > ValueConstants.zero);
