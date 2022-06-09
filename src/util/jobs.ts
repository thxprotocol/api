import { Deposit } from '@/models/Deposit';
import { TransactionDocument } from '@/models/Transaction';
import { Withdrawal } from '@/models/Withdrawal';
import MemberService from '@/services/MemberService';
import AssetPoolService from '@/services/AssetPoolService';
import { DepositState, WithdrawalState } from '@/types/enums';
import { ERC721TokenState } from '@/types/TERC721';
import { CustomEventLog, findEvent } from './events';
import { ERC721Token } from '@/models/ERC721Token';
import { logger } from './logger';
import { AssetPool } from '@/models/AssetPool';
import { Payment } from '@/models/Payment';
import { PaymentState } from '@/types/enums/PaymentState';

type CustomEventHandler = (event?: CustomEventLog) => Promise<void>;

async function handleEvents(tx: TransactionDocument, events: CustomEventLog[]) {
    const eventHandlers: { [eventName: string]: CustomEventHandler } = {
        Deposited: async function () {
            await Deposit.updateOne({ transactions: String(tx._id) }, { state: DepositState.Completed });
            await Payment.updateOne({ transactions: String(tx._id) }, { state: PaymentState.Completed });
        },
        Topup: async function () {
            const deposit = await Deposit.findOne({ transactions: String(tx._id) });
            deposit.state = DepositState.Completed;
            await deposit.save();
        },
        PoolDeployed: async function (event?: CustomEventLog) {
            const pool = await AssetPool.findOne({ transactions: String(tx._id) });
            pool.address = event.args.pool;
            await pool.save();

            if (pool.variant === 'defaultPool') {
                await AssetPoolService.initializeDefaultPool(pool, event.args.token);
            }
            if (pool.variant === 'nftPool') {
                await AssetPoolService.initializeNFTPool(pool, event.args.token);
            }
            // if (pool.variant === 'paymentPool') {
            //     await AssetPoolService.initializePaymentPool(pool, event.args.token);
            // }
        },
        ERC721Minted: async function (event?: CustomEventLog) {
            await ERC721Token.updateOne(
                { transactions: String(tx._id) },
                {
                    state: ERC721TokenState.Minted,
                    tokenId: Number(event.args.tokenId),
                    recipient: event.args.recipient,
                    failReason: '',
                },
            );
        },
        RoleGranted: async function (event?: CustomEventLog) {
            const pool = await AssetPool.findOne({ address: tx.to });
            if (pool) {
                await MemberService.addExistingMember(pool, event.args.account);
            }
        },
        WithdrawPollCreated: async function (event?: CustomEventLog) {
            await Withdrawal.updateOne(
                { transactions: String(tx._id) },
                {
                    withdrawalId: Number(event.args.id),
                    poolAddress: tx.to,
                    failReason: '',
                },
            );
        },
        Withdrawn: async function () {
            await Withdrawal.updateOne(
                { transactions: String(tx._id) },
                { state: WithdrawalState.Withdrawn, failReason: '' },
            );
        },
    };

    for (const eventName in eventHandlers) {
        const event = findEvent(eventName, events);

        if (event) {
            await eventHandlers[eventName](event);
        }
    }
}

async function handleError(tx: TransactionDocument, failReason: string) {
    logger.error(failReason);

    await tx.updateOne({ failReason });

    // TODO Remove these and read from tx in controller
    await Withdrawal.updateOne({ transactions: String(tx._id) }, { failReason });
    await Deposit.updateOne({ transactions: String(tx._id) }, { failReason });
    await ERC721Token.updateOne({ transactions: String(tx._id) }, { failReason });
}

export { handleEvents, handleError };
