import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { param } from 'express-validator';
import { NotFoundError, SubjectUnauthorizedError } from '@/util/errors';
import fs, { constants } from 'fs';
import path from 'path';
import { agenda, EVENT_SEND_DOWNLOAD_QR_EMAIL } from '@/util/agenda';

const validation = [param('id').exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']

    // CHECK SUB
    if (req.auth.sub !== req.assetPool.sub) {
        throw new SubjectUnauthorizedError();
    }
    const reward = await RewardService.get(req.assetPool, req.params.id);
    if (!reward) throw new NotFoundError();

    // CHECK IF THE ZIP FILE IS ALREADY GENERATED
    const zipPath = path.resolve(`download/rewards-qrcodes/${String(reward._id)}.zip`);
    try {
        await fs.promises.access(zipPath, constants.F_OK);
        // RETURN THE FILE
        console.log('RETURNS THE FILE-----------------------------');
        res.setHeader('Content-type', 'application/zip');
        res.sendFile(zipPath);
    } catch (err) {
        // SCHEDULE THE JOB
        console.log('SCHEDULE THE JOB-----------------------------');
        await agenda.now(EVENT_SEND_DOWNLOAD_QR_EMAIL, {
            poolId: String(req.assetPool._id),
            rewardId: reward.id,
            sub: req.assetPool.sub,
            zipPath,
        });
        res.status(200).json({});
    }
};

export default { controller, validation };
