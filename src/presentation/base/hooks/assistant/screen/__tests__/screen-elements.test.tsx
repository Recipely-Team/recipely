/**
 * The assistant could not see what a screen did not describe by hand: a sheet,
 * a dialog, a new button. Text and buttons now register themselves; these pin
 * that the assistant reads them and can press them like a tap.
 */
import { View } from 'react-native';
import { act } from 'react-test-renderer';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { ScreenPressOutcome } from '@application/assistant/screen/screen-press-outcome';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { Pressable } from '@presentation/base/widgets/buttons/pressable';

describe('what the assistant sees on screen', () => {
  it('reads every text and lists every button a screen never described', () => {
    const registry = new AssistantActionRegistry();
    renderComponent(
      <View>
        <ThemedText variant="title">Recipely Premium</ThemedText>
        <Pressable accessibilityRole="button" onPress={() => undefined}>
          <ThemedText>Continue</ThemedText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => undefined} />
      </View>,
      { assistantActionRegistry: registry },
    );

    expect(registry.screenElements.snapshot()).toEqual({
      texts: ['Recipely Premium', 'Continue'],
      controls: ['Continue', 'Close'],
    });
    expect(registry.screenReading).toContain('On screen: Recipely Premium · Continue');
    expect(registry.screenReading).toContain('Buttons (pressOnScreen): Continue | Close');
  });

  it('presses a button by its label with the same handler as a tap', () => {
    const registry = new AssistantActionRegistry();
    const onPress = jest.fn();
    renderComponent(
      <Pressable accessibilityRole="button" onPress={onPress}>
        <ThemedText>Restore purchases</ThemedText>
      </Pressable>,
      { assistantActionRegistry: registry },
    );

    act(() => {
      expect(registry.screenElements.press('restore purchases').outcome).toBe(ScreenPressOutcome.Pressed);
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('never presses a disabled button', () => {
    const registry = new AssistantActionRegistry();
    const onPress = jest.fn();
    renderComponent(
      <Pressable accessibilityRole="button" accessibilityLabel="Subscribe" disabled onPress={onPress} />,
      { assistantActionRegistry: registry },
    );

    expect(registry.screenElements.press('subscribe').outcome).toBe(ScreenPressOutcome.NotFound);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('forgets a sheet once it closes', () => {
    const registry = new AssistantActionRegistry();
    const { renderer } = renderComponent(<ThemedText>Sheet title</ThemedText>, { assistantActionRegistry: registry });

    act(() => renderer.unmount());

    expect(registry.screenElements.snapshot().texts).toEqual([]);
  });
});
