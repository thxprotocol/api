import logger from '../util/logger';
import { admin, assetPoolFactory } from '../util/network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { Account, AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, tokenContract } from '../util/network';
import { validationResult } from 'express-validator';
import { GAS_STATION_ADDRESS } from '../util/secrets';

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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        const assetPoolInstance = assetPoolContract(req.params.address);
        const tokenAddress = await assetPoolInstance.token();
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
        const { uid, address, title }: AssetPoolDocument = await AssetPool.findOne({ address: req.params.address });

        if (!address) {
            throw Error(`No asset pool found for address ${address}`);
        }

        res.send({ title, address, uid, ...contractData });
    } catch (err) {
        const error = err.toString();
        logger.error(error);
        res.status(404).json({ msg: 'Something went wrong while getting the asset pool', error });
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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        // Deploy asset pool contract
        const assetPool = await assetPoolFactory.deploy(admin.address, GAS_STATION_ADDRESS, req.body.token);

        // Store asset pool metadata
        await new AssetPool({
            address: assetPool.address,
            title: req.body.title,
            uid: req.session.passport.user,
        }).save();

        // // Update account
        const account: AccountDocument = await Account.findById((req.user as AccountDocument).id);

        if (!account.profile.assetPools.includes(assetPool.address)) {
            account.profile.assetPools.push(assetPool.address);
            await account.save();
        }

        res.send({ address: assetPool.address });
    } catch (err) {
        console.log(err.toString());
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() }).end();
    }
};

/**
 * @swagger
 * /asset_pools/:address/deposit:
 *   post:
 *     tags:
 *       - Asset Pools
 *     description: Create a deposit for an asset pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: amount
 *         in: body
 *         required: true
 *         type: string
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 */
export const postAssetPoolDeposit = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        const address = req.header('AssetPool');
        const instance = assetPoolContract(address);
        const tokenInstance = tokenContract(await instance.token());
        const balance = await tokenInstance.balanceOf(address);

        // TODO Return a QR here and handle approve and deposit in client app
    } catch (err) {
        logger.error(err.toString());
        res.status(400).json({ msg: err.toString() });
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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        const instance = assetPoolContract(req.header('AssetPool'));

        if (req.body.rewardPollDuration) {
            await instance.setRewardPollDuration(req.body.rewardPollDuration);
        }
        if (req.body.proposeWithdrawPollDuration) {
            await instance.setProposeWithdrawPollDuration(req.body.proposeWithdrawPollDuration);
        }

        res.redirect('asset_pools/' + req.params.address);
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
    }
};
