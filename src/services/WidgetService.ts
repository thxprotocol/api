import { Widget } from '../models/Widget';

export default class WidgetService {
    static async get(rat: string) {
        try {
            const widget = await Widget.findOne({ rat });
            return { widget };
        } catch (error) {
            return { error };
        }
    }

    static async getForUserByPool(sub: string, poolAddress: string) {
        try {
            const widgets = await Widget.find({ sub, 'metadata.poolAddress': poolAddress });
            return { result: widgets.map((widget) => widget.rat) };
        } catch (error) {
            return { error };
        }
    }

    static async create(sub: string, rat: string, rewardId: number, poolAddress: string) {
        try {
            const widget = new Widget({
                sub,
                rat,
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
}
