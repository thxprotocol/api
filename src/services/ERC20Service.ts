import ERC20, { ERC20Document } from '@/models/ERC20';
import { toWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { ICreateERC20Params } from '@/types/interfaces';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { ChainId, ERC20Type } from '@/types/enums';
import { AssetPoolDocument } from '@/models/AssetPool';
import { currentVersion } from '@thxnetwork/artifacts';
import { getContract, getContractFromName } from '@/config/contracts';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { ERC20Token } from '@/models/ERC20Token';

export const deploy = async (params: ICreateERC20Params) => {
    const { admin } = getProvider(params.chainId);
    const tokenFactory = getContract(params.chainId, 'TokenFactory', currentVersion);

    let fn;
    if (params.type === ERC20Type.Limited) {
        fn = tokenFactory.methods.deployLimitedSupplyToken(
            params.name,
            params.symbol,
            admin.address,
            toWei(String(params.totalSupply)),
        );
    }
    if (params.type === ERC20Type.Unlimited) {
        fn = tokenFactory.methods.deployUnlimitedSupplyToken(params.name, params.symbol, admin.address);
    }

    const { receipt } = await TransactionService.send(tokenFactory.options.address, fn, params.chainId);
    const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));
    const { _id } = await ERC20.create({
        name: params.name,
        symbol: params.symbol,
        address: event.args.token,
        chainId: params.chainId,
        type: params.type,
        sub: params.sub,
    });

    return await ERC20.findById(_id);
};

const addMinter = async (erc20: ERC20Document, address: string) => {
    const { receipt } = await TransactionService.send(
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
    console.log(sub);
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
    const erc20 = await findBy({ chainId: pool.chainId, address, sub: pool.sub });
    if (erc20) return erc20;

    const contract = getContractFromName(pool.chainId, 'LimitedSupplyToken', address);
    const [name, symbol] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.totalSupply().call(),
    ]);
    const { _id } = await ERC20.create({
        name,
        symbol,
        address,
        chainId: pool.chainId,
        type: ERC20Type.Unknown,
        sub: pool.sub,
    });

    return await ERC20.findById(_id);
};

export const findByPool = async (assetPool: AssetPoolDocument): Promise<ERC20Document> => {
    const address = await assetPool.contract.methods.getERC20().call();
    return await findOrImport(assetPool, address);
};

export const removeById = (id: string) => {
    return ERC20.deleteOne({ _id: id });
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
    getTokensForSub,
    getTokenById,
};
