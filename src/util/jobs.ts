import { AssetPoolType } from '@/models/AssetPool';
import { Deposit } from '@/models/Deposit';
import { ERC721Metadata } from '@/models/ERC721Metadata';
import { TransactionDocument } from '@/models/Transaction';
import { Withdrawal } from '@/models/Withdrawal';
import MemberService from '@/services/MemberService';
import { DepositState, WithdrawalState } from '@/types/enums';
import { ERC721MetadataState } from '@/types/TERC721';
import { CustomEventLog, findEvent } from './events';

async function handleEvents(assetPool: AssetPoolType, tx: TransactionDocument, events: CustomEventLog[]) {
    const eventDepositted = findEvent('Depositted', events);
    const eventRoleGranted = findEvent('RoleGranted', events);
    const eventWithdrawPollCreated = findEvent('WithdrawPollCreated', events);
    const eventWithdrawPollFinalized = findEvent('WithdrawPollFinalized', events);
    const eventWithdrawn = findEvent('Withdrawn', events);
    const eventTransfer = findEvent('Transfer', events);

    if (eventTransfer) {
        await ERC721Metadata.updateOne(
            { transactions: String(tx._id) },
            {
                state: ERC721MetadataState.Minted,
                tokenId: Number(eventTransfer.args.tokenId),
                recipient: eventTransfer.args.to,
                failReason: '',
            },
        );
    }

    if (eventDepositted) {
        const deposit = await Deposit.findOne({ transactions: String(tx._id) });
        deposit.transactions.push(String(tx._id));
        deposit.state = DepositState.Completed;
        await deposit.save();
    }

    if (eventRoleGranted) {
        await MemberService.addExistingMember(assetPool, eventRoleGranted.args.account);
    }

    if (eventWithdrawPollCreated) {
        await Withdrawal.updateOne(
            { transactions: String(tx._id) },
            {
                withdrawalId: Number(eventWithdrawPollCreated.args.id),
                poolAddress: assetPool.address,
                failReason: '',
            },
        );
    }

    if (eventWithdrawPollFinalized && eventWithdrawn) {
        await Withdrawal.updateOne(
            { transactions: String(tx._id) },
            { state: WithdrawalState.Withdrawn, failReason: '' },
        );
    }
}

async function handleError(tx: TransactionDocument, failReason: string) {
    await Withdrawal.updateOne({ transactions: String(tx._id) }, { failReason });
    await Deposit.updateOne({ transactions: String(tx._id) }, { failReason });
}

export { handleEvents, handleError };
