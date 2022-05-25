import { Deposit } from '@/models/Deposit';
import { TransactionDocument } from '@/models/Transaction';
import { Withdrawal } from '@/models/Withdrawal';
import MemberService from '@/services/MemberService';
import { DepositState, WithdrawalState } from '@/types/enums';
import { ERC721TokenState } from '@/types/TERC721';
import { CustomEventLog, findEvent } from './events';
import { ERC721Token } from '@/models/ERC721Token';
import { logger } from './logger';
import { AssetPool } from '@/models/AssetPool';
import CreatePoolController from '@/controllers/pools/post.controller';

async function handleEvents(tx: TransactionDocument, events: CustomEventLog[]) {
    const eventDepositted = findEvent('Depositted', events);
    const eventRoleGranted = findEvent('RoleGranted', events);
    const eventWithdrawPollCreated = findEvent('WithdrawPollCreated', events);
    const eventWithdrawPollFinalized = findEvent('WithdrawPollFinalized', events);
    const eventWithdrawn = findEvent('Withdrawn', events);
    const eventERC721Minted = findEvent('ERC721Minted', events);
    const eventPoolDeployed = findEvent('PoolDeployed', events);

    if (eventPoolDeployed) {
        const pool = await AssetPool.findOne({ transactions: String(tx._id) });
        pool.address = eventPoolDeployed.args.pool;
        await pool.save();
        // const tokenAddress = await pool.contract.methods.getERC20().call();
        // await CreatePoolController.initialize(pool, eventPoolDeployed.args.token);
    }

    if (eventERC721Minted) {
        await ERC721Token.updateOne(
            { transactions: String(tx._id) },
            {
                state: ERC721TokenState.Minted,
                tokenId: Number(eventERC721Minted.args.tokenId),
                recipient: eventERC721Minted.args.recipient,
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
        const assetPool = await AssetPool.findOne({ address: tx.to });
        await MemberService.addExistingMember(assetPool, eventRoleGranted.args.account);
    }

    if (eventWithdrawPollCreated) {
        await Withdrawal.updateOne(
            { transactions: String(tx._id) },
            {
                withdrawalId: Number(eventWithdrawPollCreated.args.id),
                poolAddress: tx.to,
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
    logger.error(failReason);

    await tx.updateOne({ failReason });
    await Withdrawal.updateOne({ transactions: String(tx._id) }, { failReason });
    await Deposit.updateOne({ transactions: String(tx._id) }, { failReason });
    await ERC721Token.updateOne({ transactions: String(tx._id) }, { failReason });
}

export { handleEvents, handleError };
