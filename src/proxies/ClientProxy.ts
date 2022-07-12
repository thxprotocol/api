import { authClient } from '@/util/auth';
import { Client } from '@/models/Client';
import { INITIAL_ACCESS_TOKEN } from '@/config/secrets';
import { THXError } from '@/util/errors';

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

    static async findByPool(poolId: string) {
        const clients = await Client.find({ poolId });
        return clients.map((client) => client.toJSON());
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
