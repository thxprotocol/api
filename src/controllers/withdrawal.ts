import { NextFunction, Request, Response } from 'express';
import { assetPoolContract, ASSET_POOL, gasStation, parseResultLog, withdrawPollContract } from '../util/network';
import { HttpError } from '../models/Error';
import { VERSION } from '../util/secrets';
import qrcode from 'qrcode';
import '../config/passport';

/**
 * @swagger
 * /withdrawals/:address:
 *   get:
 *     tags:
 *       - withdrawals
 *     description: Get information about a withdrawal
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
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *              startTime:
 *                  type: string
 *                  description: DateTime of the start of the poll
 *              endTime:
 *                  type: string
 *                  description: DateTime of the start of the poll
 *              withdrawal:
 *                  type: string
 *                  description: Address of the withdraw poll
 *              beneficiary:
 *                  type: string
 *                  description: Beneficiary of the withdraw poll
 *              amount:
 *                  type: string
 *                  description: Rewarded amount for the beneficiary
 *              state:
 *                  type: string
 *                  description: WithdrawState [Pending, Approved, Rejected, Withdrawn]
 *              yesCounter:
 *                  type: string
 *                  description: Amount of yes votes
 *              noCounter:
 *                  type: string
 *                  description: Amount of no votes
 *              totalVotes:
 *                  type: string
 *                  description: Total amount of votes
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
export const getWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const withdrawal = withdrawPollContract(req.params.address);
        const beneficiary = await withdrawal.beneficiary();
        const amount = await withdrawal.amount();
        const approvalState = await withdrawal.getCurrentApprovalState();
        const startTime = (await withdrawal.startTime()).toNumber();
        const endTime = (await withdrawal.endTime()).toNumber();
        const yesCounter = (await withdrawal.yesCounter()).toNumber();
        const noCounter = (await withdrawal.noCounter()).toNumber();
        const totalVoted = (await withdrawal.totalVoted()).toNumber();

        res.json({
            startTime: {
                raw: startTime,
                formatted: new Date(startTime * 1000),
            },
            endTime: {
                raw: endTime,
                formatted: new Date(endTime * 1000),
            },
            address: withdrawal.address,
            beneficiary,
            amount,
            approvalState,
            yesCounter,
            noCounter,
            totalVoted,
        });
    } catch (err) {
        next(new HttpError(502, 'Withdraw Poll get data failed.', err));
    }
};

/**
 * @swagger
 * /withdrawals:
 *   get:
 *     tags:
 *       - withdrawals
 *     description: Get a list of withdrawals for the asset pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *          description: OK
 *          schema:
 *              withdrawPolls:
 *                  type: array
 *                  items:
 *                      type: string
 *       '400':
 *          description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *          description: Unauthorized. Authenticate your request please.
 *       '403':
 *          description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *          description: Internal Server Error.
 *       '502':
 *          description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const instance = assetPoolContract(req.header('AssetPool'));
        const filter = instance.filters.WithdrawPollCreated(req.body.member, null);
        const logs = await instance.queryFilter(filter, 0, 'latest');

        res.json({
            withdrawPolls: logs.map((log) => {
                return log.args.poll;
            }),
        });
    } catch (err) {
        next(new HttpError(502, 'Get WithdrawPollCreated logs failed.', err));
    }
};

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     tags:
 *       - withdrawals
 *     description: Propose a withdrawal in the asset pool.
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
 *         type: integer
 *       - name: beneficiary
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *          description: OK
 *       '302':
 *          description: Redirect to `GET /withdrawals/:address`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *          description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *          description: Unauthorized. Authenticate your request please.
 *       '403':
 *          description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *          description: Internal Server Error.
 *       '502':
 *          description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await (
            await gasStation.call(req.body.call, req.header('AssetPool'), req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((e: { name: string }) => e.name === 'WithdrawPollCreated')[0];
            const pollAddress = event.args.poll;

            res.redirect(`/${VERSION}/withdrawals/${pollAddress}`);
        } catch (err) {
            next(new HttpError(500, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};

/**
 * @swagger
 * /withdrawals/:address/withdraw:
 *   get:
 *     tags:
 *       - withdrawals
 *     description: Create a quick response image for withdrawing the reward.
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
 *       '200':
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               base64:
 *                  type: string
 *                  description: Base64 string representing function call*
 *       '400':
 *          description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *          description: Unauthorized. Authenticate your request please.
 *       '403':
 *          description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *          description: Internal Server Error.
 *       '502':
 *          description: Bad Gateway. Received an invalid response from the network or database.
 */
export const getWithdrawalWithdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const base64 = await qrcode.toDataURL(
            JSON.stringify({
                contractAddress: req.params.address,
                contract: 'WithdrawPoll',
                method: 'withdraw',
            }),
        );
        res.send({ base64 });
    } catch (err) {
        next(new HttpError(500, 'QR code encoding failed.', err));
    }
};

/**
 * @swagger
 * /withdrawals/:address/withdraw:
 *   post:
 *     tags:
 *       - withdrawals
 *     description: Create a quick response image for withdrawing the reward.
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
 *       '200':
 *         description: OK
 *       '400':
 *          description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *          description: Unauthorized. Authenticate your request please.
 *       '403':
 *          description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *          description: Internal Server Error.
 *       '502':
 *          description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postWithdrawalWithdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tx = await (
            await gasStation.call(req.body.call, req.params.address, req.body.nonce, req.body.sig)
        ).wait();

        try {
            const { error, logs } = await parseResultLog(ASSET_POOL.abi, tx.logs);

            if (error) {
                throw error;
            }

            const event = logs.filter((l) => l.name === 'Withdrawn')[0];

            res.redirect(`/${VERSION}/members/${event.args.member}`);
        } catch (error) {
            next(new HttpError(500, 'Parse logs failed.', error));
        }
    } catch (err) {
        next(new HttpError(502, 'Gas Station call failed.', err));
    }
};
