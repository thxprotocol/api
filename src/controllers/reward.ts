import { AccountDocument } from '../models/Account';
import { Request, Response, NextFunction } from 'express';
import '../config/passport';
import { check, validationResult } from 'express-validator';
import { rewardPoolContract, ownerAccount } from '../util/network';
import logger from '../util/logger';

async function isAllowed(req: Request, res: Response) {
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
}

/**
 * Get a reward
 * @route GET /rewards/:id
 */
export const getReward = async (req: Request, res: Response, next: NextFunction) => {
    const address = req.header('RewardPool');

    await isAllowed(req, res);

    try {
        const from = ownerAccount().address;
        const contract = rewardPoolContract(address);
        const id = parseInt(req.params.id, 10);
        const reward = await contract.methods.rewards(id).call({ from });

        res.send({ reward });
    } catch (err) {
        logger.error(err);
        return res.status(404).end();
    }
};

/**
 * Create a reward
 * @route POST /reward/
 */
export const postReward = async (req: Request, res: Response, next: NextFunction) => {
    const address = req.header('RewardPool');

    await check('amount', 'Request body should have amount').exists();
    await check('beneficiary', 'Request body should have beneficiary').exists();

    await isAllowed(req, res);

    try {
        const from = ownerAccount().address;
        const contract = rewardPoolContract(address);
        const tx = await contract.methods
            .proposeReward(req.body.amount.toString(), req.body.beneficiary)
            .send({ from });
        const rewardAddress = tx.events.RewardPollCreated.returnValues.reward;

        // Should also return the id, or lookup (GET) should change
        res.status(200).send({ reward: rewardAddress });
    } catch (err) {
        logger.error(err);
        return res.status(500).end();
    }
};
