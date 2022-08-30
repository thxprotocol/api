import ArweaveService from '@/services/ArweaveService';
import { Request, Response } from 'express';

export default {
    controller: async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) return res.status(440).send('There no file to process');
        const response = await ArweaveService.upload(file);
        const publicUrl = ArweaveService.generateUrl(response.id);
        res.send({ publicUrl });
    },
};
