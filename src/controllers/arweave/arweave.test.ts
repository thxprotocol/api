import request, { Response } from 'supertest';

import app from '@/app';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { dashboardAccessToken } from '@/util/jest/constants';

const http = request.agent(app);
const testImage = `${__dirname}/../../assets/test.jpeg`;

describe('Arweave', () => {
    beforeAll(beforeAllCallback);
    afterAll(afterAllCallback);

    let PUBLIC_URL = '';

    it('PUT /v1/arweave', (done) => {
        http.put('/v1/arweave/')
            .set('Authorization', dashboardAccessToken)
            .attach('file', testImage, { contentType: 'image/jpeg' })
            .expect((res: Response) => {
                expect(res.body['publicUrl']).not.toBeNull();
                PUBLIC_URL = res.body['publicUrl'];
            })
            .expect(200, done);
    });

    it('GET /v1/arweave', (done) => {
        const url = PUBLIC_URL.split('/');
        const id = url[url.length - 1];
        http.get('/v1/arweave/' + id)
            .set('Authorization', dashboardAccessToken)
            .expect(404, done); // it returns this status since the block is not mined yet
    });
});
