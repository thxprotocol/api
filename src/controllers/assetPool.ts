import { ASSET_POOL_BIN } from '../util/network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { Account, AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, tokenContract, options } from '../util/network';
import logger from '../util/logger';
import { validationResult } from 'express-validator';

/**
 * @swagger
 * /asset_pools/:address:
 *   get:
 *     tags:
 *       - asset_pools
 *     description: Get an asset pool
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
        return res.status(400).send(errors.array()).end();
    }

    try {
        const assetPoolInstance = assetPoolContract(req.params.address);
        const tokenAddress = await assetPoolInstance.methods.token().call(options);
        const tokenInstance = tokenContract(tokenAddress);
        const contractData = {
            token: {
                address: tokenInstance.options.address,
                name: await tokenInstance.methods.name().call(options),
                symbol: await tokenInstance.methods.symbol().call(options),
                balance: await tokenInstance.methods.balanceOf(req.params.address).call(options),
            },
            proposeWithdrawPollDuration: await assetPoolInstance.methods.proposeWithdrawPollDuration().call(options),
            rewardPollDuration: await assetPoolInstance.methods.rewardPollDuration().call(options),
        };

        AssetPool.findOne({ address: req.params.address }, (err, { uid, address, title }: AssetPoolDocument) => {
            if (err) {
                return next(err);
            }
            if (address) {
                res.send({ title, address, uid, ...contractData });
            } else {
                logger.error(err);
                res.status(404).send({ msg: `No reward pool found for address ${address}` });
            }
        });
    } catch (err) {
        logger.error(err.toString());
        res.status(400).send({ msg: err.toString() });
    }
};

/**
 * @swagger
 * /asset_pools:
 *   post:
 *     tags:
 *       - asset_pools
 *     description: Create an asset pool
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
 *         description: Success code.
 */
export const postAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    let address = '';

    if (!errors.isEmpty()) {
        return res.status(400).send(errors.array()).end();
    }

    try {
        const instance = await assetPoolContract()
            .deploy({
                data: ASSET_POOL_BIN,
            })
            .send(options);
        address = instance.options.address;

        await instance.methods.initialize(options.from, req.body.token).send(options);
    } catch (err) {
        logger.error(err.toString());
        return res.status(400).send({ msg: err.toString() }).end();
    }

    const assetPool = new AssetPool({
        address,
        title: req.body.title,
        uid: req.session.passport.user,
    });

    assetPool.save(async (err) => {
        if (err) {
            return next(err);
        }
        Account.findById((req.user as AccountDocument).id, (err, account: AccountDocument) => {
            if (err) {
                return next(err);
            }

            if (!account.profile.assetPools.includes(address)) {
                account.profile.assetPools.push(address);
                account.save(async (err: any) => {
                    if (err) {
                        return next(err);
                    }
                    res.send({ address });
                });
            }
        });
    });
};

/**
 * @swagger
 * /asset_pools/:address/deposit:
 *   post:
 *     tags:
 *       - asset_pools
 *     description: Create an asset pool
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
 *         description: Success code.
 */
export const postAssetPoolDeposit = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).send(errors.array()).end();
    }

    try {
        const address = req.header('AssetPool');
        const instance = assetPoolContract(address);
        const tokenInstance = tokenContract(await instance.methods.token().call(options));
        const balance = tokenInstance.methods.balanceOf(address).call(options);

        // TODO Return a QR here and handle approve and deposit in client app
    } catch (err) {
        logger.error(err.toString());
        res.status(400).send({ msg: err.toString() });
    }
};

/**
 * @swagger
 * /asset_pools/:address/:
 *   put:
 *     tags:
 *       - asset_pools
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
 *         type: int
 *       - name: proposeWithdrawPollDuration
 *         in: body
 *         required: true
 *         type: int
 *     responses:
 *       200:
 *         description: Success.
 */
export const putAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).send(errors.array()).end();
    }

    try {
        const instance = assetPoolContract(req.header('AssetPool'));

        await instance.methods.setRewardPollDuration(req.body.rewardPollDuration).send(options);
        await instance.methods.setProposeWithdrawPollDuration(req.body.proposeWithdrawPollDuration).send(options);

        res.redirect('/v1/asset_pools/' + req.params.address);
    } catch (err) {
        logger.error(err.toString());
        res.status(400).send({ msg: err.toString() });
    }
};
