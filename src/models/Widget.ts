import mongoose from 'mongoose';

export type WidgetDocument = mongoose.Document & {
    rat: string;
    sub: string;
    metadata: {
        rewardId: number;
        poolAddress: string;
    };
};

const widgetSchema = new mongoose.Schema(
    {
        rat: String,
        sub: String,
        metadata: {
            rewardId: Number,
            poolAddress: String,
        },
    },
    { timestamps: false },
);

export const Widget = mongoose.model<WidgetDocument>('Widget', widgetSchema, 'widget');
