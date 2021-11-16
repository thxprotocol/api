import { Membership } from '../models/Membership';

const ERROR_MEMBERSHIP_GET_FAILED = 'Could not get the membership information from the database';
const ERROR_MEMBERSHIP_DELETE_FAILED = 'Could not delete the membership information from the database';

export default class MembershipService {
    static async get(sub: string) {
        try {
            const membership = await Membership.find({ sub });

            return { membership };
        } catch (error) {
            return { error: ERROR_MEMBERSHIP_GET_FAILED };
        }
    }

    static async getById(id: string) {
        try {
            const membership = await Membership.findById(id);

            return { membership };
        } catch (error) {
            return { error: ERROR_MEMBERSHIP_GET_FAILED };
        }
    }

    static async remove(id: string) {
        try {
            const membership = await Membership.findById(id);

            await membership.remove();
            return { result: true };
        } catch (error) {
            return { error: ERROR_MEMBERSHIP_DELETE_FAILED };
        }
    }
}
