import snakeCase from 'lodash/snakeCase';
import { Session } from '../models/Session';

export default class MongoAdapter {
    name: string;

    constructor(name: string) {
        this.name = snakeCase(name);
    }

    async upsert(_id: string, payload: any, expiresIn: number) {
        let expiresAt;

        if (expiresIn) {
            expiresAt = new Date(Date.now() + expiresIn * 1000);
        }

        await Session.create({
            ...payload,
            ...(expiresAt ? { expiresAt } : undefined),
        });
    }

    async find(_id: string) {
        const result = await Session.findById(_id);

        if (!result) return undefined;
        return result;
    }

    // Implementation only required when using DeviceCode sessions.
    async findByUserCode(userCode: string) {}

    async findByUid(uid: string) {
        const result = await Session.findOne({ uid });

        if (!result) return undefined;
        return result;
    }

    async destroy(_id: string) {
        await Session.deleteOne({ id: _id });
    }

    async revokeByGrantId(grantId: string) {
        await Session.deleteMany({ grantId });
    }

    async consume(_id: string) {
        await Session.findOneAndUpdate({ _id }, { consumed: Math.floor(Date.now() / 1000) });
    }
}
