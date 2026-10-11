import { ok } from '@core/result/result-helpers';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import type { RecordedRequest } from '@infrastructure/network/http/__fixtures__/recorded-request';
import { AI_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import { FridgeRepository } from '@infrastructure/fridge/fridge-repository';
import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';

const SCAN = { ingredients: [{ name: 'eggs', confidence: 'high' }] };
const IDEAS = { ideas: [{ title: 'Omelette', summary: 'Eggs.', totalMinutes: 10, difficulty: 'EASY', uses: ['eggs'], missing: [] }] };

const makeHttp = () => {
  const requests: RecordedRequest[] = [];
  const uploads: { url: string; form: FormData; timeout: number | undefined }[] = [];
  const http = {
    ...withHttpVerbs((config) => {
      requests.push(config);
      return Promise.resolve(ok(IDEAS));
    }),
    uploadMultipart: jest.fn((url: string, form: FormData, _progress?: unknown, timeout?: number) => {
      uploads.push({ url, form, timeout });
      return Promise.resolve(ok(SCAN));
    }),
  } as unknown as HttpClient;
  return { http, requests, uploads };
};

describe('FridgeRepository', () => {
  it('uploads every photo under `photos`, with the locale and the AI timeout, and maps the ingredients', async () => {
    const { http, uploads } = makeHttp();
    const photo = (n: number) => ({ uri: `file:///fridge-${n}.jpg`, fileName: `fridge-${n}.jpg`, mimeType: 'image/jpeg' });
    const r = await new FridgeRepository(http).scan({ photos: [photo(1), photo(2)], locale: 'tr' });
    expect(uploads[0]?.url).toBe('/fridge/scan');
    expect(uploads[0]?.timeout).toBe(AI_REQUEST_TIMEOUT_MS);
    expect(uploads[0]?.form.getAll('photos')).toHaveLength(2);
    expect(uploads[0]?.form.get('locale')).toBe('tr');
    expect(r.ok && r.value).toEqual([{ name: 'eggs', confidence: 'high' }]);
  });

  it('POSTs the ideas request as JSON with the AI timeout and maps the ideas', async () => {
    const { http, requests } = makeHttp();
    const r = await new FridgeRepository(http).suggestIdeas({
      ingredients: ['eggs'], maxMinutes: 15, diet: FridgeDiet.Vegetarian, servings: 2, exclude: ['Frittata'], locale: 'en',
    });
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: '/fridge/ideas',
      data: { ingredients: ['eggs'], maxMinutes: 15, diet: 'vegetarian', servings: 2, exclude: ['Frittata'], locale: 'en' },
      timeout: AI_REQUEST_TIMEOUT_MS,
    });
    expect(r.ok && r.value.map((idea) => idea.title)).toEqual(['Omelette']);
  });
});
