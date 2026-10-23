import type { FirstPageCache } from '@infrastructure/network/paging/first-page-cache';
import { FIRST_PAGE } from '@domain/common/first-page';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import type { Page } from '@domain/common/page';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import type { ShoppingItemChanges } from '@domain/shopping/items/shopping-item-changes';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { PageDto } from '@infrastructure/network/paging/page-dto';
import { toPage } from '@infrastructure/network/paging/to-page';
import { toPageQuery } from '@infrastructure/network/paging/to-page-query';
import type { ShoppingItemDto } from '@infrastructure/shopping/dtos/shopping-item-dto';
import type { ShoppingAddResponseDto } from '@infrastructure/shopping/dtos/shopping-add-response-dto';
import type { ShoppingDeletedDto } from '@infrastructure/shopping/dtos/shopping-deleted-dto';
import type { ShoppingSummaryDto } from '@infrastructure/shopping/dtos/shopping-summary-dto';
import { toShoppingItem } from '@infrastructure/shopping/to-shopping-item';
import { toShoppingAddRequest } from '@infrastructure/shopping/to-shopping-add-request';
import { toShoppingAddResult } from '@infrastructure/shopping/to-shopping-add-result';
import { toShoppingItemChangesRequest } from '@infrastructure/shopping/to-shopping-item-changes-request';

/**
 * Implements `ShoppingListRepositoryInterface` against `/me/shopping-list`.
 * The list is a `PageResult` envelope read through `toPage` (no `hasMore` on
 * the wire; `toPage` derives it), which skips an unreadable line.
 */
export class ShoppingListRepository implements ShoppingListRepositoryInterface {
  constructor(
    private readonly http: AxiosHttpClient,
    private readonly firstPageCache?: FirstPageCache<ShoppingItemDto>,
  ) {}

  async list(page: number, pageSize: number): Promise<Result<Page<ShoppingItemEntity>, Failure>> {
    const fetched = await this.http.get<PageDto<ShoppingItemDto>>(ApiRoutes.shopping.list, { params: toPageQuery({ page, pageSize }) });
    // Offline in a shop: open on the list as it was last seen.
    const result = (await this.firstPageCache?.readThrough(String(pageSize), page === FIRST_PAGE, fetched)) ?? fetched;
    return result.ok ? ok(toPage(result.value, toShoppingItem)) : result;
  }

  async countToBuy(): Promise<Result<number, Failure>> {
    const result = await this.http.get<ShoppingSummaryDto>(ApiRoutes.shopping.summary);
    if (!result.ok) return result;
    return Number.isInteger(result.value.unchecked) && result.value.unchecked >= ValueConstants.zero
      ? ok(result.value.unchecked)
      : fail(new ValidationFailure(DiagnosticMessage.shopping.summaryInvalid));
  }

  async add(drafts: readonly ShoppingItemDraft[]): Promise<Result<ShoppingAddResult, Failure>> {
    const result = await this.http.post<ShoppingAddResponseDto>(ApiRoutes.shopping.items, toShoppingAddRequest(drafts));
    return result.ok ? toShoppingAddResult(result.value) : result;
  }

  async update(id: string, changes: ShoppingItemChanges): Promise<Result<ShoppingItemEntity, Failure>> {
    const result = await this.http.patch<ShoppingItemDto>(ApiRoutes.shopping.item(id), toShoppingItemChangesRequest(changes));
    return result.ok ? toShoppingItem(result.value) : result;
  }

  async remove(id: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.shopping.item(id));
    return result.ok ? ok(undefined) : result;
  }

  async removeChecked(): Promise<Result<number, Failure>> {
    const result = await this.http.delete<ShoppingDeletedDto>(ApiRoutes.shopping.checked);
    return result.ok ? ok(result.value.deleted) : result;
  }

  async removeAll(): Promise<Result<number, Failure>> {
    const result = await this.http.delete<ShoppingDeletedDto>(ApiRoutes.shopping.list);
    return result.ok ? ok(result.value.deleted) : result;
  }
}
