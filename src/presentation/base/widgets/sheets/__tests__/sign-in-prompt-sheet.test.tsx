/**
 * `SignInPromptSheet` is the CTA shown when a guest attempts a gated
 * interaction. Covers: generic vs. per-action message, title, and that
 * `onSignIn` fires on the primary button press.
 */

import { act } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { t } from '@presentation/i18n';

/**
 * The sheet's shared `BottomSheet` grabber also has `accessibilityRole="button"`
 * (see `bottom-sheet.tsx`), so a plain role lookup now matches two nodes here
 * — the primary "Sign In" button is the one with a real `onPress` (the
 * grabber only wires `onAccessibilityTap`).
 */
const primaryButton = (root: RenderResult['root']) =>
  root.findAll(
    (node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function',
  )[0];

describe('SignInPromptSheet', () => {
  it('renders the generic title and message when no per-action message is given', () => {
    const { root } = renderComponent(
      <SignInPromptSheet visible onClose={jest.fn()} onSignIn={jest.fn()} />,
    );

    const texts = textContent(root);
    expect(texts).toContain(t().signInPrompt.title);
    expect(texts).toContain(t().signInPrompt.message);
  });

  it('renders a per-action message instead of the generic one', () => {
    const { root } = renderComponent(
      <SignInPromptSheet
        visible
        onClose={jest.fn()}
        onSignIn={jest.fn()}
        message="Sign in to like this recipe."
      />,
    );

    const texts = textContent(root);
    expect(texts).toContain('Sign in to like this recipe.');
    expect(texts).not.toContain(t().signInPrompt.message);
  });

  it('fires onSignIn when the primary button is pressed', () => {
    const onSignIn = jest.fn();
    const { root } = renderComponent(
      <SignInPromptSheet visible onClose={jest.fn()} onSignIn={onSignIn} />,
    );

    act(() => (primaryButton(root).props.onPress as () => void)());

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('renders nothing interactable when not visible (Modal not shown)', () => {
    const onSignIn = jest.fn();
    expect(() =>
      renderComponent(<SignInPromptSheet visible={false} onClose={jest.fn()} onSignIn={onSignIn} />),
    ).not.toThrow();
  });
});
