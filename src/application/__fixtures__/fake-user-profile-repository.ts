import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { CreatorPage } from '@domain/creators/creator-page';
import type { RecipePage } from '@domain/recipes/list/recipe-page';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';

const NOT_UNDER_TEST = 'not under test';

type Answer<T> = Result<T, Failure> | Promise<Result<T, Failure>>;

/**
 * A user-profile repository whose answers a test sets per call, and which
 * records what it was asked. An answer may be a promise the test resolves
 * later, to order two requests.
 */
export class FakeUserProfileRepository implements UserProfileRepositoryInterface {
  readonly viewedCalls: string[] = [];
  readonly recipeCalls: [string, number, number][] = [];
  readonly followCalls: string[] = [];
  readonly unfollowCalls: string[] = [];
  viewedAnswers: Answer<ViewedUserProfile>[] = [];
  recipeAnswers: Answer<RecipePage>[] = [];
  followAnswer: Answer<void> = ok(undefined);
  unfollowAnswer: Answer<void> = ok(undefined);

  getById(): Promise<Result<UserProfileEntity, Failure>> {
    return Promise.resolve(fail(new NetworkFailure(NOT_UNDER_TEST)));
  }

  getViewedProfile(userId: string): Promise<Result<ViewedUserProfile, Failure>> {
    this.viewedCalls.push(userId);
    return Promise.resolve(this.viewedAnswers.shift() ?? fail(new NetworkFailure(NOT_UNDER_TEST)));
  }

  listUserRecipes(userId: string, page: number, pageSize: number): Promise<Result<RecipePage, Failure>> {
    this.recipeCalls.push([userId, page, pageSize]);
    return Promise.resolve(this.recipeAnswers.shift() ?? fail(new NetworkFailure(NOT_UNDER_TEST)));
  }

  follow(userId: string): Promise<Result<void, Failure>> {
    this.followCalls.push(userId);
    return Promise.resolve(this.followAnswer);
  }

  unfollow(userId: string): Promise<Result<void, Failure>> {
    this.unfollowCalls.push(userId);
    return Promise.resolve(this.unfollowAnswer);
  }

  listCreators(): Promise<Result<CreatorPage, Failure>> {
    return Promise.resolve(fail(new NetworkFailure(NOT_UNDER_TEST)));
  }
}
