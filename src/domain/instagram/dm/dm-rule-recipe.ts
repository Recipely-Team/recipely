/** The recipe a rule sends, as the rule carries it; by id only (rule 20). */
export interface DmRuleRecipe {
  readonly id: string;
  readonly name: string;
  readonly image: string | null;
}
