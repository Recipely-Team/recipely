/** One ingredient chip: a stable key (names repeat across undo), the name, and whether the scan was sure of it. */
export interface FridgeChip {
  readonly key: string;
  readonly name: string;
  readonly sure: boolean;
}
