import { Client, ClientDocument } from '../models/Client';

export default class ClientService {
    static async removeClient(clientId: string) {
        try {
            const client = Client.findById(clientId);
            await client.remove();
        } catch (error) {
            return { error };
        }
    }
}
