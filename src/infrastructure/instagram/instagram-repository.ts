import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { Page } from '@domain/common/page';
import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import type { InstagramLinkResult } from '@domain/instagram/connect/instagram-link-result';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import type { DmRuleChanges } from '@domain/instagram/dm/dm-rule-changes';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { PageDto } from '@infrastructure/network/paging/page-dto';
import { toPage } from '@infrastructure/network/paging/to-page';
import { toPageQuery } from '@infrastructure/network/paging/to-page-query';
import type { InstagramConnectionDto } from '@infrastructure/instagram/dtos/instagram-connection-dto';
import type { InstagramStartDto } from '@infrastructure/instagram/dtos/instagram-start-dto';
import type { InstagramFinalizeDto } from '@infrastructure/instagram/dtos/instagram-finalize-dto';
import type { InstagramMediaDto } from '@infrastructure/instagram/dtos/instagram-media-dto';
import type { DmRuleDto } from '@infrastructure/instagram/dtos/dm-rule-dto';
import type { DmSendDto } from '@infrastructure/instagram/dtos/dm-send-dto';
import { toInstagramStartQuery } from '@infrastructure/instagram/write/to-instagram-start-query';
import { toInstagramFinalizeRequest } from '@infrastructure/instagram/write/to-instagram-finalize-request';
import { toDmRuleRequest } from '@infrastructure/instagram/write/to-dm-rule-request';
import { toDmRuleChangesRequest } from '@infrastructure/instagram/write/to-dm-rule-changes-request';
import { toInstagramConnection } from '@infrastructure/instagram/read/to-instagram-connection';
import { toInstagramLinkResult } from '@infrastructure/instagram/read/to-instagram-link-result';
import { toInstagramMedia } from '@infrastructure/instagram/read/to-instagram-media';
import { toDmRule } from '@infrastructure/instagram/read/to-dm-rule';
import { toDmSend } from '@infrastructure/instagram/read/to-dm-send';

/**
 * Implements `InstagramRepositoryInterface` against backend #374. Lists are
 * `PageResult` envelopes read through `toPage`, which skips an unreadable row.
 */
export class InstagramRepository implements InstagramRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async getConnection(): Promise<Result<InstagramConnection, Failure>> {
    const result = await this.http.get<InstagramConnectionDto>(ApiRoutes.instagram.connection);
    return result.ok ? toInstagramConnection(result.value) : result;
  }

  async startLogin(returnTo: string): Promise<Result<string, Failure>> {
    const result = await this.http.get<InstagramStartDto>(ApiRoutes.instagram.start, { params: toInstagramStartQuery(returnTo) });
    return result.ok ? ok(result.value.url) : result;
  }

  async finalize(code: string): Promise<Result<InstagramLinkResult, Failure>> {
    const result = await this.http.post<InstagramFinalizeDto>(ApiRoutes.instagram.finalize, toInstagramFinalizeRequest(code));
    return result.ok ? toInstagramLinkResult(result.value) : result;
  }

  async disconnect(): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.instagram.connection);
    return result.ok ? ok(undefined) : result;
  }

  async listMedia(page: number, pageSize: number): Promise<Result<Page<InstagramMedia>, Failure>> {
    const result = await this.http.get<PageDto<InstagramMediaDto>>(ApiRoutes.instagram.media, { params: toPageQuery({ page, pageSize }) });
    return result.ok ? ok(toPage(result.value, toInstagramMedia)) : result;
  }

  async listRules(page: number, pageSize: number): Promise<Result<Page<DmRuleEntity>, Failure>> {
    const result = await this.http.get<PageDto<DmRuleDto>>(ApiRoutes.instagram.rules, { params: toPageQuery({ page, pageSize }) });
    return result.ok ? ok(toPage(result.value, toDmRule)) : result;
  }

  async getRule(id: string): Promise<Result<DmRuleEntity, Failure>> {
    const result = await this.http.get<DmRuleDto>(ApiRoutes.instagram.rule(id));
    return result.ok ? toDmRule(result.value) : result;
  }

  async createRule(draft: DmRuleDraft): Promise<Result<DmRuleEntity, Failure>> {
    const result = await this.http.post<DmRuleDto>(ApiRoutes.instagram.rules, toDmRuleRequest(draft));
    return result.ok ? toDmRule(result.value) : result;
  }

  async updateRule(id: string, changes: DmRuleChanges): Promise<Result<DmRuleEntity, Failure>> {
    const result = await this.http.patch<DmRuleDto>(ApiRoutes.instagram.rule(id), toDmRuleChangesRequest(changes));
    return result.ok ? toDmRule(result.value) : result;
  }

  async deleteRule(id: string): Promise<Result<void, Failure>> {
    const result = await this.http.delete<unknown>(ApiRoutes.instagram.rule(id));
    return result.ok ? ok(undefined) : result;
  }

  async listSends(ruleId: string, page: number, pageSize: number): Promise<Result<Page<DmSend>, Failure>> {
    const result = await this.http.get<PageDto<DmSendDto>>(ApiRoutes.instagram.sends(ruleId), { params: toPageQuery({ page, pageSize }) });
    return result.ok ? ok(toPage(result.value, toDmSend)) : result;
  }
}
