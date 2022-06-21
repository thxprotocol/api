import { Request, Response } from 'express';
import { hex2a, parseLogs, findEvent } from '@/util/events';
import TransactionService from '@/services/TransactionService';
import { body } from 'express-validator';
import { InternalServerError } from '@/util/errors';
import { WithdrawalState } from '@/types/enums';
import { Withdrawal } from '@/models/Withdrawal';
import { logger } from '@/util/logger';

const validation = [body('call').exists(), body('nonce').exists(), body('sig').exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Relay Hub']
    const { contract, chainId, address } = req.assetPool;
    const { tx, receipt } = await TransactionService.send(
        contract.options.address,
        contract.methods.call(req.body.call, req.body.nonce, req.body.sig),
        chainId,
        500000,
    );
    const events = parseLogs(contract.options.jsonInterface, receipt.logs);
    const event = findEvent('Result', events);

    if (!event) throw new InternalServerError();
    if (!event.args.success) {
        const error = hex2a(event.args.data.substr(10));
        logger.error(error);
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

export default { controller, validation };
