import { INITIAL_ACCESS_TOKEN } from '@/config/secrets';
import { Client } from '@/models/Client';
import { authClient } from '@/util/auth';
import { THXError } from '@/util/errors';
import { paginatedResults } from '@/util/pagination';

class ClientProxyError extends THXError {}

export default class ClientProxy {
    static async get(clientId: string) {
        const client = await Client.findOne({ clientId });
        const r = await authClient({
            method: 'GET',
            url: `/reg/${clientId}?access_token=${client.registrationAccessToken}`,
        });

        if (r.status !== 200) {
            throw new ClientProxyError(r.data);
        }

        client.clientSecret = r.data['client_secret'];
        client.requestUris = r.data['request_uris'];

        return client;
    }

    static async info(clientId: string, registrationAccessToken: string) {
        const r = await authClient({
            method: 'GET',
            url: `/reg/${clientId}?access_token=${registrationAccessToken}`,
        });

        if (r.status !== 200) {
            throw new ClientProxyError(r.data);
        }

        return {
            clientId,
            clientSecret: r.data['client_secret'],
            requestUris: r.data['request_uris'],
        };
    }

    static async findByPool(poolId: string) {
        const clients = (await Client.find({ poolId })) || [];
        return clients.map((client) => client.toJSON());
    }

    static async findByQuery(query: { poolId: string }, page = 1, limit = 10) {
        return paginatedResults(Client, page, limit, query);
    }

    static async create(sub: string, poolId: string, data: any) {
        const r = await authClient({
            method: 'POST',
            url: '/reg',
            headers: {
                Authorization: `Bearer ${INITIAL_ACCESS_TOKEN}`,
            },
            data,
        });

        const client = new Client({
            sub,
            poolId,
            clientId: r.data.client_id,
            registrationAccessToken: r.data.registration_access_token,
        });

        await client.save();

        return client;
    }

    static async remove(clientId: string) {
        const client = await Client.findOne({ clientId });
        await client.remove();

        const r = await authClient({
            method: 'DELETE',
            url: `/reg/${client.clientId}?access_token=${client.registrationAccessToken}`,
        });

        if (r.status !== 204) {
            throw new ClientProxyError();
        }
    }
}
