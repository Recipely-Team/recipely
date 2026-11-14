import { ok } from '@core/result/result-helpers';
import type { Mapper } from '@core/mapper/mapper';
import type { PremiumEntitlement } from '@domain/subscriptions/premium-entitlement';
import type { PremiumEntitlementDto } from '@infrastructure/subscriptions/dtos/premium-entitlement-dto';

/** The backend's entitlement answer; a missing expiry is no expiry. */
export const toPremiumEntitlement: Mapper<PremiumEntitlementDto, PremiumEntitlement> = (dto) =>
  ok({ isPremium: dto.isPremium, expiresAt: dto.expiresAt ?? null });
