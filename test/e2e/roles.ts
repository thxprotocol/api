import request from "supertest";
import app from "../../src/app";
import db from "../../src/util/database";
import { voter, admin, testTokenFactory } from "./lib/network";
import { poolTitle, mintAmount } from "./lib/constants";
import { formatEther } from "ethers/lib/utils";

const user = request.agent(app);

describe("Roles", () => {
    let poolAddress: any, testToken: any;

    beforeAll(async () => {
        await db.truncate();

        testToken = await testTokenFactory.deploy(admin.address, mintAmount);

        await testToken.deployed();
    });

    describe("POST /signup", () => {
        it("HTTP 302 if OK", (done) => {
            user.post("/v1/signup")
                .send({ email: "test.roles.bot@thx.network", password: "mellon", confirmPassword: "mellon" })
                .end((err, res) => {
                    expect(res.status).toBe(302);
                    done();
                });
        });
    });

    describe("POST /asset_pools", () => {
        it("HTTP 200", async (done) => {
            user.post("/v1/asset_pools")
                .send({
                    title: poolTitle,
                    token: testToken.address,
                })
                .end(async (err, res) => {
                    expect(res.status).toBe(201);
                    poolAddress = res.body.address;
                    done();
                });
        });
    });

    describe("GET /members/:address", () => {
        it("HTTP 200 if OK", (done) => {
            user.get("/v1/members/" + admin.address)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });
        it("HTTP 404 if not found", (done) => {
            user.get("/v1/members/" + voter.address)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });
    });

    describe("POST /members/:address", () => {
        let redirectURL = "";

        it("HTTP 302 if OK", (done) => {
            user.post("/v1/members/")
                .send({ address: voter.address })
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    redirectURL = res.headers.location;

                    expect(res.status).toBe(302);
                    done();
                });
        });

        it("HTTP 200 for redirect", (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(Number(formatEther(res.body.token.balance))).toEqual(0);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe("PATCH /members/:address (isManager: true)", () => {
        let redirectURL = "";

        it("HTTP 302 if OK", (done) => {
            user.patch("/v1/members/" + voter.address)
                .send({ isManager: true })
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    redirectURL = res.headers.location;
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it("HTTP 200 and isManager true", (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(true);
                    expect(Number(formatEther(res.body.token.balance))).toEqual(0);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe("PATCH /members/:address (isManager: false)", () => {
        let redirectURL = "";

        it("HTTP 302 if OK", (done) => {
            user.patch("/v1/members/" + voter.address)
                .send({ isManager: false })
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    redirectURL = res.headers.location;
                    expect(res.status).toBe(302);
                    done();
                });
        });

        it("HTTP 200 and isManager: false", (done) => {
            user.get(redirectURL)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.body.isMember).toEqual(true);
                    expect(res.body.isManager).toEqual(false);
                    expect(Number(formatEther(res.body.token.balance))).toEqual(0);
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe("DELETE /members/:address", () => {
        it("HTTP 200 if OK", (done) => {
            user.delete("/v1/members/" + voter.address)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.status).toBe(200);
                    done();
                });
        });
    });

    describe("GET /members/:address (after DELETE)", () => {
        it("HTTP 404 if not found", (done) => {
            user.get("/v1/members/" + voter.address)
                .set({ AssetPool: poolAddress })
                .end(async (err, res) => {
                    expect(res.status).toBe(404);
                    done();
                });
        });
    });
});
