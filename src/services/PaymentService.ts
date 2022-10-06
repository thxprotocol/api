import { PaymentState } from '@/types/enums/PaymentState';
import { Payment, PaymentDocument } from '@/models/Payment';
import { WALLET_URL } from '@/config/secrets';
import { assertEvent, parseLogs } from '@/util/events';
import TransactionService from './TransactionService';
import { createRandomToken } from '@/util/token';
import ERC20Service from '@/services/ERC20Service';
import { AssetPoolDocument } from '@/models/AssetPool';
import { Contract } from 'web3-eth-contract';
import ERC721Service from './ERC721Service';
import AccountProxy from '@/proxies/AccountProxy';
import { logger } from '@/util/logger';
import AssetPoolService from './AssetPoolService';
import { getContractFromName } from '@/config/contracts';
import { TransactionReceipt } from 'web3-core';
import { TPayCallbackArgs } from '@/types/TTransaction';
import { TokenContractName } from '@thxnetwork/artifacts';
import db from '@/util/database';

async function create(
    pool: AssetPoolDocument,
    chainId: string,
    {
        amount,
        successUrl,
        failUrl,
        cancelUrl,
        metadataId,
    }: { amount: string; successUrl: string; failUrl: string; cancelUrl: string; metadataId?: string },
) {
    const token = createRandomToken();
    const address = await pool.contract.methods.getERC20().call();
    const erc20 = await ERC20Service.findOrImport(pool, address);

    return Payment.create({
        poolId: pool._id,
        chainId,
        state: PaymentState.Requested,
        token,
        amount,
        receiver: pool.address,
        tokenAddress: erc20.address,
        successUrl,
        failUrl,
        cancelUrl,
        metadataId,
        id: db.createUUID(),
    });
}

async function get(id: string) {
    return Payment.findOne({ id });
}

async function findByPool(pool: AssetPoolDocument) {
    return Payment.find({
        poolId: String(pool._id),
    });
}

async function pay(contract: Contract, payment: PaymentDocument, contractName: TokenContractName) {
    payment.state = PaymentState.Pending;
    await payment.save();

    const txId = await TransactionService.sendAsync(
        contract.options.address,
        contract.methods.transferFrom(payment.sender, payment.receiver, payment.amount),
        payment.chainId,
        true,
        {
            type: 'paymentCallback',
            args: { paymentId: String(payment._id), contractName, address: contract.options.address },
        },
    );

    return Payment.findByIdAndUpdate(payment._id, { transactions: [txId] }, { new: true });
}

async function payCallback(args: TPayCallbackArgs, receipt: TransactionReceipt) {
    const { paymentId, contractName, address } = args;
    const payment = await Payment.findById(paymentId);
    const contract = getContractFromName(payment.chainId, contractName, address);
    const events = parseLogs(contract.options.jsonInterface, receipt.logs);

    assertEvent('Transfer', events);

    if (payment.metadataId) {
        // PERFORM THE MINT OF THE NFT
        try {
            const metadata = await ERC721Service.findMetadataById(payment.metadataId);
            const erc721 = await ERC721Service.findById(metadata.erc721);
            const assetPool = await AssetPoolService.getById(payment.poolId);
            const account = await AccountProxy.getByAddress(payment.sender);
            await ERC721Service.mint(assetPool, erc721, metadata, account);
        } catch (err) {
            logger.error(err);
            throw new Error('ERROR ON MINT AFTER PAYMENT');
        }
    }

    payment.state = PaymentState.Completed;
    await payment.save();
}

function getPaymentUrl(id: string, token: string) {
    return `${WALLET_URL}/payment/${id}?accessToken=${token}`;
}

export default { create, pay, payCallback, get, getPaymentUrl, findByPool };
