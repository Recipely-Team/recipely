export interface WebShellStateValue {
  /** Global search query driven by the WebHeader search input. */
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}
