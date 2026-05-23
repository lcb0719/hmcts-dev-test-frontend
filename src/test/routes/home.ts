import { app } from '../../main/app';

import { expect } from 'chai';
import request from 'supertest';

describe('Home page', () => {
  describe('on GET', () => {
    test('should redirect to tasks', async () => {
      await request(app)
        .get('/')
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers.location).to.equal('/tasks');
        });
    });
  });
});
