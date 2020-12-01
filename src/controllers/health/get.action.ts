import axios from 'axios';
import logger from '../../util/logger';
import { ethers } from 'ethers';
import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { admin, provider } from '../../util/network';
import { RPC } from '../../util/secrets';
import * as PackageJSON from '../../../package.json';

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     description: Get status information about the API and admin account
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               RPC:
 *                  type: string
 *                  description: Active network RPC URL.
 *               address:
 *                  type: string
 *                  description: Address of the admin account.
 *               balance:
 *                  type: object
 *                  properties:
 *                     name:
 *                        type: string
 *                        description: Network Gas Token name.
 *                     symbol:
 *                        type: string
 *                        description: Network Gas Token symbol.
 *                     bignumber:
 *                        type: object
 *                        description: Admin BigNumber token balance.
 *                     number:
 *                        type: number
 *                        description: Admin Number token balance.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const address = await admin.getAddress();
        const bignumber = await provider.getBalance(address);
        const number = ethers.utils.formatEther(bignumber);

        if (Number(number) < 1 && RPC.includes('mumbai')) {
            try {
                const res = await axios.post('https://api.faucet.matic.network/getTokens', {
                    address,
                    network: 'mumbai',
                    token: 'maticToken',
                });

                if (res.data.hash) {
                    logger.info('MATIC requested from faucet: ', res.data);
                }
            } catch (error) {
                next(new HttpError(502, 'Matic getTokens failed', error));
            }
        }
        res.json({
            name: PackageJSON.name,
            version: PackageJSON.version,
            license: PackageJSON.license,
            RPC: RPC,
            address,
            balance: {
                name: 'Matic Token',
                symbol: 'MATIC',
                bignumber,
                number,
            },
        });
    } catch (error) {
        next(new HttpError(502, 'Matic GetBalance failed', error));
    }
};
