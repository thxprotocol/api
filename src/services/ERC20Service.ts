import ERC20, { ERC20Document } from '@/models/ERC20';
import { toWei, fromWei } from 'web3-utils';
import { getProvider, tokenContract } from '@/util/network';
import { ICreateERC20Params } from '@/types/interfaces';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { getContract } from '@/config/contracts';
import { InternalServerError } from '@/util/errors';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import { AssetPoolDocument } from '@/models/AssetPool';
import { TERC20 } from '@/types/TERC20';

export const create = async (params: ICreateERC20Params) => {
    const { admin } = getProvider(params.network);
    const tokenFactory = getContract(params.network, 'TokenFactory');

    let fn;
    if (params.name && params.symbol && Number(params.totalSupply) > 0) {
        fn = tokenFactory.methods.deployLimitedSupplyToken(
            params.name,
            params.symbol,
            admin.address,
            toWei(String(params.totalSupply)),
        );
    }
    if (params.name && params.symbol && Number(params.totalSupply) === 0) {
        fn = tokenFactory.methods.deployUnlimitedSupplyToken(
            params.name,
            params.symbol,
            [admin.address],
            admin.address,
        );
    }

    if (!fn) throw new InternalServerError('Could not determine fn to call');

    const { receipt } = await TransactionService.send(tokenFactory.options.address, fn, params.network);
    const event = assertEvent('TokenDeployed', parseLogs(tokenFactory.options.jsonInterface, receipt.logs));
    const token = await ERC20.create({
        name: params.name,
        symbol: params.symbol,
        address: event.args.token,
        blockNumber: receipt.blockNumber,
        type: params.type,
        transactionHash: receipt.transactionHash,
        network: params.network,
        sub: params.sub,
    });

    return token;
};

export const getAll = (sub: string) => {
    return ERC20.find({ sub });
};

export const getById = (id: string) => {
    return ERC20.findById(id);
};

export const findBy = (query: { address: string; network: NetworkProvider }) => {
    return ERC20.findOne(query);
};

export const findByPool = async (assetPool: AssetPoolDocument): Promise<TERC20> => {
    const address = await assetPool.contract.methods.getToken().call();
    const erc20 = await ERC20.findOne({ network: assetPool.network, address });

    if (erc20) {
        const { name, type, symbol, totalSupply, logoURI } = await erc20.getResponse();
        return {
            address,
            name,
            type,
            symbol,
            contract: erc20.contract,
            totalSupply,
            logoURI,
        };
    }

    const contract = tokenContract(assetPool.network, 'LimitedSupplyToken', address);
    const [name, symbol, totalSupplyInWei] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.totalSupply().call(),
    ]);

    return {
        address,
        name,
        type: ERC20Type.Unknown,
        symbol,
        contract,
        totalSupply: Number(fromWei(totalSupplyInWei)),
        logoURI: '',
    };
};

export const removeById = (id: string) => {
    return ERC20.deleteOne({ _id: id });
};

export default {
    create,
    getAll,
    findBy,
    findByPool,
    getById,
    removeById,
};
