import { Request, Response } from 'express';
import { hex2a, parseLogs, findEvent } from '@/util/events';
import TransactionService from '@/services/TransactionService';
import { body } from 'express-validator';
import { InternalServerError } from '@/util/errors';
import { WithdrawalState } from '@/types/enums';
import { Withdrawal } from '@/models/Withdrawal';

export const createCallValidation = [body('call').exists(), body('nonce').exists(), body('sig').exists()];

export const postCall = async (req: Request, res: Response) => {
    // #swagger.tags = ['Relay Hub']
    const { contract, network, address } = req.assetPool;
    const { tx, receipt } = await TransactionService.send(
        contract.options.address,
        contract.methods.call(req.body.call, req.body.nonce, req.body.sig),
        network,
        250000,
    );
    const events = parseLogs(contract.options.jsonInterface, receipt.logs);
    const event = findEvent('Result', events);

    if (!event) throw new InternalServerError();
    if (!event.args.success) {
        const error = hex2a(event.args.data.substr(10));
        console.log(error);
        return res.status(500).json({
            error,
        });
    }

    const eventWithdrawn = findEvent('Withdrawn', events);
    if (eventWithdrawn) {
        await Withdrawal.updateOne(
            { withdrawalId: Number(eventWithdrawn.args.id), poolAddress: address },
            { state: WithdrawalState.Withdrawn },
        );
    }

    res.json(tx);
};
