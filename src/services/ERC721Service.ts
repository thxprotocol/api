import { ERC721, ERC721Document } from '@/models/ERC721';
import { TERC721 } from '@/types/TERC721';
import { paginatedResults } from '@/util/pagination';
import TransactionService from './TransactionService';
import { TransactionDocument } from '@/models/Transaction';
import { deployERC721Contract, getProvider } from '@/util/network';
import { API_URL } from '@/config/secrets';

async function create(data: TERC721): Promise<ERC721Document> {
    return await ERC721.create(data);
}

export async function findById(id: string): Promise<ERC721Document> {
    return await ERC721.findById(id);
}

export async function mint(erc721: ERC721Document, beneficiary: string): Promise<TransactionDocument> {
    const { tx } = await TransactionService.send(
        erc721.address,
        erc721.contract.methods.mint(beneficiary),
        erc721.network,
    );
    return tx;
}

async function deploy(erc721: ERC721Document): Promise<ERC721Document> {
    const { admin } = getProvider(erc721.network);
    const baseURL = `${API_URL}/erc721/${String(erc721._id)}/metadata/`;
    const contract = await deployERC721Contract(erc721.network, erc721.name, erc721.symbol, admin.address, baseURL);
    erc721.address = contract.options.address;
    return await erc721.save();
}

// page 1 and limit 10 are the default pagination start settings
function findByQuery(query: { poolAddress: string }, page = 1, limit = 10) {
    return paginatedResults(ERC721, page, limit, query);
}

export default { create, findById, mint, deploy, findByQuery };
