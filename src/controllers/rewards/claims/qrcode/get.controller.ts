import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { param } from 'express-validator';
import { NotFoundError, SubjectUnauthorizedError } from '@/util/errors';
import { agenda, EVENT_SEND_DOWNLOAD_QR_EMAIL } from '@/util/agenda';
import { AWS_S3_PRIVATE_BUCKET_NAME } from '@/config/secrets';
import { s3PrivateClient } from '@/util/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { logger } from '@/util/logger';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    if (req.auth.sub !== req.assetPool.sub) throw new SubjectUnauthorizedError();

    const reward = await RewardService.get(req.assetPool, req.params.id);
    if (!reward) throw new NotFoundError();

    const fileName = `${reward._id}.zip`;
    try {
        const response = await s3PrivateClient.send(
            new GetObjectCommand({
                Bucket: AWS_S3_PRIVATE_BUCKET_NAME,
                Key: fileName,
            }),
        );
        (response.Body as Readable).pipe(res).attachment(fileName);
    } catch (err) {
        if (err.$metadata && err.$metadata.httpStatusCode == 404) {
            agenda.now(EVENT_SEND_DOWNLOAD_QR_EMAIL, {
                poolId: String(req.assetPool._id),
                rewardId: reward.id,
                sub: req.assetPool.sub,
                fileName,
            });
            res.status(201).end();
        } else {
            logger.error(err);
            throw err;
        }
    }
};

export default { controller, validation };
