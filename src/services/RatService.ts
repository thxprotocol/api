import { Rat, RatDocument } from '../models/Rat';

export default class ClientService {
    static async get(id: string) {
        try {
            const rat: RatDocument = await Rat.findById(id);
            return { rat };
        } catch (error) {
            return { error };
        }
    }

    static async remove(id: string) {
        try {
            const rat: RatDocument = await Rat.findById(id);
            await rat.remove();
        } catch (error) {
            return { error };
        }
    }
}
