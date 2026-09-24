import { toProvenanceMarks } from '@domain/recipes/provenance/to-provenance-marks';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { SourcePlatform } from '@domain/recipes/provenance/source-platform';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';

describe('toProvenanceMarks', () => {
  it('draws nothing for a recipe a person wrote', () => {
    expect(toProvenanceMarks(RecipeOrigin.User, null, false)).toEqual([]);
  });

  it('marks an AI-written recipe with the AI mark alone', () => {
    expect(toProvenanceMarks(RecipeOrigin.Ai, null, true)).toEqual([ProvenanceMark.Ai]);
  });

  it('keeps the AI mark for an AI row written before the flag existed', () => {
    expect(toProvenanceMarks(RecipeOrigin.Ai, null, false)).toEqual([ProvenanceMark.Ai]);
  });

  it('names the platform of an import no model touched', () => {
    expect(toProvenanceMarks(RecipeOrigin.Import, SourcePlatform.TikTok, false)).toEqual([
      ProvenanceMark.TikTok,
    ]);
  });

  // The ordinary import: a video from an account, turned into text by a model.
  it('carries both facts for an import a model wrote, platform first', () => {
    expect(toProvenanceMarks(RecipeOrigin.Import, SourcePlatform.Instagram, true)).toEqual([
      ProvenanceMark.Instagram,
      ProvenanceMark.Ai,
    ]);
  });

  it('says only what it knows about an import from a platform it cannot name', () => {
    expect(toProvenanceMarks(RecipeOrigin.Import, null, true)).toEqual([ProvenanceMark.Ai]);
  });
});
