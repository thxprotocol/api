import { AssetPool, AssetPoolDocument } from '../models/AssetPool';
import { Account, AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { ASSET_POOL_BIN } from '../util/secrets';
import { assetPoolContract, tokenContract, ownerAccount } from '../util/network';
import { handleValidation } from '../util/validation';
import logger from '../util/logger';

/**
 * Get a AssetPool
 * @route GET /reward_pools/:address
 */
export const getAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    const from = ownerAccount().address;
    const assetPoolInstance = assetPoolContract(req.params.address);
    const tokenInstance = tokenContract(await assetPoolInstance.methods.token().call({ from }));
    const balance = await tokenInstance.methods.balanceOf(req.params.address).call({ from });
    const contractData = {
        balance: balance,
        rewardCount: await assetPoolInstance.methods.getRewardCount().call({ from }),
        withdrawCount: await assetPoolInstance.methods.getWithdrawCount().call({ from }),
        withdrawPollDuration: await assetPoolInstance.methods.withdrawPollDuration().call({ from }),
        rewardPollDuration: await assetPoolInstance.methods.rewardPollDuration().call({ from }),
    };

    AssetPool.findOne({ address: req.params.address }, (err, { uid, address, title }: AssetPoolDocument) => {
        if (err) {
            return next(err);
        }
        if (address) {
            res.send({ title, address, uid, ...contractData });
        } else {
            res.send({ msg: `No reward pool found for address ${address}` });
        }
    });
};

/**
 * Create a rewardRule
 * @route POST /reward_pools
 */
export const postAssetPool = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        const uid = req.session.passport.user;
        const from = ownerAccount().address;
        const instance = await assetPoolContract()
            .deploy({
                data: ASSET_POOL_BIN,
            })
            .send({ from });
        const address = instance.options.address;

        await instance.methods.initialize(from, req.body.token).send({ from });
        await instance.methods.addManager(from).send({ from });
        await instance.methods.addMember(from).send({ from });
        await instance.methods.setRewardPollDuration(90).send({ from });

        const assetPool = new AssetPool({
            title: req.body.title,
            address,
            uid,
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
                        return res.send(address);
                    });
                }
            });
        });
    } catch (err) {
        return res.send({ msg: 'AssetPool not deployed', err });
    }
};

export const postAssetPoolDeposit = async (req: Request, res: Response, next: NextFunction) => {
    const address = req.header('AssetPool');

    handleValidation(req, res);

    try {
        const from = ownerAccount().address;
        const instance = assetPoolContract(address);
        const tokenInstance = tokenContract(await instance.methods.token().call({ from }));

        // Check balance
        /// Return a QR here and handle approve and deposit in client app
    } catch (err) {
        logger.error(err);
        return res.send({ msg: 'AssetPool not deployed', err });
    }
};

export const updateAssetPool = async (req: Request, res: Response, next: NextFunction) => {};
