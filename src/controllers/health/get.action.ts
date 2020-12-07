import axios from 'axios';
import logger from '../../util/logger';
import { ethers } from 'ethers';
import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { admin, provider } from '../../util/network';
import { RPC } from '../../util/secrets';
import { VERSION } from '../../util/secrets';
import { name, version, license } from '../../../package.json';
/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     description: Get status information about the API and admin account
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
 *                  description: API name.
 *               version:
 *                  type: string
 *                  description: API version.
 *               license:
 *                  type: string
 *                  description: API license.
 *               RPC:
 *                  type: string
 *                  description: Active network RPC URL.
 *               address:
 *                  type: string
 *                  description: Admin account address.
 *               token:
 *                  type: object
 *                  properties:
 *                     name:
 *                        type: string
 *                        description: Network Gas Token name.
 *                     symbol:
 *                        type: string
 *                        description: Network Gas Token symbol.
 *                     balance:
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
            name: `${name} (${VERSION})`,
            version: version,
            license: license,
            RPC: RPC,
            address,
            token: {
                name: 'Matic Token',
                symbol: 'MATIC',
                balance: number,
            },
        });
    } catch (error) {
        next(new HttpError(502, 'Matic GetBalance failed', error));
    }
};
