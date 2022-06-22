import { Request, Response } from 'express';
import { body } from 'express-validator';
import { agenda, eventNameRequireTransactions } from '@/util/agenda';
import ERC20SwapService from '@/services/ERC20SwapService';

const validation = [
    body('call').exists(),
    body('nonce').exists(),
    body('sig').exists(),
    body('amountIn').exists().isNumeric(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC20Swaps']

    const { call, nonce, sig } = req.body;

    const erc20Swap = await ERC20SwapService.erc20Swap(
        req.assetPool,
        { call, nonce, sig },
        Number(req.body.amountIn),
        String(req.body.tokenInAddress),
    );

    agenda.now(eventNameRequireTransactions, {});

    res.json(erc20Swap);
};

export default {
    validation,
    controller,
};
