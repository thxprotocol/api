import axios from 'axios';
import { Client } from '../models/Client';

export default class ClientService {
    static async get(id: string) {
        try {
            const client = await Client.findById(id);
            return { client };
        } catch (error) {
            return { error };
        }
    }

    static async create() {
        try {
            const r = await axios({
                method: 'POST',
                url: '/reg',
                data: {
                    application_type: 'web',
                    grant_types: ['client_credentials'],
                    request_uris: [],
                    redirect_uris: [],
                    post_logout_redirect_uris: [],
                    response_types: [],
                    scope: 'openid admin',
                },
            });
            return { client: r.data };
        } catch (error) {
            return { error };
        }
    }

    static async remove(clientId: string) {
        try {
            const client = await Client.findById(clientId);
            await client.remove();
        } catch (error) {
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
