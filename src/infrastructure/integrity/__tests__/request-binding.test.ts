import { requestBinding } from '@infrastructure/integrity/request-binding';

describe('requestBinding', () => {
  it('joins the upper-cased verb, the path and the request id', () => {
    expect(requestBinding('post', '/recipes/generate', 'rid-1')).toBe('POST /recipes/generate\nrid-1');
  });

  it('leaves the query string out, as the backend rebuilds it from the route', () => {
    expect(requestBinding('GET', '/fridge/ideas?x=1', 'rid-2')).toBe('GET /fridge/ideas\nrid-2');
  });
});
