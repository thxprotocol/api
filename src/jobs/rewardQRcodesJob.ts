import RewardService from '@/services/RewardService';
import { Claim } from '@/models/Claim';
import { DASHBOARD_URL, WALLET_URL } from '@/config/secrets';
import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import JSZip from 'jszip';
import { logger } from '../util/logger';
import MailService from '@/services/MailService';
import AccountProxy from '@/proxies/AccountProxy';
import { Job } from 'agenda';
import AssetPoolService from '@/services/AssetPoolService';

const generateRewardQRCodesJob = async (job: Job) => {
    if (!job.attrs.data) {
        logger.error('Attributes are empty');
        return;
    }
    const { poolId, rewardId, sub, zipPath } = job.attrs.data;

    const assetPool = await AssetPoolService.getById(poolId);
    const reward = await RewardService.get(assetPool, rewardId);

    if (!reward) {
        throw new Error('Reward not found');
    }
    const claims = await Claim.find({
        rewardId: reward.id,
    });

    if (claims.length == 0) {
        logger.info('There are 0 claims for this Reward');
        return;
    }

    // CREATES THE ZIP FOLDER
    var zip = new JSZip();
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

    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(fs.createWriteStream(zipPath));
    const account = await AccountProxy.getById(sub);
    if (!account) {
        throw new Error('Account not found');
    }

    if (!account.email) {
        throw new Error('Account Email not found');
    }

    // SEND THE NOTIFICATION EMAIL TO THE CUSTOMER
    await sendNotificationEmail(account.email, `${DASHBOARD_URL}/rewards/${reward.id}/claims/qrcode`);
    return zipPath;
};

async function generateQRCode(url: string) {
    const logoPath = './assets/qr-logo.jpg';
    const width = 55;
    const center = 58;
    const canvas = createCanvas(width, width);

    QRCode.toCanvas(canvas, url, {
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
    console.log('SENDING THE EMAIL TO:', accountEmail);
    await MailService.send(
        accountEmail,
        `Your QR codes are ready!`,
        `Click on the <a href="https://${dashBoardLink}">Link</a> to download the zip file.`,
    );
}
export { generateRewardQRCodesJob };
