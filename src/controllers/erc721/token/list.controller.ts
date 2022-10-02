import { Request, Response } from 'express';
import { ERC721TokenDocument } from '@/models/ERC721Token';
import { TERC721, TERC721Token } from '@/types/TERC721';
import ERC721Service from '@/services/ERC721Service';

export const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']
    const tokens = await ERC721Service.findTokensBySub(req.auth.sub);
    const result = await Promise.all(
        tokens.map(async (token: ERC721TokenDocument) => {
            const erc721 = await ERC721Service.findById(token.erc721Id);
            const tokenUri = await erc721.contract.methods.tokenURI(token.tokenId).call();
            return { ...(token.toJSON() as TERC721Token), tokenUri, erc721 };
        }),
    );

    res.json(
        result.filter((token: TERC721Token & { erc721: TERC721 }) => {
            if (!req.query.chainId) return true;
            return Number(req.query.chainId) === token.erc721.chainId;
        }),
    );
};

export default { controller };
