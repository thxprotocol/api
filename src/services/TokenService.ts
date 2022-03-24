import BN from 'bn.js';
import { ethers } from 'ethers';
import { Contract } from 'web3-eth-contract';
import { toWei } from 'web3-utils';

import Token from '@/models/Token';
import { NetworkProvider } from '@/types/enums';
import { deployLimitedSupplyERC20Contract, deployUnlimitedSupplyERC20Contract, getProvider } from '@/util/network';
import TransactionService from './TransactionService';

export default class TokenService {
    static async createERC20Token(params: CreateERC20Params) {
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

        await Token.create({
            name: params.name,
            symbol: params.symbol,
            network: params.network,
            totalSupply: params.totalSupply,
            blockNumber: response.receipt.blockNumber,
            transactionHash: response.receipt.transactionHash,
            sub: params.sub,
        });

        return response;
    }

    static async getAllERC20TokenBySub(sub: string) {
        const tokens = await Token.find({ sub });
        return tokens || [];
    }

    static async getERC20TokenById(id: string) {
        const token = await Token.findById(id);
        return token;
    }

    static async transferERC20MintedBalance(params: TransferERC20MintedParams) {
        const { admin } = getProvider(params.npid);
        const token = await Token.findById(params.id);

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
    }
}

export interface CreateERC20Params {
    name: string;
    symbol: string;
    totalSupply: string;
    network: NetworkProvider;
    sub: string;
}

export interface TransferERC20MintedParams {
    id: string;
    to: string;
    npid: NetworkProvider;
}
