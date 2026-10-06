import { StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { diarySizes } from '@presentation/base/theme';
import { SummaryCard } from '@presentation/app/diary/body/summary-card';
import { WaterCard } from '@presentation/app/diary/body/water-card';
import { MealCard } from '@presentation/app/diary/body/meal-card';
import { WelcomeCard } from '@presentation/app/diary/body/welcome-card';
import { DaySkeleton } from '@presentation/app/diary/body/day-skeleton';
import type { DiaryDayViewType } from '@presentation/app/diary/model/diary-day-view';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface DiaryDayBodyProps {
  view: DiaryDayViewType;
  isFirstDay: boolean;
  wide: boolean;
  /** Meal cards per row: 2 on a wide web column, otherwise 1. */
  mealColumns: number;
  onAdd: (meal: MealSlotType | null) => void;
  onEdit: (entry: FoodLogEntryEntity) => void;
  onOpenGoals: () => void;
  onWater: (glasses: number) => void;
  onRetry: () => void;
}

/**
 * The selected day below the date strip, by state: a skeleton for a day never
 * loaded, the failure with a retry, or the welcome card, summary, water and
 * the four meals.
 */
export const DiaryDayBody = ({ view, isFirstDay, wide, mealColumns, onAdd, onEdit, onOpenGoals, onWater, onRetry }: DiaryDayBodyProps): React.JSX.Element => {
  switch (view.status) {
    case StoreStatus.Loading:
      return <DaySkeleton />;
    case StoreStatus.Error: {
      const content = failureContent(view.failure);
      return (
        <ErrorState
          severity={failureSeverity(view.failure)}
          icon={failureIcon(view.failure)}
          title={content.title}
          body={content.body}
          primaryLabel={t().common.retry}
          onPrimary={onRetry}
        />
      );
    }
    case StoreStatus.Loaded: {
      const { day } = view;
      const cellStyle = mealColumns > ValueConstants.one ? styles.halfCell : styles.fullCell;
      return (
        <View style={styles.stack}>
          {isFirstDay ? <WelcomeCard goalCalories={day.goals.calories} onLogFirstMeal={() => onAdd(null)} onSetGoals={onOpenGoals} /> : null}
          <SummaryCard day={day} wide={wide} />
          <WaterCard day={day} onChange={onWater} />
          <View style={styles.meals}>
            {day.mealGroups.map((group) => (
              <View key={group.meal} style={cellStyle}>
                <MealCard group={group} onAdd={onAdd} onEdit={onEdit} />
              </View>
            ))}
          </View>
        </View>
      );
    }
  }
};

/** Under half, so two meal cards and the gap share a row. */
const TWO_UP_BASIS = '45%';

const styles = StyleSheet.create({
  stack: { gap: diarySizes.mealGap },
  meals: { flexDirection: 'row', flexWrap: 'wrap', gap: diarySizes.mealGap },
  fullCell: { width: '100%' },
  halfCell: { flexGrow: ValueConstants.one, flexBasis: TWO_UP_BASIS },
});
