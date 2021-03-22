import { ethers } from 'ethers';
import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { admin, assetPoolFactory, provider } from '../../util/network';
import { ASSET_POOL_FACTORY_ADDRESS, RPC } from '../../util/secrets';
import { VERSION } from '../../util/secrets';
import { name, version, license } from '../../../package.json';
import AssetPoolFactoryArtifact from '../../artifacts/contracts/contracts/AssetPoolFactory.sol/AssetPoolFactory.json';

export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const address = await admin.getAddress();
        const balance = await provider.getBalance(address);
        const code = await provider.getCode(ASSET_POOL_FACTORY_ADDRESS);
        const jsonData = {
            name: `${name} (${VERSION})`,
            version: version,
            license: license,
            admin: {
                address,
                balance: ethers.utils.formatEther(balance),
            },
            factory: {
                deployed: code !== '0x',
                healthy: AssetPoolFactoryArtifact.deployedBytecode === code,
                address: assetPoolFactory.address,
                network: RPC,
            },
        };

        res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
    } catch (error) {
        next(new HttpError(502, 'Matic GetBalance failed', error));
    }
};
