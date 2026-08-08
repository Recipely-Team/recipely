/**
 * THE REGRESSION: a notification that said nothing.
 *
 * The backend emits `type: 'import_done'` when a queued Instagram import
 * finishes. The app's known-kind set had `ai_done` and no `import_done`, so the
 * type fell through to `generic`, whose copy was `recipeName ?? ''` — and an
 * import has no recipe title yet. The row rendered as the app name and a date,
 * with a blank where the sentence belongs, and nothing failed anywhere.
 *
 * Two things are pinned here: that the drifted type is now known, and that NO
 * kind can ever produce an empty line again — the next type the backend invents
 * will degrade to a readable row instead of a blank one.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { NotifRow } from '@presentation/app/notifications/items/notif-row';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

const item = (overrides: Partial<NotifItem> = {}): NotifItem =>
  ({
    id: 'n1',
    kind: NotifKind.ImportDone,
    actor: 'Recipely',
    daysAgo: 0,
    read: false,
    ...overrides,
  }) as NotifItem;

/**
 * Everything the row renders, minus the icon stubs. Trimmed: the row composes
 * "<actor> <action>" across separate nodes, so the action arrives with the
 * joining space attached.
 */
const linesOf = (n: NotifItem): string[] =>
  textContent(renderComponent(<NotifRow item={n} onTap={jest.fn()} />).root)
    .filter((line) => !line.startsWith('icon:'))
    .map((line) => line.trim());

describe('NotifRow copy', () => {
  it('says what happened when an Instagram import finishes', () => {
    // The type the backend actually sends. Before the fix this row was blank.
    expect(linesOf(item())).toContain(t().notifications.importDoneLabel);
  });

  it.each([
    NotifKind.Comment,
    NotifKind.Like,
    NotifKind.Favorite,
    NotifKind.AiDone,
    NotifKind.ImportDone,
    NotifKind.ModerationApproved,
    NotifKind.ModerationPending,
    NotifKind.Follow,
    NotifKind.Generic,
  ])('renders a non-empty line for %s', (kind) => {
    const lines = linesOf(item({ kind }));

    // The actor alone is not a sentence — there must be copy beyond it.
    const meaningful = lines.filter((l) => l.trim().length > 0 && l !== 'Recipely');
    expect(meaningful.length).toBeGreaterThan(0);
  });

  it('still says something for a type nobody has taught it yet', () => {
    // Whatever the backend invents next lands on `generic` with no recipe name.
    const lines = linesOf(item({ kind: NotifKind.Generic, recipeName: undefined }));

    expect(lines).toContain(t().notifications.genericLabel);
  });
});
