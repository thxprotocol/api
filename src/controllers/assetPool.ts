import logger from '../util/logger';
import { admin, assetPoolFactory } from '../util/network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { Account, AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, tokenContract } from '../util/network';
import { GAS_STATION_ADDRESS } from '../util/secrets';
import { HttpError } from '../models/Error';

/**
 * @swagger
 * /asset_pools/:address:
 *   get:
 *     tags:
 *       - Asset Pools
 *     description: Get information about a specific asset pool.
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
 *       400:
 *          description: Bad request. Asset pool potentially not deployed.
 *       404:
 *          description: No asset pool found for this address.
 *       200:
 *          description: An asset pool object exposing the configuration and balance.
 *          schema:
 *              type: object
 *              properties:
 *                 token:
 *                    type: object
 *                    properties:
 *                       name:
 *                          type: string
 *                          description: The name of the token configured for this asset pool
 *                       symbol:
 *                          type: string
 *                          description: The symbol of the token configured for this asset pool
 *                       balance:
 *                          type: number
 *                          description: The token balance of the asset pool for this token
 *                 proposeWithdrawPollDuration:
 *                    type: number
 *                    description: The default duration of the withdraw polls
 *                 rewardPollDuration:
 *                    type: number
 *                    description: The default duration of the reward polls
 */
export const getAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetPoolInstance = assetPoolContract(req.params.address);
        const tokenAddress = await assetPoolInstance.token();

        try {
            const tokenInstance = tokenContract(tokenAddress);
            const proposeWithdrawPollDuration = (await assetPoolInstance.proposeWithdrawPollDuration()).toNumber();
            const rewardPollDuration = (await assetPoolInstance.rewardPollDuration()).toNumber();
            const contractData = {
                token: {
                    address: tokenInstance.address,
                    name: await tokenInstance.name(),
                    symbol: await tokenInstance.symbol(),
                    balance: await tokenInstance.balanceOf(req.params.address),
                },
                proposeWithdrawPollDuration,
                rewardPollDuration,
            };
            const { uid, address, title }: AssetPoolDocument = await AssetPool.findOne({
                address: req.params.address,
            });

            if (!address) {
                next(new HttpError(404, 'Asset Pool is not found in database.'));
            }

            res.send({ title, address, uid, ...contractData });
        } catch (error) {
            next(new HttpError(500, 'Asset Pool network data can not be obtained.', error));
        }
    } catch (error) {
        next(new HttpError(404, 'Asset Pool is not found on network.', error));
    }
};

/**
 * @swagger
 * /asset_pools:
 *   post:
 *     tags:
 *       - Asset Pools
 *     description: Create a new asset pool, deploy it on the network and retrieve the address.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: title
 *         in: body
 *         required: true
 *         type: string
 *       - name: token
 *         description: Address of the ERC20 token used for this pool.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK.
 *         schema:
 *             type: object
 *             properties:
 *                address:
 *                   type: string
 *                   description: Address of the new asset pool.
 */
export const postAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetPool = await assetPoolFactory.deploy(admin.address, GAS_STATION_ADDRESS, req.body.token);
        const token = assetPool.token();

        try {
            await new AssetPool({
                address: assetPool.address,
                title: req.body.title,
                uid: req.session.passport.user,
            }).save();

            try {
                const account: AccountDocument = await Account.findById((req.user as AccountDocument).id);

                if (!account.profile.assetPools.includes(assetPool.address)) {
                    account.profile.assetPools.push(assetPool.address);
                    await account.save();
                }

                res.send({ address: assetPool.address });
            } catch (error) {
                next(new HttpError(500, 'Account account update failed.', error));
            }
        } catch (error) {
            next(new HttpError(500, 'Asset Pool database save failed.', error));
        }
    } catch (error) {
        next(new HttpError(500, 'Asset Pool network deploy failed.', error));
    }
};

/**
 * @swagger
 * /asset_pools/:address/:
 *   patch:
 *     tags:
 *       - Asset Pools
 *     description: Update the configuration for this asset pool
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
 *       - name: rewardPollDuration
 *         in: body
 *         required: true
 *         type: integer
 *       - name: proposeWithdrawPollDuration
 *         in: body
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: OK
 */
export const patchAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const instance = assetPoolContract(req.header('AssetPool'));

        if (req.body.rewardPollDuration) {
            if (isNaN(req.body.rewardPollDuration)) {
                next(new HttpError(400, 'rewardPollDuration is not a number.'));
                return;
            }

            try {
                await instance.setRewardPollDuration(req.body.rewardPollDuration);
            } catch (error) {
                next(new HttpError(500, 'Asset Pool setRewardPollDuration failed.', error));
                return;
            }
        }

        if (req.body.proposeWithdrawPollDuration) {
            if (isNaN(req.body.rewardPollDuration)) {
                next(new HttpError(400, 'proposeWithdrawPollDuration is not a number.'));
                return;
            }

            try {
                await instance.setProposeWithdrawPollDuration(req.body.proposeWithdrawPollDuration);
            } catch (error) {
                next(new HttpError(500, 'Asset Pool setProposeWithdrawPollDuration failed.', error));
                return;
            }
        }

        res.redirect('asset_pools/' + req.params.address);
    } catch (error) {
        next(new HttpError(500, 'Asset Pool patch failed.', error));
    }
};
