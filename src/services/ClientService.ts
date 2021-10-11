import { Client, ClientDocument } from '../models/Client';


export default class ClientService {
    static async get(id: string) {
        try {
            const client = await Client.findById(id);
            return { client };
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
