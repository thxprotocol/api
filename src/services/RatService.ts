import { Rat, RatDocument } from '../models/Rat';

export default class ClientService {
    static async get(ratId: string) {
        try {
            const rat: RatDocument = await Rat.findById(ratId);
            return { rat };
        } catch (error) {
            return { error };
        }
    }

    static async removeRat(ratId: string) {
        try {
            const rat: RatDocument = await Rat.findById(ratId);
            await rat.remove();
        } catch (error) {
            return { error };
        }
    }
}
