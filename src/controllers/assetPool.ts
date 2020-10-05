import { ASSET_POOL_BIN } from '../util/network';
import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { Account, AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, tokenContract, options } from '../util/network';
import { handleValidation } from '../util/validation';
import logger from '../util/logger';

/**
 * Get a AssetPool
 * @route GET /reward_pools/:address
 */
export const getAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        const assetPoolInstance = assetPoolContract(req.params.address);
        const tokenAddress = await assetPoolInstance.methods.token().call(options);
        const tokenInstance = tokenContract(tokenAddress);
        const contractData = {
            token: {
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
        logger.error(err);
        res.status(500).send({ msg: 'AssetPool not deployed', err });
    }
};

/**
 * Create a rewardRule
 * @route POST /reward_pools
 */
export const postAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        const instance = await assetPoolContract()
            .deploy({
                data: ASSET_POOL_BIN,
            })
            .send(options);
        const address = instance.options.address;

        await instance.methods.initialize(options.from, req.body.token).send(options);

        const assetPool = new AssetPool({
            address,
            title: req.body.title,
            uid: req.session.passport.user,
        });

        assetPool.save(async (err) => {
            if (err) {
                return res.send({ msg: 'AssetPool not saved', err });
            }
            Account.findById((req.user as AccountDocument).id, (err, account: AccountDocument) => {
                if (err) {
                    return res.send({ msg: 'User not updated', err });
                }

                if (!account.profile.assetPools.includes(address)) {
                    account.profile.assetPools.push(address);
                    account.save(async (err: any) => {
                        if (err) {
                            return res.send({ msg: 'User not updated', err });
                        }
                        res.redirect('/v1/asset_pools/' + address);
                    });
                }
            });
        });
    } catch (err) {
        logger.error(err);
        res.status(500).send({ msg: 'AssetPool not deployed', err });
    }
};

/**
 * Create a deposit for this asset pool
 * @route POST /reward_pools/:address/deposit
 */
export const postAssetPoolDeposit = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        const address = req.header('AssetPool');
        const instance = assetPoolContract(address);
        const tokenInstance = tokenContract(await instance.methods.token().call(options));
        const balance = tokenInstance.methods.balanceOf(address).call(options);

        // TODO Return a QR here and handle approve and deposit in client app
    } catch (err) {
        logger.error(err);
        res.status(500).send({ msg: 'Transaction failed', err });
    }
};

/**
 * Update the configuration for this reward
 * @route PUT /reward_pools/:address
 */
export const putAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        const instance = assetPoolContract(req.header('AssetPool'));

        await instance.methods.setRewardPollDuration(req.body.rewardPollDuration).send(options);
        await instance.methods.setProposeWithdrawPollDuration(req.body.proposeWithdrawPollDuration).send(options);

        res.redirect('/v1/asset_pools/' + req.params.address);
    } catch (err) {
        logger.error(err);
        res.status(500).send({ msg: 'Transaction failed', err });
    }
};
