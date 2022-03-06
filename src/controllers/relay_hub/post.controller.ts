import { Request, Response } from 'express';
import { hex2a, parseLogs, findEvent } from '@/util/events';
import TransactionService from '@/services/TransactionService';

import { Artifacts } from '@/config/contracts/artifacts';
import { body } from 'express-validator';
import { InternalServerError } from '@/util/errors';
import { WithdrawalState } from '@/types/enums';
import { Withdrawal } from '@/models/Withdrawal';

export const createCallValidation = [body('call').exists(), body('nonce').exists(), body('sig').exists()];

export const postCall = async (req: Request, res: Response) => {
    // Check NETWORK_ENVIRONMENT for dev and prod and invoke InfuraService if applicable
    const { tx, receipt } = await TransactionService.send(
        req.assetPool.solution.options.address,
        req.assetPool.solution.methods.call(req.body.call, req.body.nonce, req.body.sig),
        req.assetPool.network,
        250000,
    );
    const events = parseLogs(Artifacts.IDefaultDiamond.abi, receipt.logs);
    const event = findEvent('Result', events);

    if (!event) throw new InternalServerError();
    if (!event.args.success) {
        const error = hex2a(event.args.data.substr(10));

        return res.status(500).json({
            error,
        });
    }

    const eventWithdrawn = findEvent('Withdrawn', events);
    if (eventWithdrawn) {
        await Withdrawal.updateOne(
            { withdrawalId: Number(eventWithdrawn.args.id), poolAddress: req.assetPool.address },
            { state: WithdrawalState.Withdrawn },
        );
    }

    res.json(tx);
};

/**
 * @swagger
 * /gas_station/call:
 *   post:
 *     tags:
 *       - Gas Station
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: call
 *         in: body
 *         required: true
 *         type: string
 *       - name: nonce
 *         in: body
 *         required: true
 *         type: string
 *       - name: sig
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: Ok
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to make this call.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
