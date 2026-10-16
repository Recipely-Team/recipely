import { useContext } from 'react';
import { GuessedLinesContext } from '@presentation/app/create-recipe/model/review/guessed-lines-context';

/** Whether this line is one the import guessed and the user has not edited yet. */
export const useIsGuessed = (value: string): boolean => useContext(GuessedLinesContext).has(value.trim());
