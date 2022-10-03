import { Job } from 'agenda';
import axios from 'axios';
import stream from 'stream';
import path from 'path';
import { AWS_S3_PRIVATE_BUCKET_NAME, DASHBOARD_URL, WALLET_URL } from '@/config/secrets';
import AccountProxy from '@/proxies/AccountProxy';
import AssetPoolService from '@/services/AssetPoolService';
import BrandService from '@/services/BrandService';
import ClaimService from '@/services/ClaimService';
import ImageService from '@/services/ImageService';
import MailService from '@/services/MailService';
import { ClaimDocument } from '@/types/TClaim';
import { logger } from '@/util/logger';
import { s3PrivateClient } from '@/util/s3';
import { createArchiver } from '@/util/zip';
import { Upload } from '@aws-sdk/lib-storage';
import { Reward, RewardDocument } from '@/models/Reward';

export const generateMetadataRewardQRCodesJob = async ({ attrs }: Job) => {
    if (!attrs.data) return;

    try {
        const { poolId, sub, fileName, notify } = attrs.data;

        const pool = await AssetPoolService.getById(poolId);
        if (!pool) throw new Error('Reward not found');

        const rewards = await Reward.find({ poolId, erc721metadataId: { $ne: null } });
        if (!rewards.length) throw new Error('Rewards not found');

        const account = await AccountProxy.getById(sub);
        if (!account) throw new Error('Account not found');
        if (!account.email) throw new Error('E-mail address for account not set');

        // Create an instance of jsZip and build an archive
        const { jsZip, archive } = createArchiver();
        await Promise.all(
            rewards.map(async (reward: RewardDocument) => {
                const claims = await ClaimService.findByReward(reward);
                if (!claims.length) throw new Error('Claims not found');

                const brand = await BrandService.get(poolId);
                let logo = path.resolve(__dirname, '../public/qr-logo.jpg');
                if (brand && brand.logoImgUrl) {
                    try {
                        const response = await axios.get(brand.logoImgUrl, { responseType: 'arraybuffer' });
                        logo = Buffer.from(response.data, 'utf-8').toString();
                    } catch {
                        // Fail silently and fallback to default logo img
                    }
                }

                // Create QR code for every claim
                await Promise.all(
                    claims.map(async ({ id }: ClaimDocument) => {
                        const base64Data: string = await ImageService.createQRCode(`${WALLET_URL}/claim/${id}`, logo);
                        // Adds file to the qrcode archive
                        return archive.file(`${id}.png`, base64Data, { base64: true });
                    }),
                );
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

        if (notify) {
            await MailService.send(
                account.email,
                'Your QR codes are ready!',
                `Visit THX Dashboard to download your your QR codes archive. Visit this URL in your browser:
                <br/>${`${DASHBOARD_URL}/pool/${poolId}`}`,
            );
        }
    } catch (error) {
        logger.error(error);
    }
};
