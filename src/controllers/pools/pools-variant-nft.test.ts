import request from 'supertest';
import app from '@/app';
import { ChainId } from '@/types/enums';
import { isAddress } from 'web3-utils';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { account2, dashboardAccessToken } from '@/util/jest/constants';
import { createImage } from '@/util/jest/images';
import { createArchiver } from '@/util/zip';
import { agenda, EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL } from '@/util/agenda';
import { getRewardConfiguration } from '../rewards/utils';
const user = request.agent(app);

describe('NFT Pool', () => {
    let poolId: string,
        tokenAddress: string,
        erc721ID: string,
        metadataId: string,
        metaTitle: string,
        metaDesc: string,
        csvFile: string;

    const chainId = ChainId.Hardhat,
        name = 'Planets of the Galaxy',
        symbol = 'GLXY',
        description = 'Collection full of rarities.',
        schema = [
            { name: 'color', propType: 'string', description: 'lorem ipsum' },
            { name: 'size', propType: 'string', description: 'lorem ipsum dolor sit' },
            { name: 'img', propType: 'image', description: 'image description' },
        ];

    beforeAll(async () => {
        await beforeAllCallback();
    });

    afterAll(afterAllCallback);

    describe('POST /erc721', () => {
        it('should create and return contract details', (done) => {
            user.post('/v1/erc721')
                .set('Authorization', dashboardAccessToken)
                .send({
                    chainId,
                    name,
                    symbol,
                    description,
                    schema,
                })
                .expect(({ body }: request.Response) => {
                    expect(body._id).toBeDefined();
                    expect(body.address).toBeDefined();
                    tokenAddress = body.address;
                    erc721ID = body._id;
                })
                .expect(201, done);
        });
    });

    describe('POST /pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    chainId: ChainId.Hardhat,
                    erc20tokens: [],
                    erc721tokens: [tokenAddress],
                })
                .expect(({ body }: request.Response) => {
                    expect(isAddress(body.address)).toBe(true);
                    poolId = body._id;
                })
                .expect(201, done);
        });
    });

    describe('POST /erc721/:id/metadata', () => {
        const recipient = account2.address,
            title = 'NFT title',
            description = 'NFT description',
            value1 = 'red',
            value2 = 'large',
            value3 = 'http://imageURL';

        it('should return tokenId when token is minted', (done) => {
            user.post('/v1/erc721/' + erc721ID + '/metadata')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .send({
                    title,
                    description,
                    attributes: [
                        { key: schema[0].name, value: value1 },
                        { key: schema[1].name, value: value2 },
                        { key: schema[2].name, value: value3 },
                    ],
                    recipient,
                })
                .expect(({ body }: request.Response) => {
                    expect(body._id).toBeDefined();
                    expect(body.tokens[0].tokenId).toBe(1);
                    expect(body.tokens[0].recipient).toBe(recipient);
                    expect(body.title).toBe(title);
                    expect(body.description).toBe(description);
                    expect(body.attributes[0].key).toBe(schema[0].name);
                    expect(body.attributes[0].value).toBe(value1);
                    expect(body.attributes[1].key).toBe(schema[1].name);
                    expect(body.attributes[1].value).toBe(value2);
                    expect(body.attributes[2].key).toBe(schema[2].name);
                    expect(body.attributes[2].value).toBe(value3);
                })
                .expect(201, done);
        });

        it('should return no tokenId when metadata is created', (done) => {
            const title = 'NFT title 2',
                description = 'NFT description 2',
                value1 = 'blue',
                value2 = 'small',
                value3 = 'http://imageURL2';

            user.post('/v1/erc721/' + erc721ID + '/metadata')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .send({
                    title,
                    description,
                    attributes: [
                        { key: schema[0].name, value: value1 },
                        { key: schema[1].name, value: value2 },
                        { key: schema[2].name, value: value3 },
                    ],
                })
                .expect(({ body }: request.Response) => {
                    expect(body._id).toBeDefined();
                    expect(body.title).toBe(title);
                    expect(body.description).toBe(description);
                    expect(body.attributes[0].key).toBe(schema[0].name);
                    expect(body.attributes[0].value).toBe(value1);
                    expect(body.attributes[1].key).toBe(schema[1].name);
                    expect(body.attributes[1].value).toBe(value2);
                    expect(body.attributes[2].key).toBe(schema[2].name);
                    expect(body.attributes[2].value).toBe(value3);
                    metadataId = body._id;
                    metaTitle = body.title;
                    metaDesc = body.description;
                })
                .expect(201, done);
        });
    });

    describe('PATCH /metadata/:metadataId', () => {
        const value1 = 'blue',
            value2 = 'small',
            value3 = 'http://imageURL2';

        it('should return modified metadata for metadataId', (done) => {
            user.patch('/v1/erc721/' + erc721ID + '/metadata/' + metadataId)
                .set('X-PoolId', poolId)
                .set('Authorization', dashboardAccessToken)
                .send({
                    title: metaTitle,
                    description: metaDesc,
                    attributes: [
                        { key: schema[0].name, value: value1 },
                        { key: schema[1].name, value: value2 },
                        { key: schema[2].name, value: value3 },
                    ],
                })
                .expect((res: request.Response) => {
                    expect(res.body.attributes[0].value).toBe(value1);
                    expect(res.body.attributes[1].value).toBe(value2);
                    expect(res.body.attributes[2].value).toBe(value3);
                })
                .expect(200, done);
        });
    });

    describe('POST /erc721/:id/metadata/:metadataId/mint', () => {
        it('should 201 when token is minted', (done) => {
            const recipient = account2.address;

            user.post('/v1/erc721/' + erc721ID + '/metadata/' + metadataId + '/mint')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .send({
                    recipient,
                })
                .expect(({ body }: request.Response) => {
                    expect(body.tokens[0].tokenId).toBe(2);
                    expect(body.tokens[0].recipient).toBe(recipient);
                })
                .expect(201, done);
        });
    });

    describe('POST /erc721/:id/metadata/zip', () => {
        const title = 'NFT 1';
        const description = 'description';
        const propName = 'img';

        it('should upload multiple metadata images and create metadata and create rewards', async () => {
            const image1 = await createImage('image1');
            const image2 = await createImage('image3');
            const image3 = await createImage('image3');
            const zip = createArchiver().jsZip;
            const zipFolder = zip.folder('testImages');
            zipFolder.file('image1.jpg', image1, { binary: true });
            zipFolder.file('image2.jpg', image2, { binary: true });
            zipFolder.file('image3.jpg', image3, { binary: true });

            const zipFile = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
            const rewardFields = getRewardConfiguration('claim-one-is-enabled');
            await user
                .post('/v1/erc721/' + erc721ID + '/metadata/zip')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .attach('file', zipFile, { filename: 'images.zip', contentType: 'application/zip' })
                .field({
                    title,
                    description,
                    propName,
                    createReward: true,
                    //title: rewardFields.title,
                    slug: rewardFields.slug,
                    withdrawAmount: rewardFields.withdrawAmount,
                    withdrawDuration: rewardFields.withdrawDuration,
                    withdrawLimit: rewardFields.withdrawLimit,
                    isClaimOnce: rewardFields.isClaimOnce,
                    isMembershipRequired: rewardFields.isMembershipRequired,
                    amount: rewardFields.amount,
                })
                .expect(({ body }: request.Response) => {
                    expect(body.metadatas.length).toBe(3);
                })
                .expect(201);
        });

        it('should return created reward', (done) => {
            user.get('/v1/rewards')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.total).toBe(5);
                    expect(res.body.results[2].erc721metadataId).toBeDefined();
                    expect(res.body.results[2].claims).toBeDefined();
                })
                .expect(200, done);
        });
    });

    describe('GET /erc721/:id/metadata/csv', () => {
        it('should create and download the metadata csv for the erc721', (done) => {
            user.get('/v1/erc721/' + erc721ID + '/metadata/csv')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .send()
                .expect((res) => {
                    expect(res.header['content-type']).toBe('text/csv; charset=utf-8');
                    expect(res.header['content-disposition']).toBe(`attachment; filename="metadata_${erc721ID}.csv"`);
                    expect(res.text.length).toBeGreaterThan(0);
                    expect(res.text.split('\n').length).toBe(7);
                    csvFile = res.text;
                })
                .expect(200, done);
        });
    });

    describe('POST /erc721/:id/metadata/csv', () => {
        it('should NOT upload and parse the metadata csv for the erc721 if the schema is not valid', (done) => {
            // PUT SOME WRONG VALUES INTO THE CSV
            const wrongCsvFile = `column1,column2,column3
            text1,value2,http://www`;

            const buffer = Buffer.from(wrongCsvFile, 'utf-8');

            user.post('/v1/erc721/' + erc721ID + '/metadata/csv')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .attach('file', buffer, {
                    filename: 'updatedCSV.csv',
                    contentType: 'text/csv; charset=utf-8',
                })
                .expect(400, done);
        });

        it('should upload and parse the metadata csv for the erc721', (done) => {
            // ADD SOME NEW VALUES TO THE CSV
            csvFile = csvFile + 'pink,medium,http://imageURL3';

            const buffer = Buffer.from(csvFile, 'utf-8');

            user.post('/v1/erc721/' + erc721ID + '/metadata/csv')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .attach('file', buffer, {
                    filename: 'updatedCSV.csv',
                    contentType: 'text/csv; charset=utf-8',
                })
                .expect(201, done);
        });

        it('should return the new created Metadata from the CSV', (done) => {
            user.get('/v1/erc721/' + erc721ID + '/metadata')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .expect(({ body }: request.Response) => {
                    expect(body.results[0].title).toBe('');
                    expect(body.results[0].description).toBe('');
                    expect(body.results[0].attributes[0].key).toBe(schema[0].name);
                    expect(body.results[0].attributes[0].value).toBe('pink');
                    expect(body.results[0].attributes[1].key).toBe(schema[1].name);
                    expect(body.results[0].attributes[1].value).toBe('medium');
                    expect(body.results[0].attributes[2].key).toBe(schema[2].name);
                    expect(body.results[0].attributes[2].value).toBe('http://imageURL3');
                })
                .expect(200, done);
        });

        it('should upload and parse the metadata csv and create the rewards', (done) => {
            const buffer = Buffer.from(csvFile, 'utf-8');
            const rewardFields = getRewardConfiguration('claim-one-is-enabled');

            user.post('/v1/erc721/' + erc721ID + '/metadata/csv')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .attach('file', buffer, {
                    filename: 'updatedCSV.csv',
                    contentType: 'text/csv; charset=utf-8',
                })
                .field({
                    createReward: true,
                    title: rewardFields.title,
                    slug: rewardFields.slug,
                    withdrawAmount: rewardFields.withdrawAmount,
                    withdrawDuration: rewardFields.withdrawDuration,
                    withdrawLimit: rewardFields.withdrawLimit,
                    isClaimOnce: rewardFields.isClaimOnce,
                    isMembershipRequired: rewardFields.isMembershipRequired,
                    amount: rewardFields.amount,
                })
                .expect(201, done);
        });

        it('should return created reward', (done) => {
            user.get('/v1/rewards')
                .set({ 'X-PoolId': poolId, 'Authorization': dashboardAccessToken })
                .expect(async (res: request.Response) => {
                    expect(res.body.total).toBe(7);
                    expect(res.body.results[3].erc721metadataId).toBeDefined();
                    expect(res.body.results[3].claims).toBeDefined();
                })
                .expect(200, done);
        });
    });

    describe('GET /erc721/:id/metadata/zip', () => {
        it('should generate and download the qrcodes for the metadata rewards in a zip file', (done) => {
            user.get('/v1/erc721/' + erc721ID + '/metadata/zip')
                .set('Authorization', dashboardAccessToken)
                .set('X-PoolId', poolId)
                .send()
                .expect(200, done);
        });
        it('should cast a success event for sendDownloadMetadataQrEmail event', (done) => {
            const callback = async () => {
                agenda.off(`success:${EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL}`, callback);
                done();
            };
            agenda.on(`success:${EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL}`, callback);
        });
    });
});
