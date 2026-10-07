import { ok } from '@core/result/result-helpers';
import { MealParseInputKind } from '@domain/diary/meal/meal-parse-input-kind';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import type { RecordedRequest } from '@infrastructure/network/http/__fixtures__/recorded-request';
import { AI_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import { FoodDiaryRepository } from '@infrastructure/diary/food-diary-repository';

const answer = {
  items: [
    { label: 'menemen', grams: 200, match: { kind: 'food', id: 'v1', name: 'Menemen' }, nutrientsPerPortion: { kcal: 220, protein: 12, carbs: 8, fat: 15, fiber: 2 }, estimated: false, confidence: 0.9 },
  ],
  note: 'some_estimated',
};

/** Records every JSON request and every multipart upload, answering both with `answer`. */
const makeHttp = () => {
  const requests: RecordedRequest[] = [];
  const uploads: { url: string; form: FormData; timeout: number | undefined }[] = [];
  const http = {
    ...withHttpVerbs((config) => {
      requests.push(config);
      return Promise.resolve(ok(answer));
    }),
    uploadMultipart: jest.fn((url: string, form: FormData, _progress?: unknown, timeout?: number) => {
      uploads.push({ url, form, timeout });
      return Promise.resolve(ok(answer));
    }),
  } as unknown as HttpClient;
  return { http, requests, uploads };
};

describe('FoodDiaryRepository.parseMeal', () => {
  it('POSTs a description as JSON (text trimmed, locale kept) with the AI timeout, and maps the candidates', async () => {
    const { http, requests, uploads } = makeHttp();
    const r = await new FoodDiaryRepository(http).parseMeal({ kind: MealParseInputKind.Text, text: ' menemen ', locale: 'tr' });
    expect(uploads).toHaveLength(0);
    expect(requests[0]).toMatchObject({ method: 'POST', url: '/diary/meal-parse', data: { text: 'menemen', locale: 'tr' }, timeout: AI_REQUEST_TIMEOUT_MS });
    expect(r.ok && [r.value.items[0]?.label, r.value.items[0]?.nutrients.calories, r.value.note]).toEqual(['menemen', 220, 'some_estimated']);
  });

  it('leaves the locale out of the JSON body when it is unknown', async () => {
    const { http, requests } = makeHttp();
    await new FoodDiaryRepository(http).parseMeal({ kind: MealParseInputKind.Text, text: 'tea', locale: null });
    expect(requests[0]?.data).toEqual({ text: 'tea' });
  });

  it('uploads a photo as multipart with a `photo` file part and a `locale` field', async () => {
    const { http, requests, uploads } = makeHttp();
    const r = await new FoodDiaryRepository(http).parseMeal({
      kind: MealParseInputKind.Photo, uri: 'file:///meal.jpg', fileName: 'meal-1.jpg', mimeType: 'image/jpeg', locale: 'en',
    });
    expect(requests).toHaveLength(0);
    expect(uploads[0]?.url).toBe('/diary/meal-parse');
    expect(uploads[0]?.timeout).toBe(AI_REQUEST_TIMEOUT_MS);
    const form = uploads[0]?.form;
    expect([form?.has('photo'), form?.get('locale')]).toEqual([true, 'en']);
    expect(r.ok && r.value.items).toHaveLength(1);
  });
});
