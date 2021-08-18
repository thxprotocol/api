import mongoose from 'mongoose';

export type WidgetDocument = mongoose.Document & {
    rat: string;
    sub: string;
    metadata: {
        rewardId: number;
    };
};

const widgetSchema = new mongoose.Schema(
    {
        rat: String,
        sub: String,
        metadata: {
            rewardId: Number,
        },
    },
    { timestamps: false },
);

export const Widget = mongoose.model<WidgetDocument>('Widget', widgetSchema, 'widget');
