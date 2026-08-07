/**
 * `isFirstLoad` decides between two things that look identical in the data and
 * are opposites to a reader: "you have nothing here" and "the answer has not
 * arrived yet".
 *
 * The bug it exists to prevent: My Recipes rendered its empty state — a big icon
 * and "no saved recipes yet" — for the whole of every cold load, then swapped in
 * the rows once they arrived. The screen said the user had nothing, and then
 * contradicted itself.
 */

import { StoreStatus } from '@application/store/store-status';
import { isFirstLoad } from '@presentation/app/my-recipes/model/is-first-load';

describe('isFirstLoad', () => {
  describe('nothing on screen yet', () => {
    it('is true before a load has been asked for', () => {
      // Idle is the state the store mounts in, so this is the very first frame
      // — the one that used to read "you have no recipes".
      expect(isFirstLoad(StoreStatus.Idle, 0)).toBe(true);
    });

    it('is true while the load is in flight', () => {
      expect(isFirstLoad(StoreStatus.Loading, 0)).toBe(true);
    });

    it('is false once the load has come back empty — that IS an empty tab', () => {
      expect(isFirstLoad(StoreStatus.Loaded, 0)).toBe(false);
    });

    it('is false when the load failed, so the tab can show its own state', () => {
      expect(isFirstLoad(StoreStatus.Error, 0)).toBe(false);
    });
  });

  describe('rows already on screen', () => {
    it.each([StoreStatus.Idle, StoreStatus.Loading, StoreStatus.Loaded])(
      'is false with rows in hand, whatever the status says (%s)',
      (status) => {
        // A re-focus reloads a list the user is already reading. Swapping their
        // rows for a skeleton would be a worse flash than the one being fixed.
        expect(isFirstLoad(status, 3)).toBe(false);
      },
    );
  });
});
