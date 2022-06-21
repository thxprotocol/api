import { AssetPool } from '@/models/AssetPool';
import MailService from '@/services/MailService';
import { logger } from '@/util/logger';

const map = (year: number, month: number, date: number) => {
    return AssetPool.find({
        lastTransactionAt: {
            $gte: new Date(year, month, date).toISOString(),
            $lte: new Date(year, month + 1, date).toISOString(),
        },
    }).count();
};

async function jobSendKPI() {
    try {
        const now = new Date();
        const [year, month, date] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
        const html = `<p>Monthly Active Pools: <strong>${await map(year, month, date)}</strong></p>`;

        await MailService.send('peter@thx.network', `THX KPI [${year}/${month}]`, html);

        logger.info('KPI email has been sent.');
    } catch (error) {
        logger.error(error);
    }
}

export { jobSendKPI };
