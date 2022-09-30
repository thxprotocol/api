import ERC20, { ERC20Document, IERC20Updates } from '@/models/ERC20';
import { toWei } from 'web3-utils';
import { ICreateERC20Params } from '@/types/interfaces';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { ChainId, ERC20Type } from '@/types/enums';
import { AssetPoolDocument } from '@/models/AssetPool';
import { TokenContractName } from '@thxnetwork/artifacts';
import { getAbiForContractName, getByteCodeForContractName, getContractFromName } from '@/config/contracts';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { ERC20Token } from '@/models/ERC20Token';
import { getProvider } from '@/util/network';
import MembershipService from './MembershipService';
import { TransactionReceipt } from 'web3-core';
import { TERC20DeployCallbackArgs } from '@/types/TTransaction';

function getDeployArgs(erc20: ERC20Document, totalSupply?: string) {
    const { defaultAccount } = getProvider(erc20.chainId);

    switch (erc20.type) {
        case ERC20Type.Limited: {
            return [erc20.name, erc20.symbol, defaultAccount, toWei(String(totalSupply))];
        }
        case ERC20Type.Unlimited: {
            return [erc20.name, erc20.symbol, defaultAccount];
        }
    }
}

export const deploy = async (contractName: TokenContractName, params: ICreateERC20Params, forceSync = true) => {
    const erc20 = await ERC20.create({
        name: params.name,
        symbol: params.symbol,
        chainId: params.chainId,
        type: params.type,
        sub: params.sub,
        archived: false,
        logoImgUrl: params.logoImgUrl,
    });

    const txId = await TransactionService.deployAsync(
        getAbiForContractName(contractName),
        getByteCodeForContractName(contractName),
        getDeployArgs(erc20, params.totalSupply),
        erc20.chainId,
        forceSync,
        { type: 'Erc20DeployCallback', args: { erc20Id: String(erc20._id) } },
    );

    return await ERC20.findByIdAndUpdate(erc20._id, { transactions: [txId] }, { new: true });
};

export async function deployCallback({ erc20Id }: TERC20DeployCallbackArgs, receipt: TransactionReceipt) {
    // TODO: (how to) validate receipt?
    await ERC20.findByIdAndUpdate(erc20Id, { address: receipt.contractAddress });
}

const initialize = async (pool: AssetPoolDocument, address: string) => {
    const erc20 = await findBy({ chainId: pool.chainId, address, sub: pool.sub });
    if (erc20 && erc20.type === ERC20Type.Unlimited) {
        await addMinter(erc20, pool.address);
    }
    await MembershipService.addERC20Membership(pool.sub, pool);
};

const addMinter = async (erc20: ERC20Document, address: string) => {
    const receipt = await TransactionService.send(
        erc20.address,
        erc20.contract.methods.grantRole(keccak256(toUtf8Bytes('MINTER_ROLE')), address),
        erc20.chainId,
    );

    assertEvent('RoleGranted', parseLogs(erc20.contract.options.jsonInterface, receipt.logs));
};

export const getAll = (sub: string) => {
    return ERC20.find({ sub });
};

export const getTokensForSub = (sub: string) => {
    return ERC20Token.find({ sub });
};

export const getById = (id: string) => {
    return ERC20.findById(id);
};

export const getTokenById = (id: string) => {
    return ERC20Token.findById(id);
};

export const findBy = (query: { address: string; chainId: ChainId; sub?: string }) => {
    return ERC20.findOne(query);
};

export const findOrImport = async (pool: AssetPoolDocument, address: string) => {
    let erc20 = await findBy({ chainId: pool.chainId, address, sub: pool.sub });
    if (erc20) return erc20;

    const contract = getContractFromName(pool.chainId, 'LimitedSupplyToken', address);
    const [name, symbol] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.totalSupply().call(),
    ]);

    erc20 = await ERC20.create({
        name,
        symbol,
        address,
        chainId: pool.chainId,
        type: ERC20Type.Unknown,
        sub: pool.sub,
        archived: false,
    });

    // Create an ERC20Token object for the sub if it does not exist
    if (
        !(await ERC20Token.exists({
            sub: erc20.sub,
            erc20Id: String(erc20._id),
        }))
    ) {
        await ERC20Token.create({
            sub: erc20.sub,
            erc20Id: String(erc20._id),
        });
    }

    return erc20;
};

export const importERC20Token = async (chainId: number, address: string, sub: string, logoImgUrl: string) => {
    const contract = getContractFromName(chainId, 'LimitedSupplyToken', address);

    const [name, symbol] = await Promise.all([contract.methods.name().call(), contract.methods.symbol().call()]);

    const erc20 = await ERC20.create({
        name,
        symbol,
        address,
        chainId,
        type: ERC20Type.Unknown,
        sub,
        logoImgUrl,
    });

    // Create an ERC20Token object for the sub if it does not exist
    if (
        !(await ERC20Token.exists({
            sub: erc20.sub,
            erc20Id: String(erc20._id),
        }))
    ) {
        await ERC20Token.create({
            sub: erc20.sub,
            erc20Id: String(erc20._id),
        });
    }

    return erc20;
};

export const getOnChainERC20Token = async (chainId: number, address: string) => {
    const contract = getContractFromName(chainId, 'LimitedSupplyToken', address);

    const [name, symbol, totalSupply] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.totalSupply().call(),
    ]);

    return { name, symbol, totalSupply };
};

export const findByPool = async (assetPool: AssetPoolDocument): Promise<ERC20Document> => {
    const address = await assetPool.contract.methods.getERC20().call();
    return await findOrImport(assetPool, address);
};

export const removeById = (id: string) => {
    return ERC20.deleteOne({ _id: id });
};

export const update = (erc20: ERC20Document, updates: IERC20Updates) => {
    return ERC20.findByIdAndUpdate(erc20._id, updates, { new: true });
};

export default {
    deploy,
    getAll,
    findBy,
    findByPool,
    getById,
    removeById,
    addMinter,
    findOrImport,
    importERC20Token,
    getTokensForSub,
    getTokenById,
    update,
    initialize,
    getOnChainERC20Token,
};
