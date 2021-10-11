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

    static async getByIdAndAddress(rat: string, poolAddress: string) {
        try {
            const widget = await Widget.findOne({ rat, poolAddress });
            return { widget };
        } catch (error) {
            return { error };
        }
    }

    static async getAll(sub: string) {
        try {
            const widgets = await Widget.find({ sub }).map((widget) => widget.rat);
            return { widgets };
        } catch (error) {
            return { error };
        }
    }

    static async post(sub: string, rat: string, rewardId: number, poolAddress: string) {
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
