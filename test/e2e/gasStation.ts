import request from "supertest";
import app from "../../src/app";
import db from "../../src/util/database";
import { ASSET_POOL, BASE_POLL, REWARD_POLL, WITHDRAW_POLL } from "../../src/util/network";
import { voter, timeTravel, signMethod, admin, testTokenFactory } from "./lib/network";
import {
    poolTitle,
    rewardPollDuration,
    proposeWithdrawPollDuration,
    rewardTitle,
    rewardDescription,
    rewardWithdrawAmount,
    rewardWithdrawDuration,
    mintAmount,
} from "./lib/constants";
import { formatEther, parseEther } from "ethers/lib/utils";
import { isError } from "lodash";

const user = request.agent(app);

describe("Gas Station", () => {
    let poolAddress: any, pollAddress: any, withdrawPollAddress: any, testToken: any;

    beforeAll(async () => {
        await db.truncate();

        testToken = await testTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();

        // Create an account
        await user
            .post("/v1/signup")
            .send({ email: "test.api.bot@thx.network", password: "mellon", confirmPassword: "mellon" });

        // Login
        await user.post("/v1/login").send({ email: "test.api.bot@thx.network", password: "mellon" });

        // Create an asset pool
        const res = await user.post("/v1/asset_pools").send({
            title: poolTitle,
            token: testToken.address,
        });
        poolAddress = res.body.address;

        // Transfer some tokens to the pool rewardWithdrawAmount tokens for the pool
        await testToken.transfer(poolAddress, rewardWithdrawAmount);

        // Configure the default poll durations
        await user
            .patch("/v1/asset_pools/" + poolAddress)
            .set({ AssetPool: poolAddress })
            .send({
                rewardPollDuration,
                proposeWithdrawPollDuration,
            });

        // Create a reward
        await user.post("/v1/rewards/").set({ AssetPool: poolAddress }).send({
            withdrawAmount: rewardWithdrawAmount,
            withdrawDuration: rewardWithdrawDuration,
            title: rewardTitle,
            description: rewardDescription,
        });

        // Add a member
        await user.post("/v1/members").set({ AssetPool: poolAddress }).send({ address: voter.address });
    });

    describe("GET /accounts", () => {
        it("HTTP 200", async (done) => {
            const { body, status } = await user.get("/v1/rewards/0").set({ AssetPool: poolAddress });
            pollAddress = body.poll.address;
            expect(body.state).toBe(0);
            done();
        });
    });

    describe("POST /gas_station/base_poll (vote)", () => {
        let redirectURL = "";

        it("HTTP 302 when call is ok", async (done) => {
            const { call, nonce, sig } = await signMethod(voter, REWARD_POLL.abi, pollAddress, "vote", [true]);
            const { headers, status } = await user
                .post("/v1/gas_station/base_poll")
                .set({ AssetPool: poolAddress })
                .send({
                    call,
                    nonce,
                    sig,
                    contractAddress: pollAddress,
                    redirect: `polls/${pollAddress}`,
                });
            expect(status).toBe(302);
            redirectURL = headers.location;
            done();
        });

        it("HTTP 200 when redirect is ok", async (done) => {
            const { status, body } = await user.get(redirectURL).set({ AssetPool: poolAddress });

            expect(status).toBe(200);
            expect(body.yesCounter).toBe(1);

            done();
        });
    });

    describe("POST /gas_station/base_poll (revokeVote)", () => {
        let redirectURL = "";

        it("HTTP 302 when revokeVote call is ok", async (done) => {
            const { call, nonce, sig } = await signMethod(voter, REWARD_POLL.abi, pollAddress, "revokeVote", []);
            const { headers, status } = await user
                .post("/v1/gas_station/base_poll")
                .set({ AssetPool: poolAddress })
                .send({
                    call,
                    nonce,
                    sig,
                    contractAddress: pollAddress,
                    redirect: `polls/${pollAddress}`,
                });
            redirectURL = headers.location;
            expect(status).toBe(302);
            done();
        });

        it("HTTP 200 when redirect is ok", async (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.yesCounter).toBe(0);
                    done();
                });
        });
    });

    describe("POST /gas_station/base_poll (finalize)", () => {
        let redirectURL = "";

        it("HTTP 302 when vote call is ok", async (done) => {
            const { call, nonce, sig } = await signMethod(voter, REWARD_POLL.abi, pollAddress, "vote", [true]);
            await user
                .post("/v1/gas_station/base_poll")
                .set({ AssetPool: poolAddress })
                .send({
                    call,
                    nonce,
                    sig,
                    contractAddress: pollAddress,
                    redirect: `polls/${pollAddress}`,
                });
            done();
        });

        it("HTTP 302 when finalize call is ok", async (done) => {
            await timeTravel(rewardPollDuration);

            const { call, nonce, sig } = await signMethod(voter, REWARD_POLL.abi, pollAddress, "finalize", []);
            const { headers, status } = await user
                .post("/v1/gas_station/base_poll")
                .set({ AssetPool: poolAddress })
                .send({
                    call,
                    nonce,
                    sig,
                    contractAddress: pollAddress,
                    redirect: "rewards/0",
                });
            redirectURL = headers.location;
            expect(status).toBe(302);
            done();
        });

        it("HTTP 200 when redirect is ok", async (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe(1);
                    done();
                });
        });
    });
});
