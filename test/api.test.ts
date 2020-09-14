import request from 'supertest';
import app from '../src/app';

describe('GET /account', () => {
    it('should return 401 when not authenticated', (done) => {
        request(app).get('/v1/account').expect(401, done);
    });
});
