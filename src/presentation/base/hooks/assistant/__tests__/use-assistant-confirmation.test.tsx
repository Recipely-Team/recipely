import { act, type ReactTestRenderer } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantConfirmation } from '@presentation/base/hooks/assistant/use-assistant-confirmation';

/**
 * Without a spoken answer the whole assistant stops at its own safety gate:
 * it is built for someone whose hands are covered in flour, and asking "shall
 * I publish it?" then requiring a tap to say yes is worse than not asking.
 */
describe('useAssistantConfirmation', () => {
  const mount = (visible: boolean) => {
    const registry = new AssistantActionRegistry();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const Probe = ({ open }: { open: boolean }): null => {
      useAssistantConfirmation(open, onConfirm, onCancel);
      return null;
    };

    const rendered = renderComponent(
      <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
        <Probe open={visible} />
      </StoresProvider>,
    );

    const setOpen = (open: boolean): void => {
      act(() => {
        (rendered.renderer as ReactTestRenderer).update(
          <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
            <Probe open={open} />
          </StoresProvider>,
        );
      });
    };

    return { registry, onConfirm, onCancel, setOpen };
  };

  it('answers a spoken yes while the sheet is open', async () => {
    const { registry, onConfirm } = mount(true);

    await act(async () => {
      await expect(registry.run(AssistantAction.Confirm)).resolves.toMatchObject({ ok: true });
    });

    expect(onConfirm).toHaveBeenCalled();
  });

  it('answers a spoken no', async () => {
    const { registry, onCancel } = mount(true);

    await act(async () => {
      await registry.run(AssistantAction.Cancel);
    });

    expect(onCancel).toHaveBeenCalled();
  });

  // A stray "yes" with nothing pending must not confirm whatever was last on
  // screen — the gate is only open while the user can see what they are
  // agreeing to.
  it('is unavailable while no sheet is open', async () => {
    const { registry, onConfirm } = mount(false);

    await act(async () => {
      await expect(registry.run(AssistantAction.Confirm)).resolves.toEqual({
        ok: false,
        error: 'unavailable_here',
      });
    });

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('stops accepting once the sheet closes', async () => {
    const { registry, onConfirm, setOpen } = mount(true);

    setOpen(false);

    await act(async () => {
      await expect(registry.run(AssistantAction.Confirm)).resolves.toEqual({
        ok: false,
        error: 'unavailable_here',
      });
    });

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('answers the sheet that is currently open after it reopens', async () => {
    const { registry, onConfirm, setOpen } = mount(true);

    setOpen(false);
    setOpen(true);

    await act(async () => {
      await registry.run(AssistantAction.Confirm);
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
