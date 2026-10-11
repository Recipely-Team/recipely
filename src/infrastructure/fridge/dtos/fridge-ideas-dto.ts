import type { FridgeIdeaDto } from '@infrastructure/fridge/dtos/fridge-idea-dto';

/** `POST /fridge/ideas` response — usually three, fewer after tight filters. */
export interface FridgeIdeasDto {
  ideas: FridgeIdeaDto[];
}
