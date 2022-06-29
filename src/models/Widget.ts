import mongoose from 'mongoose';

export type WidgetDocument = mongoose.Document & {
    sub: string;
    clientId: string;
    metadata: {
        rewardId: number;
        poolId: string;
    };
};

const widgetSchema = new mongoose.Schema(
    {
        sub: String,
        clientId: String,
        metadata: {
            rewardId: Number,
            poolId: String,
        },
    },
    { timestamps: true },
);

export const Widget = mongoose.model<WidgetDocument>('Widget', widgetSchema, 'widget');
