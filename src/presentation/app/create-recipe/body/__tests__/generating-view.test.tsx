/**
 * The generate screen is a spinner, a checklist and a progress bar — it holds
 * nothing the user came to read. It carried a banner anyway, which is the
 * "ads on screens without publisher content" violation AdSense served notice
 * for, in AdMob's version of the same rule.
 *
 * The mocked slot renders visible text, so this fails against the version that
 * had one.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { GeneratingView } from '@presentation/app/create-recipe/body/generating-view';

jest.mock('@presentation/base/widgets/ads/ad-slot', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { AdSlot: (): React.JSX.Element => <Text>ad-slot</Text> };
});

const shownText = (activeStep: number): string[] =>
  textContent(renderComponent(<GeneratingView activeStep={activeStep} />).root);

describe('the ad that used to be on the generate screen', () => {
  it.each([0, 1, 2])('offers no placement at step %p', (activeStep) => {
    expect(shownText(activeStep)).not.toContain('ad-slot');
  });

  it('still renders the checklist it exists for', () => {
    // Non-vacuity: the assertion above would also pass on a screen that
    // rendered nothing at all.
    expect(shownText(0).length).toBeGreaterThan(0);
  });
});
