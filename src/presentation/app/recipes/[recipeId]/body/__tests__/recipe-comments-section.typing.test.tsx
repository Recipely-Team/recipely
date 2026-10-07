import { act, type ReactTestInstance } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { RecipeCommentsSection } from '@presentation/app/recipes/[recipeId]/body/recipe-comments-section';
import type { UseCommentHighlightResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result';
import { t } from '@presentation/i18n';

/**
 * **Render storm: every keystroke in the comment field re-rendered the whole recipe.** The
 * draft lived in `useRecipeDetail`, so each character re-rendered the detail screen — hero,
 * ingredients, steps — just to echo one letter. The composer now owns its text and hands it
 * up only on send.
 */
const highlight: UseCommentHighlightResult = {
  targetCommentId: null,
  highlightedCommentId: null,
  registerTargetNode: () => undefined,
  scrollViewProps: {},
};

const render = () => {
  const screen = { renders: 0 };
  const onAddComment = jest.fn<void, [string, () => void]>();
  const DetailScreen = (): React.JSX.Element => {
    screen.renders += 1;
    return (
      <RecipeCommentsSection
        commentState={undefined}
        userId="u1"
        submitError={null}
        onFocusCommentInput={() => undefined}
        onAddComment={onAddComment}
        onLoadMoreComments={() => undefined}
        onToggleCommentLike={() => undefined}
        onDeleteComment={() => undefined}
        commentHighlight={highlight}
      />
    );
  };
  const { root } = renderComponent(<DetailScreen />);
  const field = (): ReactTestInstance =>
    root.find((node) => node.props.placeholder === t().comments.placeholder && typeof node.props.onChangeText === 'function');
  const send = (): ReactTestInstance =>
    root.find((node) => node.props.accessibilityLabel === t().comments.send && typeof node.props.onPress === 'function');
  return { screen, onAddComment, field, send };
};

describe('RecipeCommentsSection — typing a comment', () => {
  it('does not re-render the detail screen while the user types', () => {
    const { screen, field } = render();
    const rendersAfterMount = screen.renders;

    act(() => (field().props.onChangeText as (text: string) => void)('Gre'));
    act(() => (field().props.onChangeText as (text: string) => void)('Great recipe!'));

    expect(screen.renders).toBe(rendersAfterMount);
    expect(field().props.value).toBe('Great recipe!');
  });

  it('sends the typed text and clears the field only once the post lands', () => {
    const { onAddComment, field, send } = render();
    act(() => (field().props.onChangeText as (text: string) => void)('Great recipe!'));

    act(() => (send().props.onPress as () => void)());
    expect(onAddComment).toHaveBeenCalledWith('Great recipe!', expect.any(Function));
    expect(field().props.value).toBe('Great recipe!');

    act(() => onAddComment.mock.calls[0][1]());
    expect(field().props.value).toBe('');
  });
});
