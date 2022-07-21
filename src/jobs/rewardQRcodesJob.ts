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
import { zip, zipFolder } from '@/util/zip';
import { logger } from '@/util/logger';

export const generateRewardQRCodesJob = async ({ attrs }: Job) => {
    if (!attrs.data) return;

    try {
        const { poolId, rewardId, sub, fileKey } = attrs.data;
        const assetPool = await AssetPoolService.getById(poolId);
        const reward = await RewardService.get(assetPool, rewardId);
        if (!reward) throw new Error('Reward not found');

        const account = await AccountProxy.getById(sub);
        if (!account) throw new Error('Account not found');
        if (!account.email) throw new Error('Account Email not found');

        const claims = await ClaimService.findByReward(reward);
        await Promise.all(
            claims.map(async ({ _id }: ClaimDocument) => {
                const id = String(_id);
                const base64Data: string = await ImageService.createQRCode(`${WALLET_URL}/claims/${id}`);
                return zipFolder.file(`${id}.png`, base64Data, { base64: true });
            }),
        );

        const uploadStream = new stream.PassThrough();
        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(uploadStream);

        const multipartUpload = new Upload({
            client: s3PrivateClient,
            params: {
                Key: fileKey,
                Bucket: AWS_S3_PRIVATE_BUCKET_NAME,
                Body: uploadStream,
            },
        });

        multipartUpload.on('httpUploadProgress', (progress) => {
            console.log(progress);
        });

        await multipartUpload.done();

        const dashboardURL = `${DASHBOARD_URL}/pool/${reward.poolId}/rewards#${String(reward._id)}`;

        await MailService.send(
            account.email,
            'Your QR codes are ready!',
            `<a href="${dashboardURL}">Download the zip file.</a> or visit this URL in your browser<br/><small>${dashboardURL}.</small>`,
        );
    } catch (error) {
        logger.error(error);
    }
};
