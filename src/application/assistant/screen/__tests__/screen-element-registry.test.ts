import { ScreenElementKind } from '@domain/assistant/screen/screen-element-kind';
import { ScreenElementRegistry } from '@application/assistant/screen/screen-element-registry';
import { ScreenPressOutcome } from '@application/assistant/screen/screen-press-outcome';

const text = (label: string, isVisible = true) => ({ kind: ScreenElementKind.Text, label: () => label, isVisible: () => isVisible });
const control = (label: string, press: () => void, options: { visible?: boolean; enabled?: boolean } = {}) => ({
  kind: ScreenElementKind.Control,
  label: () => label,
  isVisible: () => options.visible ?? true,
  isEnabled: () => options.enabled ?? true,
  press,
});

describe('ScreenElementRegistry', () => {
  it('reads the visible texts in mount order and lists the enabled controls', () => {
    const registry = new ScreenElementRegistry();
    registry.register(text('Recipely Premium'));
    registry.register(text('Hidden under the stack', false));
    registry.register(control('Continue', () => undefined));
    registry.register(control('Restore purchases', () => undefined, { enabled: false }));
    registry.register(text('Unlimited AI recipes'));

    expect(registry.snapshot()).toEqual({
      texts: ['Recipely Premium', 'Unlimited AI recipes'],
      controls: ['Continue'],
    });
  });

  it('forgets an element once it unmounts', () => {
    const registry = new ScreenElementRegistry();
    const unregister = registry.register(text('Gone soon'));
    unregister();

    expect(registry.snapshot().texts).toEqual([]);
  });

  it('presses the control the user named, with its own handler', () => {
    const registry = new ScreenElementRegistry();
    const save = jest.fn();
    registry.register(control('Kaydet', save));

    expect(registry.press('kaydet').outcome).toBe(ScreenPressOutcome.Pressed);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('never presses a control on a screen under the stack, or a disabled one', () => {
    const registry = new ScreenElementRegistry();
    const hidden = jest.fn();
    const disabled = jest.fn();
    registry.register(control('Sil', hidden, { visible: false }));
    registry.register(control('Paylaş', disabled, { enabled: false }));

    expect(registry.press('sil').outcome).toBe(ScreenPressOutcome.NotFound);
    expect(registry.press('paylaş').outcome).toBe(ScreenPressOutcome.NotFound);
    expect(hidden).not.toHaveBeenCalled();
    expect(disabled).not.toHaveBeenCalled();
  });

  it('asks back instead of guessing between two controls', () => {
    const registry = new ScreenElementRegistry();
    registry.register(control('Tarifi sil', jest.fn()));
    registry.register(control('Yorumu sil', jest.fn()));

    expect(registry.press('sil')).toEqual({ outcome: ScreenPressOutcome.Ambiguous, candidates: ['Tarifi sil', 'Yorumu sil'] });
  });

  it('survives an element whose getter throws', () => {
    const registry = new ScreenElementRegistry();
    registry.register({ kind: ScreenElementKind.Text, label: () => { throw new Error('unmounted'); }, isVisible: () => true });
    registry.register(text('Still read'));

    expect(registry.snapshot().texts).toEqual(['Still read']);
  });
});
