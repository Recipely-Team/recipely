/**
 * When the queue-position badge appears, and when it must not.
 *
 * The number is only meaningful while the job is WAITING. Showing it on a job a
 * worker has already picked up would tell the user they are 3rd in a line they
 * have already left — which is the opposite of what the badge exists to say.
 */

import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { ImportQueueView } from '@presentation/app/import-recipe/body/import-queue-view';
import { en } from '@presentation/i18n/locales/en';

const POSITION_TOKEN = '{position}';

const positionText = (position: number): string =>
  en.importRecipe.queuePosition.replace(POSITION_TOKEN, String(position));

const shownText = (
  overrides: Partial<React.ComponentProps<typeof ImportQueueView>> = {},
): string[] => {
  const { root } = renderComponent(
    <ImportQueueView
      jobStatus={ImportJobStatus.Queued}
      activeStage={0}
      progress={0}
      isDone={false}
      isQueueing={false}
      queuePosition={3}
      onPrimary={jest.fn()}
      {...overrides}
    />,
  );
  return textContent(root);
};

describe('the queue-position badge', () => {
  it('shows the position while the job is waiting', () => {
    expect(shownText()).toContain(positionText(3));
  });

  it('says 1 for the job at the front rather than hiding it', () => {
    // Being next is the most encouraging thing this screen can say; an
    // "only show it if the number is big" rule would hide exactly that moment.
    expect(shownText({ queuePosition: 1 })).toContain(positionText(1));
  });

  it('drops the badge once a worker has picked the job up', () => {
    const shown = shownText({ jobStatus: ImportJobStatus.Running, queuePosition: 3 });

    expect(shown).not.toContain(positionText(3));
  });

  it('drops the badge when the import has finished', () => {
    const shown = shownText({ isDone: true, queuePosition: 3 });

    expect(shown).not.toContain(positionText(3));
  });

  it('renders no badge at all when the backend sent no position', () => {
    // An older backend answers without the field. The screen must simply omit
    // the badge, never render "In queue · null".
    const shown = shownText({ queuePosition: null });

    expect(shown.some((line) => line.includes('In queue'))).toBe(false);
    expect(shown.some((line) => line.includes('null'))).toBe(false);
  });
});
