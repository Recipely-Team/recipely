import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { TabAppBar } from '@presentation/base/widgets/navigation/tab-app-bar';
import { NotificationsBellButton } from '@presentation/base/widgets/navigation/notifications-bell-button';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/** The static Recipes bar on an expanded native viewport, where the collapsing band is not used (design spec → Tab app bar). */
export const RecipesAppHeader = (): React.JSX.Element | null => {
  const { isWebShell } = useLayout();
  if (isWebShell) return null;
  return (
    <TabAppBar
      title={t().recipes.title}
      leading={<RecipelyLogo size={iconSizes.brandInline} />}
      actions={<NotificationsBellButton />}
    />
  );
};
