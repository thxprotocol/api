import { Request, Response, NextFunction } from 'express';
import { solutionContract } from '../../util/network';
import { Reward } from '../../models/Reward';
import { HttpError } from '../../models/Error';
import qrcode from 'qrcode';

/**
 * @swagger
 * /rewards/:id:
 *   patch:
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
export const patchReward = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metaData = await Reward.findOne({ id: req.params.id });

        if (!req.body.title || req.body.title !== metaData.title) {
            metaData.title = req.body.title;
        }

        if (!req.body.description || req.body.description !== metaData.description) {
            metaData.description = req.body.description;
        }

        try {
            metaData.save(async (err) => {
                if (err) {
                    next(new HttpError(502, 'Reward metadata find failed.', err));
                    return;
                }

                try {
                    const instance = solutionContract(req.header('AssetPool'));
                    let { withdrawAmount, withdrawDuration } = await instance.rewards(req.params.id);

                    if (req.body.withdrawAmount && withdrawAmount !== req.body.withdrawAmount) {
                        withdrawAmount = req.body.withdrawAmount;
                    }

                    if (req.body.withdrawDuration && withdrawDuration !== req.body.withdrawDuration) {
                        withdrawDuration = req.body.withdrawDuration;
                    }

                    const base64 = await qrcode.toDataURL(
                        JSON.stringify({
                            assetPoolAddress: req.header('AssetPool'),
                            contractAddress: req.header('AssetPool'),
                            contract: 'AssetPool',
                            method: 'updateReward',
                            params: {
                                id: req.params.id,
                                withdrawAmount,
                                withdrawDuration,
                            },
                        }),
                    );
                    res.json({ base64 });
                } catch (error) {
                    next(new HttpError(502, 'Asset Pool get reward failed.', err));
                    return;
                }
            });
        } catch (error) {
            next(new HttpError(502, 'Reward metadata save failed.', error));
            return;
        }
    } catch (error) {
        next(new HttpError(502, 'Reward find failed.', error));
    }
};
