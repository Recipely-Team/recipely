import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure/failure';

/**
 * Contract for a mapper that reconstitutes a domain object from a DTO,
 * validating as it goes. Mappers stay plain functions (never classes, per the
 * transformer rule); this type only names their shape so every DTO→domain
 * mapper across infrastructure reads uniformly. `TFailure` narrows the failure
 * channel (e.g. `ValidationFailure`) and defaults to the `Failure` base.
 */
export type Mapper<TDto, TDomain, TFailure extends Failure = Failure> = (
  dto: TDto,
) => Result<TDomain, TFailure>;
