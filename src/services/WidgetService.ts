import { Widget } from '../models/Widget';

export default class WidgetService {
    static async get(clientId: string) {
        try {
            const widget = await Widget.findOne({ clientId });
            return { widget };
        } catch (error) {
            return { error };
        }
    }

    static async getForUserByPool(sub: string, poolAddress: string) {
        try {
            const widgets = await Widget.find({ sub, 'metadata.poolAddress': poolAddress });
            return { result: widgets.map((widget) => widget.clientId) };
        } catch (error) {
            return { error };
        }
    }

    static async create(sub: string, clientId: string, rewardId: number, poolAddress: string) {
        try {
            const widget = new Widget({
                sub,
                clientId,
                metadata: {
                    rewardId,
                    poolAddress,
                },
            });
            await widget.save();
            return { widget };
        } catch (error) {
            return { error };
        }
    }

    static async remove(clientId: string) {
        try {
            const widget = await Widget.findOne({ clientId });
            await widget.remove();
            return { result: true };
        } catch (error) {
            return { error };
        }
    }
}
