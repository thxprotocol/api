import { Request, Response } from 'express';
import { body, check, query } from 'express-validator';
import ERC721Service from '@/services/ERC721Service';
import ImageService from '@/services/ImageService';
import { BadRequestError } from '@/util/errors';

const validation = [
    body('name').exists().isString(),
    body('symbol').exists().isString(),
    body('description').exists().isString(),
    body('chainId').exists().isNumeric(),
    body('schema').exists(),
    check('file')
        .optional()
        .custom((value, { req }) => {
            return ['jpg', 'jpeg', 'gif', 'png'].includes(req.file.mimetype);
        }),
    query('forceSync').optional().isBoolean(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']

    let logoImgUrl;
    if (req.file) {
        const response = await ImageService.upload(req.file);
        logoImgUrl = ImageService.getPublicUrl(response.key);
    }
    let properties: any;
    try {
        properties = typeof req.body.schema == 'string' ? JSON.parse(req.body.schema) : req.body.schema;
    } catch (err) {
        throw new BadRequestError('invalid schema');
    }

    if (!Array.isArray(properties)) {
        throw new BadRequestError('schema must be an Array');
    }

    const forceSync = req.query.forceSync !== undefined ? Boolean(req.query.forceSync) : false;

    const erc721 = await ERC721Service.deploy(
        {
            sub: req.auth.sub,
            chainId: req.body.chainId,
            name: req.body.name,
            symbol: req.body.symbol,
            description: req.body.description,
            properties,
            archived: false,
            logoImgUrl,
        },
        forceSync,
    );

    res.status(201).json(erc721);
};

export default { controller, validation };
