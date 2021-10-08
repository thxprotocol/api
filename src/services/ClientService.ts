import { Client, ClientDocument } from '../models/Client';

export default class ClientService {
    static async remove(clientId: string) {
        try {
            const client = await Client.findById(clientId);
            await client.remove();
        } catch (error) {
            return { error };
        }
    }
}
