/**
 * The register card is pulled up over the hero by `decorSizes.cardOverlap`; the
 * hero once reserved only `spacing.xl` below its subtitle, so on a phone the
 * card covered "Join Recipely to save and share recipes." entirely.
 */

import { StyleSheet, View, type ViewStyle } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { RegisterHero } from '@presentation/app/register/body/register-hero';
import { decorSizes } from '@presentation/base/theme';

describe('RegisterHero', () => {
  it('reserves room below the subtitle for the card that overlaps it', () => {
    const { root } = renderComponent(<RegisterHero isLandscapeShell={false} />);
    const style = StyleSheet.flatten(root.findAllByType(View)[0].props.style as ViewStyle);

    expect(Number(style.paddingBottom)).toBeGreaterThan(decorSizes.cardOverlap);
  });
});
