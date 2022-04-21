import { ERC721, ERC721Document } from '@/models/ERC721';
import { ERC721Metadata, ERC721MetadataDocument } from '@/models/ERC721Metadata';
import { TERC721 } from '@/types/TERC721';
import TransactionService from './TransactionService';
import { getContractFromName, getProvider } from '@/util/network';
import { API_URL } from '@/config/secrets';
import { assertEvent, parseLogs } from '@/util/events';
import { AssetPoolDocument } from '@/models/AssetPool';
import { NetworkProvider } from '@/types/enums';

async function create(data: TERC721): Promise<ERC721Document> {
    const { admin } = getProvider(data.network);
    const tokenFactory = getContractFromName(data.network, 'TokenFactory');
    const erc721 = await ERC721.create(data);

    erc721.baseURL = `${API_URL}/erc721/${String(erc721._id)}/metadata/`;

    const { receipt } = await TransactionService.send(
        tokenFactory.options.address,
        tokenFactory.methods.deployNonFungibleToken(erc721.name, erc721.symbol, admin.address, erc721.baseURL),
        erc721.network,
    );
    const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));

    erc721.address = event.args.token;

    return await erc721.save();
}

export async function findById(id: string): Promise<ERC721Document> {
    return await ERC721.findById(id);
}

export async function findBySub(sub: string): Promise<ERC721Document[]> {
    return await ERC721.find({ sub });
}

export async function mint(
    assetPool: AssetPoolDocument,
    erc721: ERC721Document,
    beneficiary: string,
    metadata: any,
): Promise<ERC721MetadataDocument> {
    const erc721metadata = await ERC721Metadata.create({ erc721: String(erc721._id), metadata });
    const { receipt } = await TransactionService.send(
        assetPool.address,
        assetPool.contract.methods.mintFor(beneficiary, erc721.baseURL + String(erc721metadata._id)),
        assetPool.network,
    );
    const event = assertEvent('Transfer', parseLogs(erc721.contract.options.jsonInterface, receipt.logs));

    erc721metadata.tokenId = Number(event.args.tokenId);

    return await erc721metadata.save();
}

export async function parseMetadata(entry: ERC721MetadataDocument) {
    const metadata: { [key: string]: string } = {};

    for (const { key, value } of entry.metadata) {
        metadata[key] = value;
    }

    return metadata;
}

async function findMetadataById(id: string) {
    return await ERC721Metadata.findById(id);
}

async function findByQuery(query: { address: string; network: NetworkProvider }) {
    return await ERC721.findOne(query);
}

export default { create, findById, mint, findBySub, findMetadataById, findByQuery, parseMetadata };
