import request, { Response } from 'supertest';

import app from '@/app';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { dashboardAccessToken } from '@/util/jest/constants';

const http = request.agent(app);
const testImage = `${__dirname}/../../assets/test.jpeg`;

describe('Arweave', () => {
    beforeAll(beforeAllCallback);
    afterAll(afterAllCallback);

    let TEST_URL = '';

    it('PUT /v1/arweave', (done) => {
        http.put('/v1/arweave/')
            .set('Authorization', dashboardAccessToken)
            .attach('file', testImage, { contentType: 'image/jpeg' })
            .expect((res: Response) => {
                expect(res.body['publicUrl']).not.toBeNull();
                TEST_URL = res.body['publicUrl'];
            })
            .expect(200, done);
    });

    it('GET /v1/arweave', (done) => {
        http.get('/v1/arweave/' + TEST_URL.split('/')[TEST_URL.split('/').length - 1])
            .set('Authorization', dashboardAccessToken)
            .expect(200, done);
    });
});
