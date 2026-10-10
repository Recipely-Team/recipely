import { useEffect } from 'react';
import { FridgeAvailability, type FridgeAvailabilityType } from '@application/fridge/fridge-availability';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Whether "Cook from my fridge" is on (flag `fridgeToRecipe`, rule 23g) — asked
 * once per launch through the fridge store; `Unknown` until the answer lands.
 * Entry points render nothing unless it is `On`.
 */
export const useFridgeAvailability = (): FridgeAvailabilityType => {
  const { fridgeStore } = useStores();
  const availability = fridgeStore((s) => s.availability);
  const check = fridgeStore((s) => s.checkAvailability);
  useEffect(() => {
    if (availability === FridgeAvailability.Unknown) void check();
  }, [availability, check]);
  return availability;
};
