import { Request, Response } from 'express';
import ERC721Service from '@/services/ERC721Service';
import { ERC721MetadataDocument } from '@/models/ERC721Metadata';

export const ListERC721MetadataController = async (req: Request, res: Response) => {
    const result: ERC721MetadataDocument[] = await ERC721Service.findMetadataBySub(req.user.sub);

    res.json(result);
};
