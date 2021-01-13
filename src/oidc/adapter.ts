import { HttpError } from "../models/Error";
import { snakeCase } from "lodash";
import { MongoClient } from "mongodb";
import { MONGODB_URI } from "../util/secrets";

const grantable = new Set(["access_token", "authorization_code", "refresh_token", "device_code"]);

let DB: any;

class CollectionSet extends Set {
    add(name: string): any {
        const nu = this.has(name);
        super.add(name);
        if (!nu) {
            DB.collection(name)
                .createIndexes([
                    ...(grantable.has(name)
                        ? [
                              {
                                  key: { "payload.grantId": 1 },
                              },
                          ]
                        : []),
                    ...(name === "device_code"
                        ? [
                              {
                                  key: { "payload.userCode": 1 },
                                  unique: true,
                              },
                          ]
                        : []),
                    ...(name === "session"
                        ? [
                              {
                                  key: { "payload.uid": 1 },
                                  unique: true,
                              },
                          ]
                        : []),
                    {
                        key: { expiresAt: 1 },
                        expireAfterSeconds: 0,
                    },
                ])
                .catch(console.error); // eslint-disable-line no-console
        }
    }
}

const collections = new CollectionSet();

export default class MongoAdapter {
    name: string;

    constructor(name: string) {
        this.name = snakeCase(name);

        collections.add(this.name);
    }

    static async connect() {
        const client = new MongoClient(MONGODB_URI);
        const connection: any = await client.connect();
        const dbName = connection.s.options.dbName;

        DB = connection.db(dbName);
    }

    coll() {
        return DB.collection(this.name);
    }

    async upsert(_id: string, payload: any, expiresIn: number) {
        try {
            const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
            await this.coll().updateOne(
                { _id },
                { $set: { payload, ...(expiresAt ? { expiresAt } : undefined) } },
                { upsert: true },
            );
        } catch (e) {
            return new HttpError(502, "OIDC Model save failed.", e);
        }
    }

    async find(_id: string) {
        const result = await this.coll().find({ _id }, { payload: 1 }).limit(1).next();
        if (!result) return undefined;
        return result.payload;
    }
    async findByUserCode(userCode: string) {
        const result = await this.coll().find({ "payload.userCode": userCode }, { payload: 1 }).limit(1).next();

        if (!result) return undefined;
        return result.payload;
    }

    async findByUid(uid: string) {
        const result = await this.coll().find({ "payload.uid": uid }, { payload: 1 }).limit(1).next();

        if (!result) return undefined;
        return result.payload;
    }

    async destroy(_id: string) {
        await this.coll().deleteOne({ _id });
    }

    async revokeByGrantId(grantId: string) {
        await this.coll().deleteMany({ "payload.grantId": grantId });
    }

    async consume(_id: string) {
        await this.coll().findOneAndUpdate({ _id }, { $set: { "payload.consumed": Math.floor(Date.now() / 1000) } });
    }
}
