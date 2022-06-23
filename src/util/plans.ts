import { IAccount } from '@/models/Account';
import AccountProxy from '@/proxies/AccountProxy';
import { AccountPlanType, ChainId } from '@/types/enums';

const checkAndUpgradeToBasicPlan = async (account: IAccount, chainId: ChainId) => {
    if (account.plan === AccountPlanType.Free && chainId === ChainId.Polygon) {
        await AccountProxy.update(account.id, { plan: AccountPlanType.Basic });
    }
};

export { checkAndUpgradeToBasicPlan };
