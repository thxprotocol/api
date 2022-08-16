import ERC20Service from '@/services/ERC20Service';
import { ERC20TokenDocument } from '@/models/ERC20Token';
import { Request, Response } from 'express';
import { TERC20, TERC20Token } from '@/types/TERC20';

export const controller = async (req: Request, res: Response) => {
    /*
    #swagger.tags = ['ERC20 Token']
    #swagger.responses[200] = { 
        description: 'Get a list of ERC20 tokens for this user.',
        schema: { 
            type: 'array',
            items: { 
                $ref: '#/definitions/ERC20Token',
            } 
        }
    }
    */
    const tokens = await ERC20Service.getTokensForSub(req.auth.sub);
    const result = await Promise.all(
        tokens.map(async (token: ERC20TokenDocument) => {
            const erc20 = await ERC20Service.getById(token.erc20Id);
            return { ...token.toJSON(), erc20 };
        }),
    );

    res.json(
        result.filter((token: TERC20Token & { erc20: TERC20 }) => {
            if (!req.query.chainId) return true;
            return Number(req.query.chainId) === token.erc20.chainId;
        }),
    );
};

export default { controller };
