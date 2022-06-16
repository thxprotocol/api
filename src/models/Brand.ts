import mongoose from 'mongoose';

export type IBrandUpdate = Partial<IBrand>;

export interface IBrand {
    logoImgUrl: string;
    backgroundImgUrl: string;
    poolAddress: string;
    clientId: string;
}

const brandSchema = new mongoose.Schema({
    logoImgUrl: String,
    backgroundImgUrl: String,
    poolAddress: String,
    clientId: String,
});

export default mongoose.model<IBrand>('brand', brandSchema);
