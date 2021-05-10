import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import { parseLogs } from '../../util/events';
import { BigNumber } from 'ethers';
import { SolutionArtifact } from '../../util/network';
import { formatEther } from 'ethers/lib/utils';
import { Withdrawal } from '../../models/Withdrawal';
import { WithdrawalState } from '../../models/Withdrawal';
import IDefaultDiamondArtifact from '../../../src/artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';

/**
 * @swagger
 * /rewards/:id/give:
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
 *       - name: member
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               withdrawPoll:
 *                  type: string
 *                  description: Address off the withdraw poll
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
export const postRewardClaimFor = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const result = await req.solution.getReward(req.params.id);

        if (!result) {
            throw new Error(result);
        }

        try {
            const tx = await (await req.solution.claimRewardFor(req.params.id, req.body.member)).wait();

            try {
                const logs = await parseLogs(SolutionArtifact.abi, tx.logs);
                const event = logs.filter((e: { name: string }) => e && e.name === 'WithdrawPollCreated')[0];
                const withdrawalId = BigNumber.from(event.args.id).toNumber();

                try {
                    console.log('start with');

                    const withdrawal = new Withdrawal({
                        id: withdrawalId,
                        amount: Number(formatEther(await req.solution.getAmount(withdrawalId))),
                        poolAddress: req.solution.address,
                        beneficiary: await req.solution.getAddressByMember(event.args.member),
                        approved: await req.solution.withdrawPollApprovalState(withdrawalId),
                        state: WithdrawalState.Pending,
                        poll: {
                            startTime: (await req.solution.getStartTime(withdrawalId)).toNumber(),
                            endTime: (await req.solution.getEndTime(withdrawalId)).toNumber(),
                            yesCounter: 0,
                            noCounter: 0,
                            totalVoted: 0,
                        },
                    });

                    await withdrawal.save();

                    try {
                        const duration = (await req.solution.getWithdrawDuration(withdrawalId)).toNumber();

                        if (req.assetPool.bypassPolls && duration === 0) {
                            try {
                                const tx = await (await req.solution.withdrawPollFinalize(withdrawalId)).wait();

                                try {
                                    const logs = await parseLogs(IDefaultDiamondArtifact.abi, tx.logs);
                                    const event = logs.filter((e: { name: string }) => e && e.name === 'Withdrawn')[0];

                                    if (event) {
                                        withdrawal.state = WithdrawalState.Withdrawn;
                                        await withdrawal.save();
                                    }

                                    res.json(withdrawal);
                                } catch (e) {
                                    return next(
                                        new HttpError(
                                            500,
                                            'Could not parse the transaction event logs for the finalize call.',
                                            e,
                                        ),
                                    );
                                }
                            } catch (e) {
                                return next(new HttpError(502, 'Could not finalize the withdraw poll.'));
                            }
                        }
                    } catch (e) {
                        return next(
                            new HttpError(502, 'Could determine if governance is disabled for this withdrawal.', e),
                        );
                    }
                } catch (e) {
                    return next(new HttpError(502, 'Could not store the withdrawal in the database.', e));
                }
            } catch (e) {
                return next(new HttpError(500, 'Could not parse the transaction for this reward claim.', e));
            }
        } catch (e) {
            return next(new HttpError(502, 'Could not claim the reward for this member.', e));
        }
    } catch (e) {
        next(new HttpError(502, 'Could not find this reward on the network.', e));
    }
};
