import { ARWEAEVE_ENABLED } from '@/config/secrets';
import ArweaveService from '@/services/ArweaveService';
import ImageService from '@/services/ImageService';
import { Request, Response } from 'express';

export default {
    controller: async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) return res.status(440).send('There no file to process');

        // UPLOAD FILE TO ETERNAL STORAGE
        if (ARWEAEVE_ENABLED) {
            const response = await ArweaveService.upload({ buffer: file.buffer, mimetype: file.mimetype });
            const publicUrl = await ArweaveService.generateUrl(response.id);
            res.send({ publicUrl });
        }

        // UPLOAD FILE TO AWS BUCKET
        const response = await ImageService.upload(file);
        const publicUrl = ImageService.getPublicUrl(response.key);
        res.send({ publicUrl });
    },
};
