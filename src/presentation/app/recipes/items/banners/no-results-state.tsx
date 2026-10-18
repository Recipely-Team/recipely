import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { t } from '@presentation/i18n';
import { isBlank } from '@core/guards/type-guards';

export interface NoResultsStateProps {
  /** The query the empty result answers — trimmed, as it was sent. */
  query: string;
  /** Opens the AI recipe screen already writing `query`. */
  onCreateWithAi: (query: string) => void;
}

/**
 * What a search that found nothing offers instead of a dead end.
 *
 * @remarks
 * - **The catalogue is small, so "no results" is common.** Telling the user to
 *   try other words sent them away; the AI can write the dish they asked for,
 *   so that is the one action offered, carrying their exact words.
 * - **No query, no offer.** An empty result with only filters set has nothing
 *   to create from, so it keeps the plain "no recipes match" line.
 */
export const NoResultsState = ({ query, onCreateWithAi }: NoResultsStateProps): React.JSX.Element =>
  isBlank(query) ? (
    <ErrorState icon="search" severity={SeverityType.Neutral} title={t().recipes.noResults} body={t().recipes.webEmptyBody} />
  ) : (
    <ErrorState
      icon="sparkles"
      severity={SeverityType.Neutral}
      title={t().recipes.noResultsQuery.replace('{q}', query)}
      body={t().recipes.createWithAiBody}
      primaryLabel={t().recipes.createWithAi.replace('{q}', query)}
      onPrimary={() => onCreateWithAi(query)}
    />
  );
