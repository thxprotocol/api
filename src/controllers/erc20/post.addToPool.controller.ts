import { Request, Response } from 'express';
import ERC20Service from '@/services/ERC20Service';
import { body } from 'express-validator';

export const postERC20TokenAddToPoolValidation = [
    body('tokenId').exists().isString(),
    body('poolId').exists().isString(),
    body('npid').exists().isNumeric(),
];

export const postERC20TokenAddToPool = async (req: Request, res: Response) => {
    const token = await ERC20Service.addTokenToPool({
        sub: req.user['sub'],
        tokenId: req.body['tokenId'],
        poolId: req.body['poolId'],
        npid: req.body['npid'],
    });

    return res.send({ ...(await token.JSON()) });
};
