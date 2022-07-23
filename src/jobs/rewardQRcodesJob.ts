import RewardService from '@/services/RewardService';
import { Job } from 'agenda';
import { AWS_S3_PRIVATE_BUCKET_NAME, DASHBOARD_URL, WALLET_URL } from '@/config/secrets';
import MailService from '@/services/MailService';
import AccountProxy from '@/proxies/AccountProxy';
import AssetPoolService from '@/services/AssetPoolService';
import ClaimService from '@/services/ClaimService';
import stream from 'stream';
import ImageService from '@/services/ImageService';
import { s3PrivateClient } from '@/util/s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ClaimDocument } from '@/types/TClaim';
import { createArchiver } from '@/util/zip';
import { logger } from '@/util/logger';

export const generateRewardQRCodesJob = async ({ attrs }: Job) => {
    if (!attrs.data) return;

    try {
        const { poolId, rewardId, sub, fileName } = attrs.data;

        const pool = await AssetPoolService.getById(poolId);
        if (!pool) throw new Error('Reward not found');

        const reward = await RewardService.get(pool, rewardId);
        if (!reward) throw new Error('Reward not found');

        const account = await AccountProxy.getById(sub);
        if (!account) throw new Error('Account not found');
        if (!account.email) throw new Error('E-mail address for account not set');

        const claims = await ClaimService.findByReward(reward);
        if (!claims.length) throw new Error('Claims not found');

        const { jsZip, archive } = createArchiver();

        // Create QR code for every claim
        await Promise.all(
            claims.map(async ({ _id }: ClaimDocument) => {
                const id = String(_id);
                const base64Data: string = await ImageService.createQRCode(`${WALLET_URL}/claims/${id}`);
                // Adds file to the qrcode archive
                return archive.file(`${id}.png`, base64Data, { base64: true });
            }),
        );

        const uploadStream = new stream.PassThrough();
        jsZip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(uploadStream);

        const multipartUpload = new Upload({
            client: s3PrivateClient,
            params: {
                Key: fileName,
                Bucket: AWS_S3_PRIVATE_BUCKET_NAME,
                Body: uploadStream,
            },
        });

        await multipartUpload.done();

        await MailService.send(
            account.email,
            'Your QR codes are ready!',
            `Visit THX Dashboard to download your your QR codes archive. Visit this URL in your browser:
            <br/>${`${DASHBOARD_URL}/pool/${reward.poolId}/rewards`}`,
        );
    } catch (error) {
        logger.error(error);
    }
};
