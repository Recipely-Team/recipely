import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { CommentEntity } from '@domain/comments/comment-entity';
import type { ICommentRepository } from '@domain/comments/i-comment-repository';
import type { CommentPage } from '@domain/comments/comment-page';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { CommentDto } from '@infrastructure/comments/dtos/comment-dto';
import type { CommentPageDto } from '@infrastructure/comments/dtos/comment-page-dto';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import { ValueConstants } from '@core/constants';

/**
 * Implements `ICommentRepository` against the Recipely backend. Supports
 * paginated listing, adding, and removing comments scoped to a recipe.
 */
export class CommentRepository implements ICommentRepository {
  constructor(private readonly http: HttpClient) {}

  async listByRecipe(
    recipeId: string,
    page: number,
    pageSize: number,
  ): Promise<Result<CommentPage, Failure>> {
    const result = await this.http.request<CommentPageDto>({
      method: 'GET',
      url: ApiRoutes.recipes.comments(recipeId),
      params: { page, pageSize },
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
    return ok({
      items,
      total: result.value.total,
      page: result.value.page,
      pageSize: result.value.pageSize,
    });
  }

  async add(recipeId: string, body: string): Promise<Result<CommentEntity, Failure>> {
    const result = await this.http.request<CommentDto>({
      method: 'POST',
      url: ApiRoutes.recipes.comments(recipeId),
      data: { body },
    });
    if (!result.ok) {
      return result;
    }
    return mapDtoToComment(result.value);
  }

  async remove(recipeId: string, commentId: string): Promise<Result<void, Failure>> {
    const result = await this.http.request<unknown>({
      method: 'DELETE',
      url: ApiRoutes.recipes.comment(recipeId, commentId),
    });
    if (!result.ok) {
      return result;
    }
    return ok(undefined);
  }

  async like(recipeId: string, commentId: string): Promise<Result<void, Failure>> {
    const result = await this.http.request({
      method: 'POST',
      url: ApiRoutes.recipes.commentLike(recipeId, commentId),
    });
    if (!result.ok) return fail(result.failure);
    return ok(undefined);
  }

  async unlike(recipeId: string, commentId: string): Promise<Result<void, Failure>> {
    const result = await this.http.request({
      method: 'DELETE',
      url: ApiRoutes.recipes.commentLike(recipeId, commentId),
    });
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
