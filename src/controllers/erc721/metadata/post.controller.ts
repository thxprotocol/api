import ERC721Service from '@/services/ERC721Service';
import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { ForbiddenError, NotFoundError } from '@/util/errors';
import AccountProxy from '@/proxies/AccountProxy';
import { agenda, EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL } from '@/util/agenda';

const validation = [
    param('id').isMongoId(),
    body('title').isString().isLength({ min: 0, max: 100 }),
    body('description').isString().isLength({ min: 0, max: 400 }),
    // TODO Validate the metadata with the schema configured in the collection here
    body('attributes').exists(),
    body('recipient').optional().isEthereumAddress(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721']

    const erc721 = await ERC721Service.findById(req.params.id);
    if (!erc721) throw new NotFoundError('Could not find this NFT in the database');

    const metadata = await ERC721Service.createMetadata(
        erc721,
        req.body.title,
        req.body.description,
        req.body.attributes,
    );

    const tokens = metadata.tokens || [];

    if (req.body.recipient) {
        const account = await AccountProxy.getByAddress(req.body.recipient);
        if (!account) throw new ForbiddenError('You can currently only mint to THX Web Wallet addresses');
        const token = await ERC721Service.mint(req.assetPool, erc721, metadata, account);
        tokens.push(token);
    }

    // GENERATE THE METADATA QRCODES ZIP FILE WITHOUT SENDING THE NOTIFICATION EMAIL
    const poolId = String(req.assetPool._id);
    const sub = req.assetPool.sub;
    const notify = false;
    const fileName = `${req.assetPool._id}_metadata.zip`;

    await agenda.now(EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL, {
        poolId,
        sub,
        fileName,
        notify,
    });

    res.status(201).json({ ...metadata.toJSON(), tokens });
};

export default { controller, validation };
