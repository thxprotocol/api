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
        const url = TEST_URL.split('/');
        const id = url[url.length - 1];

        http.get('/v1/arweave/' + id)
            .set('Authorization', dashboardAccessToken)
            .expect(200, done);
    });
});
