/**
 * What this screen shows while a job is waiting, and what it must drop once the
 * job is not.
 *
 * The position is only meaningful while the job is WAITING. Showing it on a job
 * a worker has already picked up would tell the user they are 3rd in a line
 * they have already left — the opposite of what the badge exists to say.
 *
 * The ad is the other half, and it is gone for good: AdSense served notice for
 * "ads on screens without publisher content", and a queue screen — a stage
 * list, an estimate and a progress bar — is precisely that. The wait being long
 * was the argument for putting one here; policy is the argument that outranks
 * it.
 */

import { HOST_TOKEN } from '@presentation/app/import-recipe/model/host-token';
import { ScrollView } from 'react-native';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { ImportQueueView } from '@presentation/app/import-recipe/body/import-queue-view';
import { en } from '@presentation/i18n/locales/en';
import { SourcePlatform } from '@domain/recipes/provenance/source-platform';

// The real slot renders null until consent and a loaded ad say otherwise, so it
// cannot tell "no ad yet" from "no ad slot". A stand-in makes the screen's own
// decision — whether it OFFERS the placement — the thing under test.
jest.mock('@presentation/base/widgets/ads/ad-slot', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { AdSlot: (): React.JSX.Element => <Text>ad-slot</Text> };
});

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
      platform={SourcePlatform.Instagram}
      host="instagram.com"
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

describe('the ad that used to be on the import screen', () => {
  // The AdSlot mock above renders visible text, so these fail against the
  // version that carried a banner — which is the point.
  it.each([
    ['queued', { jobStatus: ImportJobStatus.Queued }],
    ['running', { jobStatus: ImportJobStatus.Running }],
    ['done', { isDone: true }],
  ])('offers no placement while the job is %s', (_label, overrides) => {
    expect(shownText(overrides)).not.toContain('ad-slot');
  });

  it('offers none inside the scroll either, not merely outside the footer', () => {
    const { root } = renderComponent(
      <ImportQueueView
        jobStatus={ImportJobStatus.Running}
        activeStage={0}
        progress={0}
        isDone={false}
        isQueueing={false}
        queuePosition={null}
        platform={SourcePlatform.Instagram}
        host="instagram.com"
        onPrimary={jest.fn()}
      />,
    );

    expect(textContent(root.findByType(ScrollView))).not.toContain('ad-slot');
  });
});

describe('a recipe web page, which is read rather than queued', () => {
  const HOST = 'nefisyemektarifleri.com';
  const web = { platform: SourcePlatform.Web, host: HOST };

  it('names the site in the title instead of promising a video', () => {
    const shown = shownText(web);

    expect(shown).toContain(en.importRecipe.webTitle.replace(HOST_TOKEN, HOST));
    expect(shown).not.toContain(en.importRecipe.title);
  });

  it('walks three stages, not the four a video takes', () => {
    const shown = shownText(web);

    expect(shown).toEqual(
      expect.arrayContaining([en.importRecipe.webStage0, en.importRecipe.webStage1, en.importRecipe.webStage2]),
    );
    expect(shown).not.toContain(en.importRecipe.stage0);
    expect(shown).not.toContain(en.importRecipe.stage3);
  });

  it('shows the site and a seconds estimate instead of a queue position', () => {
    const shown = shownText(web);

    expect(shown).toEqual(expect.arrayContaining([en.importRecipe.webSite, HOST, en.importRecipe.webEstimateValue]));
    expect(shown).not.toContain(positionText(3));
  });

  it('offers Cancel, not "notify me", and drops the background note', () => {
    const shown = shownText(web);

    // The job runs on once the screen closes (the draft still lands, the push
    // still comes), so the button says Close — never a Cancel it cannot keep.
    expect(shown).toContain(en.common.close);
    expect(shown).not.toContain(en.common.cancel);
    expect(shown).not.toContain(en.importRecipe.notify);
    expect(shown).not.toContain(en.importRecipe.background);
  });

  it('still offers the draft once it is ready', () => {
    expect(shownText({ ...web, isDone: true })).toContain(en.importRecipe.openDraft);
  });

  it('keeps an Instagram video on its four stages and its notify button', () => {
    const shown = shownText();

    expect(shown).toContain(en.importRecipe.stage3);
    expect(shown).toContain(en.importRecipe.notify);
  });
});
