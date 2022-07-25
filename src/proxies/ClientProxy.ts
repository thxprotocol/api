import { INITIAL_ACCESS_TOKEN } from '@/config/secrets';
import { Client } from '@/models/Client';
import { authClient } from '@/util/auth';
import { paginatedResults } from '@/util/pagination';

export default class ClientProxy {
    static async get(clientId: string) {
        const client = await Client.findOne({ clientId });
        const r = await authClient({
            method: 'GET',
            url: `/reg/${clientId}?access_token=${client.registrationAccessToken}`,
        });

        client.clientSecret = r.data['client_secret'];
        client.requestUris = r.data['request_uris'];

        return client;
    }

    static async findByPool(poolId: string) {
        const clients = (await Client.find({ poolId })) || [];
        return clients.map((client) => client.toJSON());
    }

    static async findByQuery(query: { poolId: string }, page = 1, limit = 10) {
        return paginatedResults(Client, page, limit, query);
    }

    static async create(sub: string, poolId: string, client: any, name?: string) {
        const { data } = await authClient({
            method: 'POST',
            url: '/reg',
            headers: {
                Authorization: `Bearer ${INITIAL_ACCESS_TOKEN}`,
            },
            data: client,
        });

        return await Client.create({
            sub,
            name,
            poolId,
            clientId: data.client_id,
            registrationAccessToken: data.registration_access_token,
        });
    }

    static async remove(clientId: string) {
        const client = await Client.findOne({ clientId });
        await client.remove();

        return await authClient({
            method: 'DELETE',
            url: `/reg/${client.clientId}?access_token=${client.registrationAccessToken}`,
        });
    }
}
