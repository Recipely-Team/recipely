// Body of `POST /recipes/generate` — what the user asked the AI to cook.
export interface GenerateRecipeRequestDto {
  prompt: string;
}
