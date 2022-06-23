import mongoose from 'mongoose';

export type TBrandUpdate = Partial<TBrand>;

export interface TBrand {
    logoImgUrl: string;
    backgroundImgUrl: string;
    poolAddress: string;
}

const brandSchema = new mongoose.Schema({
    logoImgUrl: String,
    backgroundImgUrl: String,
    poolAddress: String,
});

export default mongoose.model<TBrand>('brand', brandSchema);
