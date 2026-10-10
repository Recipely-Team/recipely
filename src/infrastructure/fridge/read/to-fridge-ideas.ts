import { ok } from '@core/result/result-helpers';
import type { Mapper } from '@core/mapper/mapper';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeIdeasDto } from '@infrastructure/fridge/dtos/fridge-ideas-dto';
import { toFridgeIdea } from '@infrastructure/fridge/read/to-fridge-idea';

/** `POST /fridge/ideas` response → the ideas shown; one that fails mapping is skipped, the rest still land. */
export const toFridgeIdeas: Mapper<FridgeIdeasDto, readonly FridgeIdea[]> = (dto) =>
  ok(
    dto.ideas.flatMap((idea) => {
      const mapped = toFridgeIdea(idea);
      return mapped.ok ? [mapped.value] : [];
    }),
  );
