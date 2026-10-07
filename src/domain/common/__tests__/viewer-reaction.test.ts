import { ViewerReaction } from '@domain/common/viewer-reaction';

describe('ViewerReaction', () => {
  describe('of', () => {
    it('holds the count and the standing it is given', () => {
      const reaction = ViewerReaction.of(4, true);

      expect(reaction.count).toBe(4);
      expect(reaction.mine).toBe(true);
    });

    it('reads a negative count as zero', () => {
      expect(ViewerReaction.of(-3, false).count).toBe(0);
    });

    it('reads a non-finite count as zero', () => {
      expect(ViewerReaction.of(Number.NaN, false).count).toBe(0);
      expect(ViewerReaction.of(Number.POSITIVE_INFINITY, true).count).toBe(0);
    });

    it('drops a fractional part', () => {
      expect(ViewerReaction.of(2.7, false).count).toBe(2);
    });
  });

  describe('set', () => {
    it('counts the viewer in when they react', () => {
      const next = ViewerReaction.of(4, false).set(true);

      expect(next.mine).toBe(true);
      expect(next.count).toBe(5);
    });

    it('counts the viewer out when they take it back', () => {
      const next = ViewerReaction.of(4, true).set(false);

      expect(next.mine).toBe(false);
      expect(next.count).toBe(3);
    });

    it('changes nothing when the standing is already the asked one', () => {
      const reaction = ViewerReaction.of(4, true);

      expect(reaction.set(true)).toBe(reaction);
    });

    it('never counts below zero from a stale number', () => {
      expect(ViewerReaction.of(0, true).set(false).count).toBe(0);
    });

    it('does not mutate the reaction it was called on', () => {
      const reaction = ViewerReaction.of(1, false);
      reaction.set(true);

      expect(reaction.count).toBe(1);
      expect(reaction.mine).toBe(false);
    });
  });

  describe('toggled', () => {
    it('flips the standing and moves the count with it', () => {
      const liked = ViewerReaction.of(9, false).toggled();

      expect(liked.mine).toBe(true);
      expect(liked.count).toBe(10);
      expect(liked.toggled().equals(ViewerReaction.of(9, false))).toBe(true);
    });

    it('never counts below zero when toggling off a zero count', () => {
      expect(ViewerReaction.of(0, true).toggled().count).toBe(0);
    });
  });

  describe('equals', () => {
    it('is equal by count and standing', () => {
      expect(ViewerReaction.of(3, true).equals(ViewerReaction.of(3, true))).toBe(true);
    });

    it('differs when the count differs', () => {
      expect(ViewerReaction.of(3, true).equals(ViewerReaction.of(4, true))).toBe(false);
    });

    it('differs when the standing differs', () => {
      expect(ViewerReaction.of(3, true).equals(ViewerReaction.of(3, false))).toBe(false);
    });
  });
});
