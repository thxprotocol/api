import { Request, Response } from 'express';
import { body } from 'express-validator';
import { toWei } from 'web3-utils';
import TransactionService from '@/services/TransactionService';
import MailService from '@/services/MailService';
import AccountProxy from '@/proxies/AccountProxy';
import ERC20Service from '@/services/ERC20Service';
import { getContractFromName } from '@/config/contracts';
import { ForbiddenError } from '@/util/errors';
import { MaxUint256 } from '@/util/jest/constants';
import { SENDGRID_API_KEY } from '@/config/secrets';
import { ChainId } from '@/types/enums';

const validation = [body('amount').optional().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Deposits']
    const account = await AccountProxy.getById(req.auth.sub);
    const amount = req.body.amount ? toWei(String(req.body.amount)) : MaxUint256;
    const erc20 = await ERC20Service.findByPool(req.assetPool);
    const contract = getContractFromName(req.assetPool.chainId, 'LimitedSupplyToken', erc20.address);

    // Check allowance for admin to ensure throughput
    const allowance = await contract.methods.allowance(account.address, req.assetPool.address).call();
    if (Number(allowance) >= Number(amount)) throw new ForbiddenError('Already approved for this amount');

    const { receipt } = await TransactionService.sendValue(account.address, toWei('0.01'), req.assetPool.chainId);

    if (req.assetPool.chainId !== ChainId.Hardhat && SENDGRID_API_KEY) {
        await MailService.send(
            'peter@thx.network',
            `0.01 MATIC -> ${account.address}`,
            `${account.address} has requested a topup for 0.01 MATIC to interact with pool ${
                req.assetPool.address
            } and ERC20 contract ${erc20.address}. 
            <a href="https://${req.assetPool.chainId === ChainId.PolygonMumbai ? 'mumbai.' : ''}polygonscan.com/tx/${
                receipt.transactionHash
            }">
                Transaction
            </a>`,
        );
    }

    res.end();
};

export default { controller, validation };
