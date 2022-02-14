import { toWei, toChecksumAddress } from 'web3-utils';
import { IAssetPool } from '../models/AssetPool';
import { Payment } from '../models/Payment';
import { callFunction, NetworkProvider, sendTransaction, tokenContract } from '../util/network';
import { IAccount } from '../models/Account';
import { AmountExceedsAllowanceError, InsufficientBalanceError, TokenPaymentFailedError } from '../util/errors';
import { findEvent, parseLogs } from '../util/events';
import { PaymentState } from '../enums/PaymentState';

// Checks for allowance and balance to be sufficient and transfers
// promoCode price amount from token owner to spender address (pool owner)
async function create(assetPool: IAssetPool, owner: IAccount, price: number, item: string, npid: NetworkProvider) {
    const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
    const token = tokenContract(npid, tokenAddress);
    const amount = toWei(String(price));

    //Check clientside to make request response faster?
    const balance = await callFunction(token.methods.balanceOf(owner.address), npid);
    console.log(balance, amount);
    if (balance < amount) {
        throw new InsufficientBalanceError();
    }

    //Check clientside to make request response faster?
    const allowance = await callFunction(token.methods.allowance(owner.address, assetPool.address), npid);
    console.log(allowance, amount);
    if (allowance < amount) {
        throw new AmountExceedsAllowanceError();
    }

    // Create a Pending Payment to update after Transfer succeeds
    const payment = await Payment.create({
        sub: owner.id,
        sender: owner.address,
        receiver: assetPool.address,
        amount: price,
        state: PaymentState.Pending,
        item,
    });

    // Try to send the transaction and catch and throw for any errors
    try {
        console.log(assetPool.solution.options.address);
        const tx = await sendTransaction(
            toChecksumAddress(assetPool.solution.options.address),
            assetPool.solution.methods.deposit(amount),
            assetPool.network,
        );
        const event = findEvent('Transfer', parseLogs(tx.logs));
        if (!event) {
            throw new TokenPaymentFailedError();
        }
    } catch (error) {
        console.log(error);
        throw new TokenPaymentFailedError();
    }

    payment.state = PaymentState.Completed;

    return await payment.save();
}

export default { create };
