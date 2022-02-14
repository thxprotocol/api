import { IAssetPool } from './models/AssetPool';
declare global {
    namespace Express {
        interface Request {
            origin?: string;
            user?: any;
            assetPool?: IAssetPool;
        }
    }
}
