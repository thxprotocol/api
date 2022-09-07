import { Request, Response } from 'express';
import { body } from 'express-validator';
import ERC20Service from '@/services/ERC20Service';

export const validation = [
    body('address').exists().isString(),
    body('chainId').exists().isInt(),
    body('logoImgUrl').optional().isString(),
];

export const controller = async (req: Request, res: Response) => {
    /*
    #swagger.tags = ['ERC20 Token']
    #swagger.responses[200] = { 
        description: "Add an ERC20 token for this user.",
        schema: { $ref: '#/definitions/ERC20Token' } } 
    */
    const erc20 = await ERC20Service.importERC20Token(
        Number(req.body.chainId),
        req.body.address,
        req.auth.sub,
        req.body.logoImgUrl,
    );

    res.status(201).json(erc20);
};
export default { controller, validation };
