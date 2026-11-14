import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { ApplicationStores } from '@application/di/application-stores';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { PickSource } from '@presentation/base/utils/pick-source';
import type { useFridgeFlow } from '@presentation/app/fridge/hooks/use-fridge-flow';
import { useAssistantFridgeActions } from '@presentation/app/fridge/hooks/use-assistant-fridge-actions';
import { initialFridgeFlow } from '@presentation/app/fridge/model/flow/initial-fridge-flow';
import { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import type { FridgeFlowState } from '@presentation/app/fridge/model/flow/fridge-flow-state';
import { IdeasLoad } from '@presentation/app/fridge/model/ideas/ideas-load';

type Flow = ReturnType<typeof useFridgeFlow>;

const idea = (title: string): FridgeIdea => ({ title, summary: 's', totalMinutes: 20, uses: [], missing: ['leek'] }) as unknown as FridgeIdea;
const photo = { uri: 'file:///p.jpg', fileName: 'p.jpg', mimeType: 'image/jpeg' };

const flowOf = (state: FridgeFlowState): Flow =>
  ({
    state,
    addPhotos: jest.fn(async () => undefined),
    findIngredients: jest.fn(async () => undefined),
    typeInstead: jest.fn(),
    addChip: jest.fn(),
    removeChip: jest.fn(),
    changeFilters: jest.fn(),
    showIdeas: jest.fn(),
    showMore: jest.fn(),
  }) as unknown as Flow;

const mount = (state: FridgeFlowState) => {
  const registry = new AssistantActionRegistry();
  const flow = flowOf(state);
  const deps = { flow, cook: jest.fn(), addMissing: jest.fn(async () => true), onBack: jest.fn() };
  const Host = (): null => {
    useAssistantFridgeActions(deps);
    return null;
  };
  renderComponent(<Host />, { assistantActionRegistry: registry } as Partial<ApplicationStores>);
  return { registry, ...deps };
};

const base = initialFridgeFlow();
const ingredients: FridgeFlowState = {
  ...base,
  chips: [{ key: '0', name: 'eggs', sure: true }, { key: '1', name: 'leek', sure: false }],
  view: { step: FridgeStep.Ingredients, failure: null, startAdding: false },
};

/** Cook from my fridge had no voice at all: every button on every step must answer by voice. */
describe('useAssistantFridgeActions', () => {
  it('takes photos and scans them on the photo step, and refuses a scan with no photo', async () => {
    const empty = mount(base);
    await expect(empty.registry.run(AssistantAction.ScanFridge)).resolves.toMatchObject({ ok: false, error: AssistantActionError.NotReady });
    await empty.registry.run(AssistantAction.AttachPhoto, 'camera');
    expect(empty.flow.addPhotos).toHaveBeenCalledWith(PickSource.Camera);

    const withPhoto = mount({ ...base, photos: [photo] });
    await expect(withPhoto.registry.run(AssistantAction.ScanFridge)).resolves.toMatchObject({ ok: true });
    expect(withPhoto.flow.findIngredients).toHaveBeenCalled();
  });

  it('edits the ingredients, sets filters and asks for ideas', async () => {
    const { registry, flow } = mount(ingredients);
    await registry.run(AssistantAction.AddIngredient, 'rice');
    await registry.run(AssistantAction.RemoveIngredient, 'leek');
    await expect(registry.run(AssistantAction.AddFilter, 'time=15')).resolves.toMatchObject({ ok: true });
    await expect(registry.run(AssistantAction.AddFilter, 'cuisine=thai')).resolves.toMatchObject({ ok: false, error: AssistantActionError.UnknownFilter });
    await registry.run(AssistantAction.ShowFridgeIdeas);

    expect(flow.addChip).toHaveBeenCalledWith('rice');
    expect(flow.removeChip).toHaveBeenCalledWith(ingredients.chips[1]);
    expect(flow.changeFilters).toHaveBeenCalledWith({ maxMinutes: 15 });
    expect(flow.showIdeas).toHaveBeenCalled();
  });

  it('cooks an idea or lists its missing items, by name or position', async () => {
    const ideas = [idea('Leek frittata'), idea('Egg fried rice')];
    const { registry, cook, addMissing } = mount({
      ...ingredients,
      view: { step: FridgeStep.Ideas, query: { ingredients: ['eggs'], filters: base.filters }, ideas, load: IdeasLoad.Idle, added: [] },
    });
    await registry.run(AssistantAction.OpenRecipe, '2');
    await registry.run(AssistantAction.AddToShoppingList, 'leek frittata');
    await expect(registry.run(AssistantAction.AddIngredient, 'rice')).resolves.toMatchObject({ ok: false });

    expect(cook).toHaveBeenCalledWith(ideas[1]);
    expect(addMissing).toHaveBeenCalledWith(ideas[0]);
  });

  it('walks back through the steps instead of leaving the screen', async () => {
    const { registry, onBack } = mount(ingredients);
    await registry.run(AssistantAction.GoBack);
    expect(onBack).toHaveBeenCalled();
  });
});
