import { AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import '../config/passport';
import { check, validationResult } from 'express-validator';
import { rewardPoolContract, ownerAccount } from '../util/network';
/**
 * Get a reward
 * @route GET /reward/:id
 */
export const getReward = async (req: Request, res: Response, next: NextFunction) => {
    const uid = req.session.passport.user;
    const address = req.header('RewardPool');

    await check(uid, 'The UID for this session is not found.').exists();
    await check(address, 'RewardPool unavailable to this account').isIn(
        (req.user as AccountDocument).profile.rewardPools,
    );

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).send(errors.array());
    }

    try {
        const from = ownerAccount().address;
        const contract = rewardPoolContract(address);
        const id = parseInt(req.params.id, 10);
        const reward = await contract.methods.rewards(id).call({ from });

        res.send(reward);
    } catch (err) {
        return res.status(404).send({ msg: 'Reward not found', err });
    }
};

/**
 * Create a reward
 * @route POST /reward/
 */
export const postReward = async (req: Request, res: Response, next: NextFunction) => {};
