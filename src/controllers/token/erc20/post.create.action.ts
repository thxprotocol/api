import { Request, Response } from 'express';

import ERC20Service from '@/services/ERC20Service';

export const postCreateToken = async (req: Request, res: Response) => {
    const { token } = await ERC20Service.create({
        name: req.body['name'],
        symbol: req.body['symbol'],
        network: req.body['network'],
        totalSupply: req.body['totalSupply'],
        sub: req.user.sub,
    });

    return res.send({ address: token.options.address });
};
