/**
 * Regression: the step text must ALWAYS be visible.
 *
 * The card used to feed `<Text>` element children (one `Fragment` per parsed
 * part) instead of a string. Native text layout can drop non-string children on
 * a re-measure — mid-scroll the step then rendered as blank space at full card
 * height. The text is now passed as one plain string, and these tests lock that
 * in: nothing may turn the step back into element children.
 *
 * `STEP_WITH_DURATION` earns its place twice over: it is the shape that used to
 * be split into parts, and it is the case that must NOT sprout a countdown chip
 * repeating the duration the sentence already gives.
 */

import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { InstructionCard } from '@presentation/app/recipes/[recipeId]/items/steps/instruction-card';

const STEP_WITH_DURATION = 'Bake at 170°C for 10 minutes, then rest.';
const PLAIN_STEP = 'Chop the onions finely.';

const renderCard = (step: string, completed = false): ReactTestInstance =>
  renderComponent(
    <InstructionCard index={0} step={step} completed={completed} onToggle={jest.fn()} />,
  ).root;

const stepTextNodes = (root: ReactTestInstance): ReactTestInstance[] =>
  root.findAllByType('Text').filter((node) => typeof node.props.children === 'string');

describe('InstructionCard step text', () => {
  it('renders a step containing a duration as one plain string, in full', () => {
    const root = renderCard(STEP_WITH_DURATION);

    expect(textContent(root)).toContain(STEP_WITH_DURATION);
    expect(stepTextNodes(root).map((node) => node.props.children)).toContain(STEP_WITH_DURATION);
  });

  it('renders a step without a duration in full', () => {
    const root = renderCard(PLAIN_STEP);

    expect(textContent(root)).toContain(PLAIN_STEP);
  });

  it('keeps the text visible when the step is completed (struck through, not hidden)', () => {
    const root = renderCard(STEP_WITH_DURATION, true);

    expect(textContent(root)).toContain(STEP_WITH_DURATION);
    expect(stepTextNodes(root).map((node) => node.props.children)).toContain(STEP_WITH_DURATION);
  });

  it('adds no countdown chip beside a step that already states its duration', () => {
    // The removed chip rendered the same number a second time ("35 dakika
    // pişirin" + a "35 min" badge). The step sentence must be the only place
    // the duration appears, so the card's text is exactly the step number and
    // the step itself — nothing else.
    const root = renderCard(STEP_WITH_DURATION);

    expect(textContent(root)).toEqual(['1', STEP_WITH_DURATION]);
  });
});
