import { toWei } from 'web3-utils';
import { AssetPoolType } from '@/models/AssetPool';
import { Deposit } from '@/models/Deposit';
import { getProvider, tokenContract } from '@/util/network';
import { IAccount } from '@/models/Account';
import { AmountExceedsAllowanceError, InsufficientBalanceError } from '@/util/errors';
import { DepositState } from '@/enums/DepositState';
import { TransactionService } from './TransactionService';

// Checks for allowance and balance to be sufficient and transfers
// promoCode price amount from token owner to spender address (pool owner)
async function create(assetPool: AssetPoolType, owner: IAccount, price: number, item: string) {
    const tokenAddress = await TransactionService.call(assetPool.solution.methods.getToken(), assetPool.network);
    const token = tokenContract(assetPool.network, tokenAddress);
    const amount = toWei(String(price));

    //Check clientside to make request response faster?
    const balance = await TransactionService.call(token.methods.balanceOf(owner.address), assetPool.network);
    if (balance < amount) {
        throw new InsufficientBalanceError();
    }

    //Check clientside to make request response faster?
    const allowance = await TransactionService.call(
        token.methods.allowance(owner.address, assetPool.address),
        assetPool.network,
    );
    if (allowance < amount) {
        throw new AmountExceedsAllowanceError();
    }

    // Get the index of the block agenda should start listening for
    const { web3 } = getProvider(assetPool.network);
    const fromBlock = await web3.eth.getBlockNumber();

    // Create a Pending Payment to update after Transfer succeeds
    const payment = await Deposit.create({
        sub: owner.id,
        sender: owner.address,
        receiver: assetPool.address,
        amount: price,
        state: DepositState.Pending,
        item,
        fromBlock,
    });

    return await payment.save();
}

export default { create };
