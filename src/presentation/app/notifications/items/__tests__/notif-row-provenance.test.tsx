/**
 * THE REGRESSION: every import notification showed the Instagram logo.
 *
 * The import row's icon was `logo-instagram` for every import, and the row
 * never said where the recipe came from — a TikTok or YouTube import looked
 * exactly like an Instagram one. The server now stores the platform on the
 * row; the row draws that platform's provenance mark and names the source,
 * and a row written before the server stored it gets a neutral import icon.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { NotifRow } from '@presentation/app/notifications/items/notif-row';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import { ProvenanceGlyph } from '@presentation/base/widgets/badges/provenance-glyph';
import { SourcePlatform } from '@domain/recipes/provenance/source-platform';
import { t } from '@presentation/i18n';
import { NotificationTargetKind } from '@domain/notifications/notification-target-kind';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return Icon;
});
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return Icon;
});

const item = (overrides: Partial<NotifItem> = {}): NotifItem => ({
  id: 'n1',
  kind: NotifKind.ImportDone,
  actor: 'Recipely',
  daysAgo: 0,
  read: false,
  target: { kind: NotificationTargetKind.Draft, draftId: 'd1' },
  ...overrides,
});

const render = (n: NotifItem) => renderComponent(<NotifRow item={n} onTap={jest.fn()} />).root;
const lines = (n: NotifItem): string[] => textContent(render(n)).map((l) => l.trim());
const marks = (n: NotifItem): string[] =>
  render(n).findAllByType(ProvenanceGlyph).map((g) => String(g.props['mark']));

describe('every import notification showed the Instagram logo', () => {
  it('draws the TikTok mark and names the account for a TikTok import', () => {
    const n = item({ source: { platform: SourcePlatform.TikTok, handle: 'chef.ayse' } });

    expect(marks(n)).toEqual([SourcePlatform.TikTok]);
    expect(lines(n)).not.toContain('icon:logo-instagram');
    expect(lines(n)).toContain(t().recipes.originTiktokDetailLabel.replace('{handle}', '@chef.ayse'));
  });

  it('names the platform alone when no account was reported', () => {
    const n = item({ source: { platform: SourcePlatform.YouTube } });

    expect(marks(n)).toEqual([SourcePlatform.YouTube]);
    expect(lines(n)).toContain(t().recipes.originYoutubeA11y);
  });

  it('marks a failed import with the platform its link pointed at', () => {
    const n = item({ kind: NotifKind.ImportFailed, target: null, source: { platform: SourcePlatform.Facebook } });

    expect(marks(n)).toEqual([SourcePlatform.Facebook]);
  });

  it.each([NotifKind.ImportDone, NotifKind.ImportFailed])(
    'shows a neutral import icon, never Instagram, for an older %s row with no platform',
    (kind) => {
      const n = item({ kind });

      expect(marks(n)).toEqual([]);
      expect(lines(n)).not.toContain('icon:logo-instagram');
      expect(lines(n)).toContain('icon:download-outline');
    },
  );
});
