import { authClient } from '@/util/auth';
import { Client } from '@/models/Client';
import { INITIAL_ACCESS_TOKEN } from '@/util/secrets';
import { THXError } from '@/util/errors';

class ClientServiceError extends THXError {}

export default class ClientService {
    static async get(clientId: string) {
        const client = await Client.findOne({ clientId });
        const r = await authClient({
            method: 'GET',
            url: `/reg/${clientId}?access_token=${client.registrationAccessToken}`,
        });

        if (r.status !== 200) {
            throw new ClientServiceError(r.data);
        }

        client.clientSecret = r.data['client_secret'];
        client.requestUris = r.data['request_uris'];

        return client;
    }

    static async create(sub: string, data: any) {
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
            throw new ClientServiceError();
        }
    }
}
