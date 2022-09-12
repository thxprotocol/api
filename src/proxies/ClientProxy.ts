import NodeCache from 'node-cache';
import { INITIAL_ACCESS_TOKEN } from '@/config/secrets';
import { Client, TClientPayload } from '@/models/Client';
import { authClient } from '@/util/auth';
import { paginatedResults } from '@/util/pagination';

let initialized = false;
const originCache = new NodeCache({});

export default class ClientProxy {
    static async getCache() {
        if (initialized) return originCache;

        const clientWithOrigins = await Client.find({ origins: { $ne: null } });
        clientWithOrigins.forEach((client) => {
            client.origins.forEach((origin) => originCache.set(origin, true));
        });

        initialized = true;
        return originCache;
    }

    static async get(id: string) {
        const client = await Client.findById(id);
        const { data } = await authClient({
            method: 'GET',
            url: `/reg/${client.clientId}?access_token=${client.registrationAccessToken}`,
        });
        return { ...client.toJSON(), clientSecret: data['client_secret'], requestUris: data['request_uris'] };
    }

    static async isAllowedOrigin(origin: string) {
        const originCache = await this.getCache();
        if (!origin) return;
        return !!originCache.get(origin);
    }

    static async findByQuery(query: { poolId: string }, page = 1, limit = 10) {
        return paginatedResults(Client, page, limit, query);
    }

    static async create(sub: string, poolId: string, payload: TClientPayload, name?: string) {
        const { data } = await authClient({
            method: 'POST',
            url: '/reg',
            headers: {
                Authorization: `Bearer ${INITIAL_ACCESS_TOKEN}`,
            },
            data: payload,
        });

        const client = await Client.create({
            sub,
            name,
            poolId,
            grantType: payload.grant_types[0],
            clientId: data.client_id,
            registrationAccessToken: data.registration_access_token,
        });

        if (payload.request_uris.length) {
            const origins = payload.request_uris.map((uri: string) => {
                const origin = new URL(uri);
                originCache.set(`${origin.protocol}//${origin.host}`, true);
                return origin;
            });

            await client.updateOne({ origins });
        }

        return { ...client.toJSON(), clientSecret: data['client_secret'], requestUris: data['request_uris'] };
    }

    static async remove(clientId: string) {
        const client = await Client.findOne({ clientId });

        await authClient({
            method: 'DELETE',
            url: `/reg/${client.clientId}?access_token=${client.registrationAccessToken}`,
        });

        return await client.remove();
    }

    static async update(clientId: string, updates: TClientUpdatePayload) {
        const client = await Client.findOne({ clientId });
        await client.updateOne(updates);

        const { data } = await authClient({
            method: 'GET',
            url: `/reg/${client.clientId}?access_token=${client.registrationAccessToken}`,
        });

        return { ...client.toJSON(), clientSecret: data['client_secret'], requestUris: data['request_uris'] };
    }
}

export type TClientUpdatePayload = Partial<{
    name: string;
}>;
