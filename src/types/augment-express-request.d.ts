import { IAssetPool } from './models/AssetPool';
declare global {
    declare namespace Express {
        export interface Request {
            origin?: string;
            user?: any;
            assetPool?: IAssetPool;
        }
    }
}
