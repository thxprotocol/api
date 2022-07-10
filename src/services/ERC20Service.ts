import ERC20, { ERC20Document } from '@/models/ERC20';
import { toWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { ICreateERC20Params } from '@/types/interfaces';
import TransactionService from './TransactionService';
import { assertEvent, CustomEventLog, parseLogs } from '@/util/events';
import { ChainId, ERC20Type } from '@/types/enums';
import { AssetPoolDocument } from '@/models/AssetPool';
import { currentVersion } from '@thxnetwork/artifacts';
import { getContract, getContractFromName } from '@/config/contracts';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { ERC20Token } from '@/models/ERC20Token';
import { TransactionDocument } from '@/models/Transaction';

function getDeployFnArgsCallback(erc20: ERC20Document, totalSupply: string) {
    const { admin } = getProvider(erc20.chainId);
    const callback = async (tx: TransactionDocument, events?: CustomEventLog[]): Promise<ERC20Document> => {
        if (events) {
            const event = assertEvent('TokenDeployed', events);
            erc20.address = event.args.token;
        }

        erc20.transactions.push(String(tx._id));

        return await erc20.save();
    };

    switch (erc20.type) {
        case ERC20Type.Limited: {
            return {
                fn: 'deployLimitedSupplyToken',
                args: [erc20.name, erc20.symbol, admin.address, toWei(String(totalSupply))],
                callback,
            };
        }
        case ERC20Type.Unlimited: {
            return {
                fn: 'deployUnlimitedSupplyToken',
                args: [erc20.name, erc20.symbol, admin.address],
                callback,
            };
        }
    }
}

export const deploy = async (params: ICreateERC20Params) => {
    const tokenFactory = getContract(params.chainId, 'TokenFactory', currentVersion);
    const erc20 = await ERC20.create({
        name: params.name,
        symbol: params.symbol,
        chainId: params.chainId,
        type: params.type,
        sub: params.sub,
    });
    const { fn, args, callback } = getDeployFnArgsCallback(erc20, params.totalSupply);

    return await TransactionService.relay(tokenFactory, fn, args, erc20.chainId, callback);
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
