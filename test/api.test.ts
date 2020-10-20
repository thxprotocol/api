import request from 'supertest';
import app from '../src/app';
import db from '../src/util/database';
import mongoose from 'mongoose';
import { deployTestTokenContract, options, web3 } from '../src/util/network';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { before } from 'lodash';

const user = request.agent(app);
const poolTitle = 'Volunteers United';
const rewardPollDuration = 10;
const proposeWithdrawPollDuration = 10;
const VOTER_PK = '0x97093724e1748ebfa6aa2d2ec4ec68df8678423ab9a12eb2d27ddc74e35e5db9';
const voter = web3.eth.accounts.privateKeyToAccount(VOTER_PK);
const jsonrpc = '2.0';
const id = 0;
const send = (method: string, params: any[] = []) =>
    (web3.currentProvider as any).send({ id, jsonrpc, method, params }, () => {});

const timeTravel = async (seconds: number) => {
    await send('evm_increaseTime', [seconds.toString()]);
    await send('evm_mine');
};

web3.eth.accounts.wallet.add(voter);

let poolAddress: any, testTokenInstance: any, pollAddress: any;

beforeAll(async () => {
    const server = new MongoMemoryServer({
        instance: {
            ip: 'localhost',
            port: 27027,
            dbName: 'test',
        },
        autoStart: true,
    });

    testTokenInstance = await deployTestTokenContract();

    await server.ensureInstance();
});

afterAll(async () => {
    await mongoose.disconnect();
    return await db.disconnect();
});

describe('POST /login (no auth)', () => {
    it('returns 500 if payload is missing', async (done) => {
        user.post('/v1/login').end((err, res) => {
            expect(res.status).toBe(400);
            done();
        });
    });
    it('returns 500 if email is missing', (done) => {
        user.post('/v1/login')
            .send({ password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 500 if password is missing', (done) => {
        user.post('/v1/login')
            .send({ email: 'test.bot@thx.network' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 401 if account is not found', (done) => {
        user.post('/v1/login')
            .send({ email: 'test.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(401);
                done();
            });
    });
});

describe('POST /signup', () => {
    it('returns 500 if payload is missing', (done) => {
        user.post('/v1/signup').end((err, res) => {
            expect(res.status).toBe(400);
            done();
        });
    });
    it('returns 500 if email is missing', (done) => {
        user.post('/v1/signup')
            .send({ password: 'mellon', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 500 if password is missing', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 500 if confirmPassword is missing', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(400);
                done();
            });
    });
    it('returns 302 if payload is correct', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', password: 'mellon', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(302);
                done();
            });
    });
    it('returns 403 if email already exists', (done) => {
        user.post('/v1/signup')
            .send({ email: 'test.bot@thx.network', password: 'mellon', confirmPassword: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(403);
                done();
            });
    });
});

describe('POST /logout', () => {
    it('returns 200 if logout is handled', (done) => {
        user.get('/v1/logout').end((err, res) => {
            expect(res.status).toBe(200);
            done();
        });
    });
});

describe('GET /account (after logout)', () => {
    it('should return a 401', async (done) => {
        user.get('/v1/account').end((err, res) => {
            expect(res.status).toBe(401);
            done();
        });
    });
});

describe('POST /login', () => {
    let redirectURL = '';

    it('should return a 401 if credentials are incorrect', (done) => {
        user.post('/v1/login')
            .send({ email: 'bad.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(401);
                done();
            });
    });

    it('should return a 302 if credentials are correct', (done) => {
        user.post('/v1/login')
            .send({ email: 'test.bot@thx.network', password: 'mellon' })
            .end((err, res) => {
                expect(res.status).toBe(302);
                redirectURL = res.header.location;
                done();
            });
    });

    it('should return a 200 after redirect', (done) => {
        user.get('/v1/' + redirectURL).end((err, res) => {
            expect(res.status).toBe(200);
            done();
        });
    });
});

describe('GET /account (after login)', () => {
    it('should return a 200', async (done) => {
        user.get('/v1/account').end((err, res) => {
            expect(res.status).toBe(200);
            done();
        });
    });
});

describe('POST /asset_pools', () => {
    it('should return a 200', async (done) => {
        user.post('/v1/asset_pools')
            .send({ title: poolTitle, token: testTokenInstance.options.address })
            .end((err, res) => {
                expect(res.status).toBe(200);
                expect(res.body.address).toContain('0x');
                poolAddress = res.body.address;
                done();
            });
    });
});

describe('GET /asset_pools/:address', () => {
    it('should return a 200t', (done) => {
        user.get('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.body.title).toEqual(poolTitle);
                expect(res.body.address).toEqual(poolAddress);
                expect(res.body.token.address).toEqual(testTokenInstance.options.address);
                expect(res.body.token.name).toEqual(await testTokenInstance.methods.name().call());
                expect(res.body.token.symbol).toEqual(await testTokenInstance.methods.symbol().call());
                expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(0);
                expect(Number(res.body.rewardPollDuration)).toEqual(0);
                expect(res.status).toBe(200);
                done();
            });
    });

    it('should return a 404 if pool does not exist', (done) => {
        user.get('/v1/asset_pools/0x0000000000000000000000000000000000000000')
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.status).toBe(404);
                done();
            });
    });
});

describe('PATCH /asset_pools/:address', () => {
    let redirectURL = '';
    it('should return a 302 ', (done) => {
        user.patch('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .send({
                rewardPollDuration: 10,
                proposeWithdrawPollDuration: 10,
            })
            .end(async (err, res) => {
                redirectURL = res.headers.location;

                expect(res.status).toBe(302);
                done();
            });
    });

    it('should return a 200 after redirect', (done) => {
        user.get('/v1/' + redirectURL)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(10);
                expect(Number(res.body.rewardPollDuration)).toEqual(10);
                expect(res.status).toBe(200);
                done();
            });
    });

    it('should return a 500 if incorrect rewardPollDuration value is sent ', (done) => {
        user.patch('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .send({
                rewardPollDuration: 'fivehundred',
            })
            .end(async (err, res) => {
                expect(res.status).toBe(500);
                done();
            });
    });

    it('should return a 500 if incorrect proposeWithdrawPollDuration value is sent ', (done) => {
        user.patch('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .send({
                proposeWithdrawPollDuration: 'fivehundred',
            })
            .end(async (err, res) => {
                expect(res.status).toBe(500);
                done();
            });
    });

    it('should still have the correct values', (done) => {
        user.get('/v1/asset_pools/' + poolAddress)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(Number(res.body.proposeWithdrawPollDuration)).toEqual(proposeWithdrawPollDuration);
                expect(Number(res.body.rewardPollDuration)).toEqual(rewardPollDuration);
                expect(res.status).toBe(200);
                done();
            });
    });
});

describe('POST /rewards/', () => {
    const rewardTitle = 'Complete your profile!';
    const rewardDescription = 'Earn great rewards for tiny things.';
    const rewardWithdrawAmount = 1000;
    const rewardWithdrawDuration = 12;
    let redirectURL = '';

    it('should return a 302 when reward is added', (done) => {
        user.post('/v1/rewards/')
            .set({ AssetPool: poolAddress })
            .send({
                withdrawAmount: rewardWithdrawAmount,
                withdrawDuration: rewardWithdrawDuration,
                title: rewardTitle,
                description: rewardDescription,
            })
            .end(async (err, res) => {
                redirectURL = res.headers.location;
                expect(res.status).toBe(302);
                done();
            });
    });

    it('should return a 200 after redirect', (done) => {
        user.get('/v1/' + redirectURL)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(Number(res.body.id)).toEqual(0);
                expect(res.body.title).toEqual(rewardTitle);
                expect(res.body.description).toEqual(rewardDescription);
                expect(res.body.poll.address).toContain('0x');
                expect(Number(res.body.poll.withdrawAmount)).toEqual(rewardWithdrawAmount);
                expect(Number(res.body.poll.withdrawDuration)).toEqual(rewardWithdrawDuration);
                expect(res.status).toBe(200);
                done();
            });
    });
});

describe('GET /rewards/:id', () => {
    it('should return a 200 when successful', (done) => {
        user.get('/v1/rewards/0')
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.status).toBe(200);
                done();
            });
    });

    it('should return a 404 if reward can not be found', (done) => {
        user.get('/v1/rewards/1')
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.status).toBe(404);
                done();
            });
    });

    it('should return a 500 if the id parameter is invalid', (done) => {
        user.get('/v1/rewards/id_invalid')
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.status).toBe(500);
                done();
            });
    });
});

describe('GET /members/:address', () => {
    it('should return a 404 if member is not found', (done) => {
        user.post('/v1/members/' + voter.address)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.status).toBe(404);
                done();
            });
    });
});

describe('POST /members/:address', () => {
    let redirectURL = '';

    it('should return a 302 when member is added', (done) => {
        user.post('/v1/members/')
            .send({ address: voter.address })
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                redirectURL = res.headers.location;

                expect(res.status).toBe(302);
                done();
            });
    });

    it('should return a 200 for the redirect', (done) => {
        user.get('/v1/' + redirectURL)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.body.isMember).toEqual(true);
                expect(res.body.isManager).toEqual(false);
                expect(res.status).toBe(200);
                done();
            });
    });
});

describe('GET /polls/:id', () => {
    it('should return a 200 and expose poll address', (done) => {
        user.get('/v1/rewards/0')
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                pollAddress = res.body.poll.address;
                expect(res.body.poll.address).toContain('0x');
                expect(res.body.state).toEqual('0');
                expect(res.status).toBe(200);
                done();
            });
    });

    it('should return a 200 if poll exists', (done) => {
        user.get('/v1/polls/' + pollAddress)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.status).toBe(200);
                done();
            });
    });
});

describe('GET /polls/:id/vote/:agree', () => {
    it('should return a 200 and base64 string for the yes vote', (done) => {
        user.get(`/v1/polls/${pollAddress}/vote/1`)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.body.base64).toContain('data:image/png;base64');
                expect(res.status).toBe(200);
                done();
            });
    });
});

describe('POST /polls/:address/vote', () => {
    let redirectURL = '';

    it('should return a 200 and base64 string for the yes vote', (done) => {
        user.get(`/v1/polls/${pollAddress}/vote/1`)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(res.body.base64).toContain('data:image/png;base64');
                expect(res.status).toBe(200);
                done();
            });
    });

    it('should return a 302 when tx is handled', (done) => {
        // We assume QR decoding works as expected, will be tested in the wallet repo
        const hash = web3.utils.soliditySha3(options.from, true, 1, pollAddress);
        const sig = web3.eth.accounts.sign(hash, VOTER_PK);

        user.post(`/v1/polls/${pollAddress}/vote`)
            .send({
                voter: voter.address,
                agree: true,
                nonce: 1,
                sig: sig['signature'],
            })
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                redirectURL = res.headers.location;
                expect(res.status).toBe(302);
                done();
            });
    });

    it('should return a 200 and increase yesCounter with 1', (done) => {
        user.get(`/v1/${redirectURL}`)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(Number(res.body.yesCounter)).toEqual(1);
                expect(Number(res.body.noCounter)).toEqual(0);
                expect(res.status).toBe(200);
                done();
            });
    });
});

describe('POST /rewards/:id/finalize', () => {
    let redirectURL = '';

    beforeAll(async () => {
        await timeTravel(rewardPollDuration);
    });

    it('should return a 302 after finalizing the poll', (done) => {
        user.post(`/v1/rewards/0/finalize`)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                redirectURL = res.header.location;

                expect(res.status).toBe(302);
                done();
            });
    });

    it('should return a 200 after getting the reward', (done) => {
        user.get(`/v1/${redirectURL}`)
            .set({ AssetPool: poolAddress })
            .end(async (err, res) => {
                expect(Number(res.body.state)).toEqual(1);
                expect(JSON.parse(res.body.poll.finalized)).toEqual(true);
                expect(res.status).toBe(200);
                done();
            });
    });
});
