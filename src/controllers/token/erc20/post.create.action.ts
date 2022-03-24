import { Request, Response } from 'express';

import TokenService from '@/services/TokenService';

export const postCreateToken = async (req: Request, res: Response) => {
    const { token } = await TokenService.createERC20Token({
        name: req.body['name'],
        symbol: req.body['symbol'],
        network: req.body['network'],
        totalSupply: req.body['totalSupply'],
        sub: req.user.sub,
    });

    return res.send({ address: token.options.address });
};
