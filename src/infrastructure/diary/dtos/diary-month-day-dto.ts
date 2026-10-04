// One day row of `GET /diary/months/:month` — only days with something logged.
export interface DiaryMonthDayDto {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entryCount: number;
}
