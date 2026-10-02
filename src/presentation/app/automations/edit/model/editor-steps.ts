import { EditorStep, type EditorStepType } from '@presentation/app/automations/edit/model/editor-step';

/** The steps in order, for the progress, the stepper and Next / Back. */
export const EDITOR_STEPS: readonly EditorStepType[] = [EditorStep.Post, EditorStep.Keywords, EditorStep.Recipe, EditorStep.Message];
