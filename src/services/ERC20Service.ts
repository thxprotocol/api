import BN from 'bn.js';
import { ethers } from 'ethers';
import { Contract } from 'web3-eth-contract';
import { toWei } from 'web3-utils';

import ERC20 from '@/models/ERC20';
import { ERC20Type } from '@/types/enums';
import { deployLimitedSupplyERC20Contract, deployUnlimitedSupplyERC20Contract, getProvider } from '@/util/network';
import { ICreateERC20Params, ITransferERC20MintedParams } from '@/types/interfaces';
import TransactionService from './TransactionService';

export const create = async (params: ICreateERC20Params) => {
    let response: { token: Contract; receipt: ethers.providers.TransactionReceipt };
    const { admin } = getProvider(params.network);

    if (Number(params.totalSupply) > 0) {
        const { token, receipt } = await deployLimitedSupplyERC20Contract(
            params.network,
            params.name,
            params.symbol,
            admin.address,
            toWei(new BN(params.totalSupply)),
        );

        response = { token, receipt } as any;
    } else {
        const { token, receipt } = await deployUnlimitedSupplyERC20Contract(
            params.network,
            params.name,
            params.symbol,
            admin.address,
        );

        response = { token, receipt } as any;
    }

    const token = await ERC20.create({
        name: params.name,
        symbol: params.symbol,
        address: response.token.options.address,
        blockNumber: response.receipt.blockNumber,
        type: Number(params.totalSupply) > 0 ? ERC20Type.LIMITED : ERC20Type.UNLIMITED,
        transactionHash: response.receipt.transactionHash,
        network: params.network,
        sub: params.sub,
    });

    return token;
};

export const getAll = async (sub: string) => {
    const tokens = await ERC20.find({ sub });
    return tokens || [];
};

export const getById = async (id: string) => {
    const token = await ERC20.findById(id);
    return token;
};

export const transferMintedBalance = async (params: ITransferERC20MintedParams) => {
    const { admin } = getProvider(params.npid);
    const token = await ERC20.findById(params.id);

    if (token.network !== params.npid) {
        throw Error('Cannot transfer balances that not in the same network');
    }

    const { methods } = token.contract;
    const adminBalance: BN = await methods.balanceOf(admin.address);

    if (adminBalance.toNumber() <= 0) {
        throw Error('Cannot transfer token since due to insufficient fund of admin account');
    }

    const { tx, receipt } = await TransactionService.send(
        token.contract.options.address,
        methods.transfer(params.to, adminBalance),
        params.npid,
        250000,
    );

    return { tx, receipt };
};

export default {
    create,
    getAll,
    getById,
    transferMintedBalance,
};
