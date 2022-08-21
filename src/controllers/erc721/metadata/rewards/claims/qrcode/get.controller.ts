import { Request, Response } from 'express';
import { SubjectUnauthorizedError } from '@/util/errors';
import { agenda, EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL } from '@/util/agenda';
import { AWS_S3_PRIVATE_BUCKET_NAME } from '@/config/secrets';
import { s3PrivateClient } from '@/util/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { logger } from '@/util/logger';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721 Metadata']
    if (req.auth.sub !== req.assetPool.sub) throw new SubjectUnauthorizedError();

    const fileName = `${req.assetPool._id}.zip`;
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
            const poolId = String(req.assetPool._id);
            const sub = req.assetPool.sub;
            const equalJobs = await agenda.jobs({
                name: EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL,
                data: { poolId, sub, fileName },
            });

            if (!equalJobs.length) {
                agenda.now(EVENT_SEND_DOWNLOAD_METADATA_QR_EMAIL, {
                    poolId,
                    sub,
                    fileName,
                });
            }
            res.status(201).end();
        } else {
            logger.error(err);
            throw err;
        }
    }
};

export default { controller };
