import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { FridgeRepositoryInterface } from '@domain/fridge/fridge-repository-interface';
import type { FridgeIngredient } from '@domain/fridge/scan/fridge-ingredient';
import type { FridgeScanInput } from '@domain/fridge/scan/fridge-scan-input';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeIdeasInput } from '@domain/fridge/ideas/fridge-ideas-input';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { AI_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import type { FridgeScanDto } from '@infrastructure/fridge/dtos/fridge-scan-dto';
import type { FridgeIdeasDto } from '@infrastructure/fridge/dtos/fridge-ideas-dto';
import { toFridgeScanForm } from '@infrastructure/fridge/write/to-fridge-scan-form';
import { toFridgeIdeasRequest } from '@infrastructure/fridge/write/to-fridge-ideas-request';
import { toFridgeIngredients } from '@infrastructure/fridge/read/to-fridge-ingredients';
import { toFridgeIdeas } from '@infrastructure/fridge/read/to-fridge-ideas';

/**
 * `/fridge/*` over HTTP: the scan as multipart, the ideas as JSON — both with
 * the AI timeout, since each waits on a model.
 */
export class FridgeRepository implements FridgeRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async scan(input: FridgeScanInput): Promise<Result<readonly FridgeIngredient[], Failure>> {
    const result = await this.http.uploadMultipart<FridgeScanDto>(ApiRoutes.fridge.scan, await toFridgeScanForm(input), undefined, AI_REQUEST_TIMEOUT_MS);
    return result.ok ? toFridgeIngredients(result.value) : result;
  }

  async suggestIdeas(input: FridgeIdeasInput): Promise<Result<readonly FridgeIdea[], Failure>> {
    const result = await this.http.post<FridgeIdeasDto>(ApiRoutes.fridge.ideas, toFridgeIdeasRequest(input), { timeout: AI_REQUEST_TIMEOUT_MS });
    return result.ok ? toFridgeIdeas(result.value) : result;
  }
}
