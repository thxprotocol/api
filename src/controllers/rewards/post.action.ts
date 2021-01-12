import { Response, NextFunction } from 'express';
import { ISolutionRequest } from '../../util/network';
import { Reward } from '../../models/Reward';
import { HttpError } from '../../models/Error';
import { VERSION } from '../../util/secrets';
import ISolutionArtifact from '../../../src/artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json';
import { parseLogs } from '../../util/events';
/**
 * @swagger
 * /rewards:
 *   post:
 *     tags:
 *       - Rewards
 *     description: Create a new reward in the asset pool
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: title
 *         in: body
 *         required: true
 *         type: string
 *       - name: description
 *         in: body
 *         required: true
 *         type: string
 *       - name: withdrawAmount
 *         in: body
 *         required: true
 *         type: integer
 *       - name: withdrawDuration
 *         in: body
 *         required: true
 *         type: integer
 *     responses:
 *       '200':
 *          description: OK
 *       '302':
 *          headers:
 *              Location:
 *                  type: string
 *                  description: Redirect route to /reward/:id
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
export const postReward = async (req: ISolutionRequest, res: Response, next: NextFunction) => {
    try {
        const tx = await (await req.solution.addReward(req.body.withdrawAmount, req.body.withdrawDuration)).wait();

        try {
            const logs = await parseLogs(ISolutionArtifact.abi, tx.logs);
            const event = logs.filter((e: { name: string }) => e && e.name === 'RewardPollCreated')[0];
            const id = parseInt(event.args.id, 10);

            new Reward({
                id,
                title: req.body.title,
                description: req.body.description,
            }).save(async (err) => {
                if (err) {
                    next(new HttpError(502, 'Reward save failed.', err));
                    return;
                }

                res.redirect(`/${VERSION}/rewards/${id}`);
            });
        } catch (err) {
            next(new HttpError(502, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Asset Pool addReward failed.', err));
    }
};
