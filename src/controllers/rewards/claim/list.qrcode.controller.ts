import { Request, Response } from 'express';
import RewardService from '@/services/RewardService';
import { Claim } from '@/models/Claim';
import { param } from 'express-validator';
import { NotFoundError } from '@/util/errors';
import { WALLET_URL } from '@/config/secrets';
import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import JSZip from 'jszip';

const validation = [param('id').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards']
    const reward = await RewardService.get(req.assetPool, Number(req.params.id));
    if (!reward) throw new NotFoundError();
    const claims = await Claim.find({
        rewardId: reward.id,
    });

    if (claims.length == 0) {
        return;
    }

    var zip = new JSZip();
    const imgFolder = zip.folder('images');

    const promises = [];

    for (let i = 0; i < claims.length; i++) {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const claimId = String(claims[i]._id);
                const claimURL = `${WALLET_URL}/claims/${claimId}`;
                const qrCode = await generateQRCode(claimURL);
                const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
                // write the image file
                //await fs.writeFile(path.resolve(`images/${claimId}.png`), base64Data, 'base64');
                imgFolder.file(`${i + 1}.png`, base64Data, { base64: true });
                console.log(claimId);
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
        promises.push(promise);
    }
    await Promise.all(promises);
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        .pipe(fs.createWriteStream('qrcodes.zip'))
        .on('finish', function () {
            console.log('out.zip written.');
        });
    res.status(200).json({});
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

export default { controller, validation };
