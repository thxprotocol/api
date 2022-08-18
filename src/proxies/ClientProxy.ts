import { INITIAL_ACCESS_TOKEN } from '@/config/secrets';
import { Client, TClientPayload } from '@/models/Client';
import { authClient } from '@/util/auth';
import { paginatedResults } from '@/util/pagination';

export default class ClientProxy {
    static async get(id: string) {
        const client = await Client.findById(id);
        const { data } = await authClient({
            method: 'GET',
            url: `/reg/${client.clientId}?access_token=${client.registrationAccessToken}`,
        });
        return { ...client.toJSON(), clientSecret: data['client_secret'], requestUris: data['request_uris'] };
    }

    static async isAllowedOrigin(clientId: string, origin: string) {
        const client = await Client.findOne({ clientId });
        if (!client) return false;

        const { data } = await authClient({
            method: 'GET',
            url: `/reg/${client.clientId}?access_token=${client.registrationAccessToken}`,
        });

        return data['request_uris'].includes(origin);
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
}
