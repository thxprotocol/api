import { Request, Response } from 'express';

import Token from '@/models/Token';
import TokenService from '@/services/TokenService';

export const postCreateToken = async (req: Request, res: Response) => {
    const { token, receipt } = await TokenService.createERC20({
        name: req.body['name'],
        symbol: req.body['symbol'],
        network: req.body['network'],
        totalSupply: req.body['totalSupply'],
    });

    await Token.create({
        name: req.body['name'],
        symbol: req.body['symbol'],
        network: req.body['network'],
        totalSupply: req.body['totalSupply'],
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.transactionHash,
        sub: req.user.sub,
    });

    res.send({ address: token.options.address });
};
