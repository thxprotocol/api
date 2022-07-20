import RewardService from '@/services/RewardService';
import { AWS_S3_PRIVATE_BUCKET_NAME, DASHBOARD_URL, WALLET_URL } from '@/config/secrets';
import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import JSZip from 'jszip';
import { logger } from '../util/logger';
import MailService from '@/services/MailService';
import AccountProxy from '@/proxies/AccountProxy';
import { Job } from 'agenda';
import AssetPoolService from '@/services/AssetPoolService';
import ClaimService from '@/services/ClaimService';
import stream from 'stream';
import { s3PrivateClient } from '@/util/s3';
import { Upload } from '@aws-sdk/lib-storage';

const generateRewardQRCodesJob = async (job: Job) => {
    if (!job.attrs.data) return;

    const { poolId, rewardId, sub, fileKey } = job.attrs.data;
    const assetPool = await AssetPoolService.getById(poolId);
    const reward = await RewardService.get(assetPool, rewardId);

    if (!reward) {
        throw new Error('Reward not found');
    }

    const account = await AccountProxy.getById(sub);
    if (!account) {
        throw new Error('Account not found');
    }

    if (!account.email) {
        throw new Error('Account Email not found');
    }

    const claims = await ClaimService.findByReward(reward);

    if (claims.length == 0) {
        logger.info('There are 0 claims for this Reward');
        return;
    }

    // CREATES THE ZIP FOLDER

    const zip = new JSZip();
    const imgFolder = zip.folder('qrcodes');

    const promises = [];

    // GENERATE THE QRCODES

    for (let i = 0; i < claims.length; i++) {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const claimId = String(claims[i]._id);
                const claimURL = `${WALLET_URL}/claims/${claimId}`;
                const qrCode = await generateQRCode(claimURL);
                const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
                // ADD FILE TO THE FOLDER
                imgFolder.file(`${i + 1}.png`, base64Data, { base64: true });
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
        promises.push(promise);
    }
    await Promise.all(promises);
    console.log('ZIP CREATED. ----------------------------');

    const uploadStream = new stream.PassThrough();
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(uploadStream);
    console.log('PIPE ZIP ----------------------------');
    // UPLOAD FILE TO S3 BUCKET
    const uploadParams = {
        Key: fileKey,
        Bucket: AWS_S3_PRIVATE_BUCKET_NAME,
        ACL: 'public-read',
        Body: uploadStream,
        Endpoint: 'local-thx-private-storage-bucket.s3.eu-west-2.amazonaws.com',
    };
    console.log('uploadParams ----------------------------------', uploadParams);
    const filePath = `s3://${uploadParams.Bucket}/${uploadParams.Key}`;
    try {
        const multipartUpload = new Upload({
            client: s3PrivateClient,
            params: uploadParams,
        });

        console.log('START TO UPLOAD TO S3 ----------------------------');
        multipartUpload.on('httpUploadProgress', (progress) => {
            console.log(progress);
        });
        await multipartUpload.done();

        console.log('Uploaded file to S3!', filePath);
    } catch (err) {
        console.log('ERROR ON UPLOAD TO AWS', err);
        throw err;
    }

    // SEND THE NOTIFICATION EMAIL TO THE CUSTOMER
    await sendNotificationEmail(account.email, `${DASHBOARD_URL}/pool/${reward.poolId}/rewards#${String(reward._id)}`);
    return filePath;
};

async function generateQRCode(url: string) {
    const logoPath = './assets/qr-logo.jpg';
    const width = 55;
    const center = 58;
    const canvas = createCanvas(width, width);

    await QRCode.toCanvas(canvas, url, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
    });

    const ctx = canvas.getContext('2d');
    const img = await loadImage(logoPath);
    ctx.drawImage(img, center, center, width, width);
    return canvas.toDataURL('image/png');
}

async function sendNotificationEmail(accountEmail: string, dashBoardLink: string) {
    console.log('SENDING THE EMAIL TO:', accountEmail, dashBoardLink);
    await MailService.send(
        accountEmail,
        `Your QR codes are ready!`,
        `Click on the <a href="${dashBoardLink}">Link ${dashBoardLink}</a> to download the zip file.`,
    );
}
export { generateRewardQRCodesJob };
