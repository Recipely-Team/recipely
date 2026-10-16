import { createContext } from 'react';

/**
 * The guessed lines of an imported draft, for the ingredient and step rows.
 * A context rather than a prop: the ingredient group card between the editor
 * and its rows is at the file-size cap, and only the leaves need it.
 */
export const GuessedLinesContext = createContext<ReadonlySet<string>>(new Set());
