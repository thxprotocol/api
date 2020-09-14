import { RewardPool, RewardPoolDocument } from '../models/RewardPool';
import { Account, AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import { REWARD_POOL_BIN } from '../util/secrets';
import { rewardPoolContract, tokenContract, ownerAccount } from '../util/network';
import { handleValidation } from '../util/validation';
import logger from '../util/logger';

/**
 * Get a rewardPool
 * @route GET /reward_pools/:address
 */
export const getRewardPool = async (req: Request, res: Response, next: NextFunction) => {
    const account = req.user as AccountDocument;

    if (!account.profile.rewardPools.includes(req.params.address)) {
        return res.send({ msg: 'No access to reward pool' });
    }

    const from = ownerAccount().address;
    const rewardPoolInstance = rewardPoolContract(req.params.address);
    const tokenInstance = tokenContract(await rewardPoolInstance.methods.token().call({ from }));
    const contractData = {
        balance: await tokenInstance.methods.balanceOf(req.params.address).call({ from }),
        rewardRuleCount: await rewardPoolInstance.methods.getRewardRuleCount().call({ from }),
        rewardCount: await rewardPoolInstance.methods.getRewardCount().call({ from }),
        rewardPollDuration: await rewardPoolInstance.methods.rewardPollDuration().call({ from }),
        rewardRulePollDuration: await rewardPoolInstance.methods.rewardRulePollDuration().call({ from }),
        minRewardRulePollTokensPerc: await rewardPoolInstance.methods.minRewardRulePollTokensPerc().call({ from }),
        minRewardPollTokensPerc: await rewardPoolInstance.methods.minRewardPollTokensPerc().call({ from }),
    };

    RewardPool.findOne({ address: req.params.address }, (err, { uid, address, title }: RewardPoolDocument) => {
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
export const postRewardPool = async (req: Request, res: Response, next: NextFunction) => {
    handleValidation(req, res);

    try {
        const uid = req.session.passport.user;
        const from = ownerAccount().address;
        const instance = await rewardPoolContract()
            .deploy({
                data: REWARD_POOL_BIN,
            })
            .send({ from });
        const address = instance.options.address;

        await instance.methods.initialize(from, req.body.token).send({ from });
        await instance.methods.addManager(from).send({ from });
        await instance.methods.addMember(from).send({ from });
        await instance.methods.setRewardRulePollDuration(90).send({ from });
        await instance.methods.setMinRewardRulePollTokensPerc(0).send({ from });

        const rewardPool = new RewardPool({
            title: req.body.title,
            address,
            uid,
        });

        rewardPool.save(async (err) => {
            if (err) {
                return res.send({ msg: 'RewardPool not saved', err });
            }
            Account.findById((req.user as AccountDocument).id, (err, account: AccountDocument) => {
                if (err) {
                    return res.send({ msg: 'User not updated', err });
                }

                if (!account.profile.rewardPools.includes(address)) {
                    account.profile.rewardPools.push(address);
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
        return res.send({ msg: 'RewardPool not deployed', err });
    }
};

export const postRewardPoolDeposit = async (req: Request, res: Response, next: NextFunction) => {
    const address = req.header('RewardPool');

    handleValidation(req, res);

    try {
        const from = ownerAccount().address;
        const instance = rewardPoolContract(address);
        const tokenInstance = tokenContract(await instance.methods.token().call({ from }));

        // Check balance
        /// Return a QR here and handle approve and deposit in client app
    } catch (err) {
        logger.error(err);
        return res.send({ msg: 'RewardPool not deployed', err });
    }
};

export const updateRewardPool = async (req: Request, res: Response, next: NextFunction) => {};
