/**
 * Behavior tests for the shared `ConfirmSheet`. Covers the confirm/cancel
 * wiring, the loading state (actions disabled + label swapped), and the inline
 * error that keeps the sheet open after a failed confirm.
 */

import { act } from 'react-test-renderer';
import {
  renderComponent,
  textContent,
} from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { t } from '@presentation/i18n';

const CONFIRM_LABEL = 'Delete account';

const buttonByLabel = (root: RenderResult['root'], label: string) =>
  root.findAll(
    (node) =>
      node.props['accessibilityRole'] === 'button' &&
      node.props['accessibilityLabel'] === label &&
      typeof node.props['onPress'] === 'function',
  )[0];

describe('ConfirmSheet', () => {
  it('renders the title, message, and confirm label when visible', () => {
    const { root } = renderComponent(
      <ConfirmSheet
        visible
        title="Delete account?"
        message="This cannot be undone."
        confirmLabel={CONFIRM_LABEL}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const text = textContent(root);
    expect(text).toContain('Delete account?');
    expect(text).toContain('This cannot be undone.');
    expect(text).toContain(CONFIRM_LABEL);
  });

  it('calls onConfirm when the confirm action is pressed', () => {
    const onConfirm = jest.fn();
    const { root } = renderComponent(
      <ConfirmSheet
        visible
        title="Delete account?"
        message="This cannot be undone."
        confirmLabel={CONFIRM_LABEL}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );

    act(() => (buttonByLabel(root, CONFIRM_LABEL)!.props['onPress'] as () => void)());

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the cancel action is pressed', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    const { root } = renderComponent(
      <ConfirmSheet
        visible
        title="Delete account?"
        message="This cannot be undone."
        confirmLabel={CONFIRM_LABEL}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    act(() => (buttonByLabel(root, t().common.cancel)!.props['onPress'] as () => void)());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables both actions and swaps the confirm label while loading', () => {
    const { root } = renderComponent(
      <ConfirmSheet
        visible
        title="Delete account?"
        message="This cannot be undone."
        confirmLabel={CONFIRM_LABEL}
        loading
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(buttonByLabel(root, CONFIRM_LABEL)!.props['disabled']).toBe(true);
    expect(buttonByLabel(root, t().common.cancel)!.props['disabled']).toBe(true);
    expect(textContent(root)).toContain(t().common.loading);
  });

  it('shows the inline error while keeping the sheet open', () => {
    const { root } = renderComponent(
      <ConfirmSheet
        visible
        title="Delete account?"
        message="This cannot be undone."
        confirmLabel={CONFIRM_LABEL}
        error="Something went wrong."
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(textContent(root)).toContain('Something went wrong.');
    expect(buttonByLabel(root, CONFIRM_LABEL)).toBeDefined();
  });
});
