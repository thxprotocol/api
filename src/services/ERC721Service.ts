import { ERC721, ERC721Document } from '@/models/ERC721';
import { ERC721Metadata, ERC721MetadataDocument } from '@/models/ERC721Metadata';
import { TERC721 } from '@/types/TERC721';
import TransactionService from './TransactionService';
import { getContractFromName, getProvider } from '@/util/network';
import { API_URL, ITX_ACTIVE } from '@/config/secrets';
import { assertEvent, parseLogs } from '@/util/events';
import { AssetPoolDocument } from '@/models/AssetPool';
import { NetworkProvider } from '@/types/enums';
import InfuraService from './InfuraService';

async function create(data: TERC721): Promise<ERC721Document> {
    const { admin } = getProvider(data.network);
    const tokenFactory = getContractFromName(data.network, 'TokenFactory');
    const erc721 = await ERC721.create(data);

    erc721.baseURL = `${API_URL}/metadata/`;

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

export async function createMetadata(erc721: ERC721Document, metadata: any): Promise<ERC721MetadataDocument> {
    return await ERC721Metadata.create({ erc721: String(erc721._id), metadata });
}

export async function mint(
    assetPool: AssetPoolDocument,
    erc721: ERC721Document,
    erc721metadata: ERC721MetadataDocument,
    beneficiary: string,
): Promise<ERC721MetadataDocument> {
    if (ITX_ACTIVE) {
        const tx = await InfuraService.schedule(
            assetPool.address,
            'mintFor',
            [beneficiary, String(erc721metadata._id)],
            assetPool.network,
        );
        erc721metadata.transactions.push(String(tx._id));

        return await erc721metadata.save();
    } else {
        try {
            const { tx, receipt } = await TransactionService.send(
                assetPool.address,
                assetPool.contract.methods.mintFor(beneficiary, erc721.baseURL + String(erc721metadata._id)),
                assetPool.network,
            );
            const event = assertEvent('Transfer', parseLogs(erc721.contract.options.jsonInterface, receipt.logs));

            erc721metadata.transactions.push(String(tx._id));
            erc721metadata.tokenId = Number(event.args.tokenId);
            erc721metadata.beneficiary = event.args.to;

            return await erc721metadata.save();
        } catch (error) {
            erc721metadata.updateOne({ failReason: error.message });
            throw error;
        }
    }
}

export async function parseAttributes(entry: ERC721MetadataDocument) {
    const attrs: { [key: string]: string } = {};

    for (const { key, value } of entry.metadata) {
        attrs[key.toLowerCase()] = value;
    }

    return attrs;
}

async function findMetadataById(id: string): Promise<ERC721MetadataDocument> {
    return await ERC721Metadata.findById(id);
}

async function findMetadataByBeneficiary(beneficiary: string): Promise<ERC721MetadataDocument[]> {
    return await ERC721Metadata.find({ beneficiary });
}

async function findMetadataByNFT(erc721: string): Promise<ERC721MetadataDocument[]> {
    return await ERC721Metadata.find({ erc721 });
}

async function findByQuery(query: { poolAddress?: string; address?: string; network?: NetworkProvider }) {
    return await ERC721.findOne(query);
}

export default {
    create,
    findById,
    createMetadata,
    mint,
    findBySub,
    findMetadataById,
    findMetadataByNFT,
    findMetadataByBeneficiary,
    findByQuery,
    parseAttributes,
};
