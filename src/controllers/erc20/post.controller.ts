import { Request, Response } from 'express';
import { body, check } from 'express-validator';
import ERC20Service from '@/services/ERC20Service';
import AccountProxy from '@/proxies/AccountProxy';
import { checkAndUpgradeToBasicPlan } from '@/util/plans';
import { ERC20Type } from '@/types/enums';

import ImageService from '@/services/ImageService';

export const validation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('chainId').exists().isNumeric(),
    body('type').exists().isNumeric(),
    body('totalSupply').optional().isNumeric(),
    check('file')
        .optional()
        .custom((value, { req }) => {
            return ['jpg', 'jpeg', 'gif', 'png'].includes(req.file.mimetype);
        }),
];

export const controller = async (req: Request, res: Response) => {
    /*
    #swagger.tags = ['ERC20 Contract']
    #swagger.responses[200] = { 
            description: 'Deploy an ERC20 contract for this user.',
            schema: { $ref: '#/definitions/ERC20' } 
    }
    */
    const account = await AccountProxy.getById(req.auth.sub);

    await checkAndUpgradeToBasicPlan(account, req.body.chainId);

    let logoImgUrl;
    if (req.file) {
        const response = await ImageService.upload(req.file);
        logoImgUrl = ImageService.getPublicUrl(response.key);
    }

    const erc20 = await ERC20Service.deploy({
        name: req.body.name,
        symbol: req.body.symbol,
        chainId: req.body.chainId,
        totalSupply: req.body.totalSupply,
        type: req.body.type,
        sub: req.auth.sub,
        logoImgUrl,
    });

    res.status(201).json(erc20);
};
export default { controller, validation };
