import mongoose from 'mongoose';

export type WidgetDocument = mongoose.Document & {
    sub: string;
    clientId: string;
    metadata: {
        rewardId: number;
        poolAddress: string;
    };
};

const widgetSchema = new mongoose.Schema(
    {
        sub: String,
        clientId: String,
        metadata: {
            rewardId: Number,
            poolAddress: String,
        },
    },
    { timestamps: false },
);

export const Widget = mongoose.model<WidgetDocument>('Widget', widgetSchema, 'widget');
