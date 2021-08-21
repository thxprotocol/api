import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { Reward } from '../../models/Reward';
import { callFunction, NetworkProvider, sendTransaction } from '../../util/network';
import { Account } from '../../models/Account';
import { Artifacts } from '../../util/artifacts';
import { parseLogs, findEvent } from '../../util/events';
import { Withdrawal, WithdrawalState } from '../../models/Withdrawal';
import { fromWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

export async function createWithdrawal(solution: Contract, args: any, npid: NetworkProvider) {
    const id = args.id;
    const memberId = args.member;
    const existingWithdrawal = await Withdrawal.findOne({ id, poolAddress: solution.options.address });

    if (existingWithdrawal) {
        return;
    }

    const amount = Number(fromWei(await callFunction(solution.methods.getAmount(id), npid)));
    const beneficiary = await callFunction(solution.methods.getAddressByMember(memberId), npid);
    const approved = await callFunction(solution.methods.withdrawPollApprovalState(id), npid);
    const startTime = Number(await callFunction(solution.methods.getStartTime(id), npid));
    const endTime = Number(await callFunction(solution.methods.getEndTime(id), npid));

    return new Withdrawal({
        id,
        amount,
        poolAddress: solution.options.address,
        beneficiary,
        approved,
        state: WithdrawalState.Pending,
        poll: {
            startTime,
            endTime,
            yesCounter: 0,
            noCounter: 0,
            totalVoted: 0,
        },
    });
}

/**
 * @swagger
 * /rewards/:id/claim:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Create a quick response image to claim the reward.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postRewardClaim = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const reward = await Reward.findOne({ poolAddress: req.assetPool.address, id: req.params.id });
        const account = await Account.findById(req.user.sub);

        if (!reward) {
            return next(new HttpError(404, 'Reward does not exist.'));
        }

        if (reward.beneficiaries.includes(account.address)) {
            return next(new HttpError(400, 'Reward already claimed for this address.'));
        }

        const isMember = await callFunction(req.solution.methods.isMember(account.address), req.assetPool.network);

        if (!isMember) {
            await sendTransaction(
                req.solution.options.address,
                req.solution.methods.addMember(account.address),
                req.assetPool.network,
            );
        }

        const tx = await sendTransaction(
            req.solution.options.address,
            req.solution.methods.claimRewardFor(req.params.id, account.address),
            req.assetPool.network,
        );

        try {
            const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
            const event = findEvent('WithdrawPollCreated', events);
            const withdrawal = await createWithdrawal(req.solution, event.args, req.assetPool.network);

            if (reward.beneficiaries.length) {
                reward.beneficiaries.push(account.address);
            } else {
                reward.beneficiaries = [account.address];
            }

            if (!req.assetPool.bypassPolls) {
                await reward.save();
                await withdrawal.save();

                return res.json({ withdrawal });
            }

            try {
                await sendTransaction(
                    req.solution.options.address,
                    req.solution.methods.withdrawPollFinalize(withdrawal.id),
                    req.assetPool.network,
                );

                const events = parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs);
                const eventWithdrawPollFinalized = findEvent('WithdrawPollFinalized', events);
                const eventWithdrawn = findEvent('Withdrawn', events);

                if (eventWithdrawPollFinalized) {
                    withdrawal.poll = null;
                }

                if (eventWithdrawn) {
                    withdrawal.state = WithdrawalState.Withdrawn;
                }

                await reward.save();
                await withdrawal.save();

                return res.status(200).end();
            } catch (err) {
                return next(new HttpError(500, 'Could not finalize the withdraw poll.', err));
            }
        } catch (err) {
            return next(new HttpError(500, 'Could not parse the transaction for this reward claim.', err));
        }
    } catch (err) {
        next(new HttpError(502, 'Could not claim the reward for this address', err));
    }
};
