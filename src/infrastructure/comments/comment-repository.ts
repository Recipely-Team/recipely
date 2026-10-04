import { fail, ok } from '@core/result/result-helpers';
import { toPageQuery } from '@infrastructure/network/paging/to-page-query';
import { toPage } from '@infrastructure/network/paging/to-page';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { CommentEntity } from '@domain/comments/comment-entity';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { CommentDto } from '@infrastructure/comments/dtos/comment-dto';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { ValueConstants } from '@core/constants';
import type { AddCommentRequestDto } from '@infrastructure/comments/dtos/add-comment-request-dto';
import type { Page } from '@domain/common/page';
import type { PageDto } from '@infrastructure/network/paging/page-dto';

/**
 * Implements `CommentRepositoryInterface` against the Recipely backend. Supports
 * paginated listing, adding, and removing comments scoped to a recipe.
 */
export class CommentRepository implements CommentRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async listByRecipe(
    recipeId: string,
    page: number,
    pageSize: number,
  ): Promise<Result<Page<CommentEntity>, Failure>> {
    const result = await this.http.get<PageDto<CommentDto>>(ApiRoutes.recipes.comments(recipeId), {
      params: toPageQuery({ page, pageSize }),
    });
    if (!result.ok) {
      return result;
    }
    const items: CommentEntity[] = [];
    for (const dto of result.value.items) {
      const mapped = mapDtoToComment(dto);
      if (!mapped.ok) {
        return fail(mapped.failure);
      }
      items.push(mapped.value);
    }
    // Strict: one unreadable comment fails the page, as before; `toPage` only wraps the envelope.
    return ok(toPage({ ...result.value, items }, ok));
  }

  async add(recipeId: string, body: string): Promise<Result<CommentEntity, Failure>> {
    const result = await this.http.post<CommentDto>(ApiRoutes.recipes.comments(recipeId), { body } satisfies AddCommentRequestDto);
    if (!result.ok) {
      return result;
    }
    return mapDtoToComment(result.value);
  }

  async remove(recipeId: string, commentId: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.recipes.comment(recipeId, commentId));
    if (!result.ok) {
      return result;
    }
    return ok(undefined);
  }

  async like(recipeId: string, commentId: string): Promise<Result<void, Failure>> {
    const result = await this.http.post(ApiRoutes.recipes.commentLike(recipeId, commentId), undefined);
    if (!result.ok) return fail(result.failure);
    return ok(undefined);
  }

  async unlike(recipeId: string, commentId: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete(ApiRoutes.recipes.commentLike(recipeId, commentId));
    if (!result.ok) return fail(result.failure);
    return ok(undefined);
  }
}

function mapDtoToComment(dto: CommentDto): Result<CommentEntity, Failure> {
  return CommentEntity.create({
    id: dto.id,
    body: dto.body,
    authorId: dto.authorId,
    recipeId: dto.recipeId,
    createdAt: new Date(dto.createdAt),
    authorDisplayName: dto.authorDisplayName,
    authorPhotoUrl: dto.authorPhotoUrl,
    likeCount: dto.likeCount ?? ValueConstants.zero,
    likedByMe: dto.likedByMe ?? false,
  });
}
