import { HTTPError } from '../../main/HttpError';

describe('HTTPError', () => {
  test('sets message and status', () => {
    const error = new HTTPError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error).toBeInstanceOf(Error);
  });
});
