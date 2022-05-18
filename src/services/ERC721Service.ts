import { ERC721, ERC721Document } from '@/models/ERC721';
import { ERC721Metadata, ERC721MetadataDocument } from '@/models/ERC721Metadata';
import { ERC721TokenState, TERC721, TERC721Metadata, TERC721Token } from '@/types/TERC721';
import TransactionService from './TransactionService';
import { getProvider } from '@/util/network';
import { API_URL, ITX_ACTIVE } from '@/config/secrets';
import { assertEvent, parseLogs } from '@/util/events';
import { AssetPoolDocument } from '@/models/AssetPool';
import { NetworkProvider } from '@/types/enums';
import InfuraService from './InfuraService';
import { getContract } from '@/config/contracts';
import { currentVersion } from '@thxnetwork/artifacts';
import { ERC721Token, ERC721TokenDocument } from '@/models/ERC721Token';

async function create(data: TERC721): Promise<ERC721Document> {
    const { admin } = getProvider(data.network);
    const tokenFactory = getContract(data.network, 'TokenFactory', currentVersion);
    const erc721 = new ERC721(data);

    erc721.baseURL = `${API_URL}/metadata/`;

    const { receipt } = await TransactionService.send(
        tokenFactory.options.address,
        tokenFactory.methods.deployNonFungibleToken(erc721.name, erc721.symbol, erc721.baseURL, admin.address),
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

export async function createMetadata(
    erc721: ERC721Document,
    title: string,
    description: string,
    attributes: any,
): Promise<ERC721MetadataDocument> {
    return await ERC721Metadata.create({
        erc721: String(erc721._id),
        title,
        description,
        attributes,
    });
}

export async function mint(
    assetPool: AssetPoolDocument,
    erc721: ERC721Document,
    metadata: ERC721MetadataDocument,
    recipient: string,
): Promise<ERC721TokenDocument> {
    const erc721token = new ERC721Token({
        state: ERC721TokenState.Pending,
        erc721Id: String(erc721._id),
        metadataId: String(metadata._id),
    });

    if (ITX_ACTIVE) {
        const tx = await InfuraService.schedule(
            assetPool.address,
            'mintFor',
            [recipient, String(metadata._id)],
            assetPool.network,
        );
        erc721token.transactions.push(String(tx._id));

        return await erc721token.save();
    } else {
        try {
            const { tx, receipt } = await TransactionService.send(
                assetPool.address,
                assetPool.contract.methods.mintFor(recipient, erc721.baseURL + String(erc721token.metadataId)),
                assetPool.network,
            );
            const event = assertEvent(
                'ERC721Minted',
                parseLogs(assetPool.contract.options.jsonInterface, receipt.logs),
            );

            erc721token.transactions.push(String(tx._id));
            erc721token.state = ERC721TokenState.Minted;
            erc721token.tokenId = Number(event.args.tokenId);
            erc721token.recipient = event.args.recipient;

            return await erc721token.save();
        } catch (error) {
            erc721token.updateOne({ failReason: error.message });
            throw error;
        }
    }
}

export async function parseAttributes(entry: ERC721MetadataDocument) {
    const attrs: { [key: string]: string } = {};

    for (const { key, value } of entry.attributes) {
        attrs[key.toLowerCase()] = value;
    }

    return attrs;
}

async function findTokenById(id: string): Promise<ERC721TokenDocument> {
    return await ERC721Token.findById(id);
}

async function findMetadataById(id: string): Promise<ERC721MetadataDocument> {
    return await ERC721Metadata.findById(id);
}

async function findTokensByRecipient(recipient: string, erc721Id: string): Promise<TERC721Token[]> {
    const result = [];
    for await (const token of ERC721Token.find({ recipient, erc721Id })) {
        const metadata = await ERC721Metadata.findById(token.metadataId);
        result.push({ ...token.toJSON(), metadata });
    }
    return result;
}

async function findTokensByMetadata(metadata: ERC721MetadataDocument): Promise<TERC721Token[]> {
    return ERC721Token.find({ metadataId: String(metadata._id) });
}

async function findMetadataByNFT(erc721: string): Promise<TERC721Metadata[]> {
    const result: TERC721Metadata[] = [];
    for await (const metadata of ERC721Metadata.find({ erc721 })) {
        const tokens = (await this.findTokensByMetadata(metadata)).map((m: ERC721MetadataDocument) => m.toJSON());
        result.push({ ...metadata.toJSON(), tokens });
    }
    return result;
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
    findTokenById,
    findTokensByMetadata,
    findMetadataById,
    findMetadataByNFT,
    findTokensByRecipient,
    findByQuery,
    parseAttributes,
};
