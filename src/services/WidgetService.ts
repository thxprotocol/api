import { Widget } from '@/models/Widget';

export default class WidgetService {
    static get(clientId: string) {
        return Widget.findOne({ clientId });
    }

    static async getForUserByPool(sub: string, poolAddress: string) {
        const widgets = await Widget.find({ sub, 'metadata.poolAddress': poolAddress });
        return widgets.map((widget) => widget.clientId);
    }

    static async create(sub: string, clientId: string, rewardId: number, poolAddress: string) {
        const widget = new Widget({
            sub,
            clientId,
            metadata: {
                rewardId,
                poolAddress,
            },
        });
        await widget.save();
        return widget;
    }

    static async remove(clientId: string) {
        const widget = await Widget.findOne({ clientId });
        await widget.remove();
    }
}
