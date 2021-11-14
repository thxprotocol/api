import { authClient } from '../util/auth';
import { Client } from '../models/Client';

export default class ClientService {
    static async get(clientId: string) {
        try {
            const client = await Client.findOne({ clientId });
            const r = await authClient({
                method: 'GET',
                url: `/reg/${clientId}?access_token=${client.registrationAccessToken}`,
            });

            if (r.status !== 200) {
                throw new Error(r.data);
            }

            client.clientSecret = r.data['client_secret'];
            client.requestUris = r.data['request_uris'];

            return { client };
        } catch (error) {
            return { error };
        }
    }

    static async create(sub: string, data: any) {
        try {
            const r = await authClient({
                method: 'POST',
                url: '/reg',
                data,
            });

            const client = new Client({
                sub,
                clientId: r.data.client_id,
                registrationAccessToken: r.data.registration_access_token,
            });

            await client.save();

            return { client };
        } catch (error) {
            return { error };
        }
    }

    static async remove(clientId: string) {
        try {
            const client = await Client.findOne({ clientId });
            const r = await authClient({
                method: 'DELETE',
                url: `/reg/${client.clientId}?access_token=${client.registrationAccessToken}`,
            });

            if (r.status !== 204) {
                throw new Error();
            }

            await client.remove();
            return { result: true };
        } catch (error) {
            const client = await Client.findOne({ clientId });
            await client.remove();
            return { error };
        }
    }
    static async countScope(scope: string) {
        try {
            return await Client.countDocuments({ 'payload.scope': scope });
        } catch (error) {
            return { error };
        }
    }
}
