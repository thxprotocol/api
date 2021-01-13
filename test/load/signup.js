import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter } from "k6/metrics";

const FailedAddMemberCount = new Counter("failed_add_member");
const FailedRemoveMemberCount = new Counter("failed_remove_member");
const ErrorCount = new Counter("failed");

export const options = {
    vus: 100,
    duration: "120s",
    thresholds: {
        errors: ["count<10"],
    },
};
const baseUrl = "http://node:3000/v1";
const admin = {
    email: "load.admin@thx.network",
    password: "mellon",
};

export function setup() {
    const params = { headers: { "Content-Type": "application/json" } };
    http.post(
        `${baseUrl}/signup`,
        JSON.stringify({
            email: admin.email,
            password: admin.password,
            confirmPassword: admin.password,
        }),
        params,
    );
    const res = http.post(
        `${baseUrl}/asset_pools`,
        JSON.stringify({
            title: "Volunteers United",
            token: "0xeab9a65eb0f098f822033192802b53ee159de5f0",
        }),
        params,
    );
    return res.json().address;
}

export default function (assetPoolAddress) {
    let address;
    const email = `load.${__VU}.${__ITER}@thx.network`;
    const password = "mellon";

    group("POST /signup", () => {
        const payload = JSON.stringify({
            email,
            password,
            confirmPassword: password,
        });
        const params = {
            headers: {
                "Content-Type": "application/json",
            },
        };
        const res = http.post(`${baseUrl}/signup`, payload, params);
        const success = check(res, {
            "status is 200": (r) => r.status === 200,
        });
        if (!success) {
            ErrorCount.add(1);
        }
    });

    group("GET /account", () => {
        const res = http.get(`${baseUrl}/account`);
        const success = check(res, {
            "status is 200": (r) => r.status === 200,
        });
        if (!success) {
            ErrorCount.add(1);
        }
        address = res.json().address;
    });

    group("GET /logout", () => {
        const res = http.get(`${baseUrl}/logout`);
        const success = check(res, {
            "status is 200": (r) => r.status === 200,
        });
        if (!success) {
            ErrorCount.add(1);
        }
    });

    group("POST /login (admin)", () => {
        const payload = JSON.stringify({
            email: admin.email,
            password: admin.password,
        });
        const params = {
            headers: {
                "Content-Type": "application/json",
            },
        };
        const res = http.post(`${baseUrl}/login`, payload, params);
        const success = check(res, {
            "status is 200": (r) => r.status === 200,
        });

        if (!success) {
            ErrorCount.add(1);
        }
    });

    group("POST /members (admin)", () => {
        console.log(email, password, address, assetPoolAddress);

        const payload = JSON.stringify({
            address,
        });
        const params = {
            headers: {
                "AssetPool": assetPoolAddress,
                "Content-Type": "application/json",
            },
        };
        const res = http.post(`${baseUrl}/members`, payload, params);
        const success = check(res, {
            "status is 200": (r) => r.status === 200,
        });

        if (!success) {
            FailedAddMemberCount.add(1);
        }
    });

    group("DELETE /members (admin)", () => {
        const params = {
            headers: {
                "AssetPool": assetPoolAddress,
                "Content-Type": "application/json",
            },
        };
        const res = http.del(`${baseUrl}/members/${address}`, {}, params);
        const success = check(res, {
            "status is 200": (r) => r.status === 200,
        });
        if (!success) {
            FailedRemoveMemberCount.add(1);
        }
    });

    group("GET /logout (admin)", () => {
        const res = http.get(`${baseUrl}/logout`);
        const success = check(res, {
            "status is 200": (r) => r.status === 200,
        });
        if (!success) {
            ErrorCount.add(1);
        }
    });

    sleep(2);
}
