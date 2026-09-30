import { StoreStatus } from '@application/store/store-status';
import { LocaleConstants } from '@application/i18n/locale-constants';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { DiaryDay } from '@domain/diary/day/diary-day';
import { MealSlot } from '@domain/diary/meal-slot';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { DiaryDayBody } from '@presentation/app/diary/body/diary-day-body';
import { setLocale, t } from '@presentation/i18n';

const date = CalendarDate.of(2026, 9, 30);

const dayOf = (calories: number[]): DiaryDay =>
  DiaryDay.of({
    date,
    goals: NutritionGoals.defaults(),
    waterGlasses: 5,
    entries: calories.map((kcal, i) =>
      foodLogEntryOf({ id: `e${i}`, name: `Food ${i}`, meal: MealSlot.Lunch, nutrients: nutrientsOf({ calories: kcal }) }),
    ),
  });

const render = (day: DiaryDay, isFirstDay = false): string[] =>
  textContent(
    renderComponent(
      <DiaryDayBody
        view={{ status: StoreStatus.Loaded, day }}
        isFirstDay={isFirstDay}
        wide={false}
        mealColumns={1}
        onAdd={jest.fn()}
        onEdit={jest.fn()}
        onOpenGoals={jest.fn()}
        onWater={jest.fn()}
        onRetry={jest.fn()}
      />,
    ).root,
  );

describe('DiaryDayBody', () => {
  beforeAll(() => setLocale(LocaleConstants.en));
  const strings = () => t().diary;

  it('empty first day: welcome card, the whole goal left, every meal empty', () => {
    const text = render(dayOf([]), true);
    expect(text).toContain(strings().welcomeTitle);
    expect(text).toContain('2,000');
    expect(text).toContain(strings().kcalLeft);
    expect(text.filter((line) => line === strings().nothingLogged)).toHaveLength(4);
  });

  it('filled day: the entry row, no welcome, no status strip while under goal', () => {
    const text = render(dayOf([600]));
    expect(text).not.toContain(strings().welcomeTitle);
    expect(text).toContain('Food 0');
    expect(text).toContain('1,400');
    expect(text).not.toContain(strings().withinGoal);
    expect(text.filter((line) => line === strings().nothingLogged)).toHaveLength(3);
  });

  it('over goal: "+269 kcal over" in the ring and the strip says by how much', () => {
    const text = render(dayOf([1200, 1069]));
    expect(text).toContain('+269');
    expect(text).toContain(strings().kcalOver);
    expect(text).toContain(strings().overGoal.replace('{n}', '269'));
  });
});
