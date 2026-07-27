/**
 * The alarm overlay rendered its headline through a `body`-variant ThemedText
 * with the font size overridden to `headline`. The line box stayed at the body
 * size, so "Time is up!" was drawn into a box roughly two thirds of its own
 * height and the reporter's screenshot showed the title sliced through the
 * middle. These tests pin the line box to the glyphs it has to hold.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn((): Promise<void> => Promise.resolve()),
  impactAsync: jest.fn((): Promise<void> => Promise.resolve()),
  NotificationFeedbackType: { Warning: 'warning' },
  ImpactFeedbackStyle: { Heavy: 'heavy' },
}));

import { act, type ReactTestInstance } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { AlarmScreen } from '@presentation/navigation/alarm-screen';
import { t } from '@presentation/i18n';

const RECIPE_NAME = 'Microwave Chocolate Mug Cake';

/** The `<Text>` node whose rendered content is exactly `text`. */
const textNode = (root: ReactTestInstance, text: string): ReactTestInstance => {
  const node = root.findAllByType('Text').filter((n) => n.children.join('') === text)[0];
  if (node === undefined) throw new Error(`No <Text> rendering "${text}"`);
  return node;
};

describe('AlarmScreen', () => {
  it('gives every label a line box at least as tall as its own font size', () => {
    const { root, renderer } = renderComponent(
      <AlarmScreen timerId="cake:cook" recipeName={RECIPE_NAME} />,
    );

    for (const label of [t().alarm.title, RECIPE_NAME, t().alarm.dismiss]) {
      const style = StyleSheet.flatten(textNode(root, label).props.style) as {
        fontSize: number;
        lineHeight: number;
      };
      expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
    }

    act(() => {
      renderer.unmount();
    });
  });

  it('shows the alarm copy and a dismiss button', () => {
    const { root, renderer } = renderComponent(
      <AlarmScreen timerId="cake:cook" recipeName={RECIPE_NAME} />,
    );

    expect(textNode(root, t().alarm.title)).toBeDefined();
    expect(textNode(root, RECIPE_NAME)).toBeDefined();
    expect(
      root.findAll(
        (node) =>
          node.props.accessibilityRole === 'button' &&
          node.props.accessibilityLabel === t().alarm.dismiss,
      ),
    ).not.toHaveLength(0);

    act(() => {
      renderer.unmount();
    });
  });
});
