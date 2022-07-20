import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { param } from 'express-validator';
import { NotFoundError, SubjectUnauthorizedError } from '@/util/errors';
import { agenda, EVENT_SEND_DOWNLOAD_QR_EMAIL } from '@/util/agenda';
import { AWS_S3_PRIVATE_BUCKET_NAME } from '@/config/secrets';
import { s3PrivateClient } from '@/util/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const validation = [param('id').exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    if (req.auth.sub !== req.assetPool.sub) throw new SubjectUnauthorizedError();

    const reward = await RewardService.get(req.assetPool, req.params.id);
    if (!reward) throw new NotFoundError();

    const fileKey = `${reward._id}.zip`;
    try {
        const command = new GetObjectCommand({
            Bucket: AWS_S3_PRIVATE_BUCKET_NAME,
            Key: fileKey,
        });
        const response = await s3PrivateClient.send(command);
        const body = response.Body as Readable;

        res.attachment(fileKey).setHeader('Content-type', 'application/zip');

        body.pipe(res);
    } catch (err) {
        if (err.$metadata && err.$metadata.httpStatusCode == 404) {
            await agenda.now(EVENT_SEND_DOWNLOAD_QR_EMAIL, {
                poolId: String(req.assetPool._id),
                rewardId: reward.id,
                sub: req.assetPool.sub,
                fileKey,
            });
            res.status(201).json({});
        } else {
            throw err;
        }
    }
};

export default { controller, validation };
