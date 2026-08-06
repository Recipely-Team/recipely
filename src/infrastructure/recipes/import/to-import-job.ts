import { ok } from '@core/result/result-helpers';
import type { Mapper } from '@core/mapper/mapper';
import type { ImportJob } from '@domain/recipes/import/import-job';
import { ImportJobStatus, isImportJobStatus } from '@domain/recipes/import/import-job-status';
import type { ImportJobDto } from '@infrastructure/recipes/dtos/import-job-dto';

/**
 * `ImportJobDto` -> `ImportJob`.
 *
 * @remarks
 * Never fails, and deliberately so. An unrecognised status degrades to
 * `Running` rather than being rejected: the app ships independently of the
 * backend, so a status added server-side would otherwise fail the request and
 * tell the user their import broke — when in fact it is simply still working,
 * which is what `Running` says. It keeps the `Mapper` shape so every DTO→domain
 * mapper in infrastructure reads the same way.
 */
export const toImportJob: Mapper<ImportJobDto, ImportJob> = (dto) =>
  ok({
    id: dto.id,
    status: isImportJobStatus(dto.status) ? dto.status : ImportJobStatus.Running,
    draftId: dto.draftId,
    errorKey: dto.errorKey,
  });
