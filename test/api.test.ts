import request from 'supertest';
import app from '../src/app';

describe('GET /api', () => {
    it('should return 200 OK', (done) => {
        request(app).get('/').expect(200);
    });
});
