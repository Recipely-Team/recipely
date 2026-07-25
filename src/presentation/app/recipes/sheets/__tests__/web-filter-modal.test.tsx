/**
 * Behavior tests for the web-only filter modal.
 *
 * WebFilterModal reads cuisine/category options + labels from the taxonomy
 * store via StoresContext, so we supply a minimal hand-built Zustand store
 * through a real StoresProvider. With the store left at status 'idle' the
 * options hooks fall back to the bundled local enum keys (CUISINE_KEY_VALUES /
 * RECIPE_CATEGORY_VALUES), which keeps the chip rows populated and their labels
 * resolvable from i18n without a network.
 *
 * Tests drive the modal through its accessibility surface (button roles +
 * labels) rather than its markup, and assert on the callbacks the parent screen
 * relies on.
 */

import { act } from 'react-test-renderer';
import { create } from 'zustand';
import {
  renderComponent,
  textContent,
} from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { WebFilterModal } from '@presentation/app/recipes/sheets/web-filter-modal';
import type { UiFilters } from '@presentation/app/recipes/model/ui-filters';
import { emptyFilters } from '@presentation/app/recipes/model/ui-filter-defaults';
import type { TaxonomyStoreState } from '@application/recipes/taxonomy/taxonomy-store-state';
import { CUISINE_KEY_VALUES } from '@domain/recipes/taxonomy/cuisine-key';
import { DIFFICULTY_VALUES } from '@domain/recipes/difficulty';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import { t } from '@presentation/i18n';

// Render the icon as plain text so query helpers never trip over the native mock.
jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

/**
 * A taxonomy store at status 'idle' with no entries: the options hooks fall back
 * to the bundled enum keys, and the label hooks fall back to i18n cuisine/
 * category names — exactly the "store not ready" path the modal must survive.
 */
const makeTaxonomyStore = () =>
  create<TaxonomyStoreState>(() => ({
    cuisines: [],
    categories: [],
    status: 'idle',
    failure: null,
    load: jest.fn(),
    reload: jest.fn(),
  }));

interface ModalHandlers {
  onToggleCuisine: jest.Mock;
  onToggleCategory: jest.Mock;
  onToggleDifficulty: jest.Mock;
  onSetMaxTime: jest.Mock;
  onApply: jest.Mock;
  onReset: jest.Mock;
  onClose: jest.Mock;
}

interface RenderOptions {
  visible?: boolean;
  pending?: UiFilters;
  resultCount?: number;
  hasActiveFilters?: boolean;
}

const renderModal = (
  opts: RenderOptions = {},
): { root: RenderResult['root']; handlers: ModalHandlers } => {
  const {
    visible = true,
    pending = emptyFilters,
    resultCount = 0,
    hasActiveFilters = true,
  } = opts;

  const handlers: ModalHandlers = {
    onToggleCuisine: jest.fn(),
    onToggleCategory: jest.fn(),
    onToggleDifficulty: jest.fn(),
    onSetMaxTime: jest.fn(),
    onApply: jest.fn(),
    onReset: jest.fn(),
    onClose: jest.fn(),
  };

  const stores = { taxonomyStore: makeTaxonomyStore() } as unknown as Stores;

  const { root } = renderComponent(
    <StoresProvider value={stores}>
      <WebFilterModal
        visible={visible}
        pending={pending}
        resultCount={resultCount}
        hasActiveFilters={hasActiveFilters}
        {...handlers}
      />
    </StoresProvider>,
  );

  return { root, handlers };
};

/** Every button whose accessibilityLabel matches `label`. */
const buttonsByLabel = (root: RenderResult['root'], label: string) =>
  root.findAll(
    (node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === label,
  );

/** Fires the first button with the given accessibility label. */
const pressByLabel = (root: RenderResult['root'], label: string): void => {
  const button = buttonsByLabel(root, label)[0];
  act(() => (button.props.onPress as () => void)());
};

describe('WebFilterModal', () => {
  it('renders nothing when not visible', () => {
    const { root } = renderModal({ visible: false });

    const texts = textContent(root);

    expect(texts).not.toContain(t().recipes.filter);
    expect(texts.some((text) => text.startsWith(t().recipes.showResults))).toBe(false);
  });

  it('renders the title when visible', () => {
    const { root } = renderModal({ visible: true });

    expect(textContent(root)).toContain(t().recipes.filter);
  });

  it('shows the result count inside the apply button label', () => {
    const { root } = renderModal({ visible: true, resultCount: 7 });

    expect(textContent(root)).toContain(`${t().recipes.showResults} (7)`);
  });

  it('omits the parenthesised count when no results match', () => {
    const { root } = renderModal({ visible: true, resultCount: 0 });

    const texts = textContent(root);

    expect(texts).toContain(t().recipes.showResults);
    expect(texts).not.toContain(`${t().recipes.showResults} (0)`);
  });

  it('calls onToggleCuisine with the chip key when a cuisine chip is tapped', () => {
    const firstCuisine = CUISINE_KEY_VALUES[0];
    const { root, handlers } = renderModal({ visible: true });

    // Resolve the visible label the same way the component does (i18n fallback).
    const label = (t().cuisineNames as Record<string, string>)[firstCuisine] ?? firstCuisine;
    pressByLabel(root, label);

    expect(handlers.onToggleCuisine).toHaveBeenCalledTimes(1);
    expect(handlers.onToggleCuisine).toHaveBeenCalledWith(firstCuisine);
  });

  it('calls onApply when the apply button is tapped', () => {
    const applyLabel = `${t().recipes.showResults} (3)`;
    const { root, handlers } = renderModal({ visible: true, resultCount: 3 });

    // PrimaryButton carries no accessibilityLabel, so find the innermost button
    // host node that wraps the apply label text (the outer scrim button also
    // contains it) and fire its onPress.
    const applyButtons = root
      .findAll(
        (node) =>
          node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function',
      )
      .filter((node) => textContent(node).includes(applyLabel));
    const applyButton = applyButtons[applyButtons.length - 1];
    act(() => (applyButton.props.onPress as () => void)());

    expect(handlers.onApply).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is tapped', () => {
    const { root, handlers } = renderModal({ visible: true });

    pressByLabel(root, t().recipes.closeFilter);

    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when the Clear button is tapped', () => {
    const { root, handlers } = renderModal({ visible: true, hasActiveFilters: true });

    pressByLabel(root, t().recipes.clearFilters);

    expect(handlers.onReset).toHaveBeenCalledTimes(1);
  });

  it('renders a difficulty chip for every DIFFICULTY_VALUES entry', () => {
    const { root } = renderModal({ visible: true });

    const texts = textContent(root);

    for (const value of DIFFICULTY_VALUES) {
      expect(texts).toContain(difficultyLabel(value));
    }
  });
});
