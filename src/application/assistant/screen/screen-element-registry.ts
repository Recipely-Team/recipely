import { CharConstants, ValueConstants } from '@core/constants';
import { ScreenElementKind } from '@domain/assistant/screen/screen-element-kind';
import { matchScreenLabel } from '@domain/assistant/screen/match-screen-label';
import { normalizeScreenLabel } from '@domain/assistant/screen/normalize-screen-label';
import { ScreenPressOutcome } from '@application/assistant/screen/screen-press-outcome';
import type { ScreenElement } from '@application/assistant/screen/screen-element';
import type { ScreenSnapshot } from '@application/assistant/screen/screen-snapshot';

/**
 * Every text and control the UI has on screen, so the assistant sees and can
 * press what the user sees — without each screen describing itself.
 *
 * @remarks
 * - **The UI registers itself.** `ThemedText` and the app's `Pressable` add an
 *   element on mount and remove it on unmount; a new screen, sheet or dialog is
 *   covered the day it is written.
 * - **Mount order is reading order**, near enough: a screen's header mounts
 *   before its list, a sheet after the screen under it.
 * - **Only what is visible counts.** Each element answers whether its screen is
 *   the focused one; screens under the stack stay mounted but are not read.
 * - **A press is the user's own tap.** It calls the same handler the finger
 *   would, so every rule behind the button still applies.
 */
export class ScreenElementRegistry {
  private readonly elements = new Set<ScreenElement>();

  register(element: ScreenElement): () => void {
    this.elements.add(element);
    return () => {
      this.elements.delete(element);
    };
  }

  snapshot(): ScreenSnapshot {
    const texts: string[] = [];
    const controls: string[] = [];
    for (const element of this.visible()) {
      const label = this.labelOf(element);
      if (label === CharConstants.empty) continue;
      if (element.kind === ScreenElementKind.Text) {
        if (texts[texts.length - ValueConstants.one] !== label) texts.push(label);
      } else if (this.isEnabled(element) && !controls.includes(label)) {
        controls.push(label);
      }
    }
    return { texts, controls };
  }

  /** Presses the one enabled control whose label matches what was said. */
  press(query: string): { readonly outcome: ScreenPressOutcome; readonly label?: string; readonly candidates: readonly string[] } {
    const controls = this.visible().filter(
      (element) => element.kind === ScreenElementKind.Control && this.isEnabled(element) && this.labelOf(element) !== CharConstants.empty,
    );
    const labels = controls.map((element) => this.labelOf(element));
    const at = matchScreenLabel(labels, query);
    const target = at === null ? undefined : controls[at];
    if (at === null || target === undefined) {
      const wanted = normalizeScreenLabel(query);
      const candidates = labels.filter((label) => normalizeScreenLabel(label).includes(wanted));
      return { outcome: candidates.length > ValueConstants.one ? ScreenPressOutcome.Ambiguous : ScreenPressOutcome.NotFound, candidates };
    }
    target.press?.();
    return { outcome: ScreenPressOutcome.Pressed, label: labels[at] ?? CharConstants.empty, candidates: [] };
  }

  private visible(): ScreenElement[] {
    return [...this.elements].filter((element) => this.safely(() => element.isVisible(), false));
  }

  private labelOf(element: ScreenElement): string {
    return this.safely(() => element.label().trim(), CharConstants.empty);
  }

  private isEnabled(element: ScreenElement): boolean {
    return this.safely(() => element.isEnabled?.() ?? true, false);
  }

  // A throwing getter must not take the whole reading with it.
  private safely<T>(read: () => T, fallback: T): T {
    try {
      return read();
    } catch {
      return fallback;
    }
  }
}
