import { ethers } from 'ethers';
import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { admin, assetPoolFactory, provider } from '../../util/network';
import { ASSET_POOL_FACTORY_ADDRESS, RPC } from '../../util/secrets';
import { VERSION } from '../../util/secrets';
import { name, version, license } from '../../../package.json';
import AssetPoolFactoryArtifact from '../../artifacts/contracts/contracts/factories/AssetPoolFactory.sol/AssetPoolFactory.json';

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     description: Get status information about the API, admin account and asset pool factory.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               name:
 *                  type: string
 *                  description: API name and major version.
 *               version:
 *                  type: string
 *                  description: API semantic version.
 *               license:
 *                  type: string
 *                  description: API license.
 *               admin:
 *                  type: object
 *                  properties:
 *                     address:
 *                        type: string
 *                        description: Account address.
 *                     balance:
 *                        type: number
 *                        description: Admin Number token balance.
 *               factory:
 *                  type: object
 *                  properties:
 *                     deployed:
 *                        type: boolean
 *                        description: Checks if factory contract is deployed
 *                     address:
 *                        type: string
 *                        description: Asset Pool Factory address.
 *                     network:
 *                        type: string
 *                        description: The connected RPC (network)
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
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
