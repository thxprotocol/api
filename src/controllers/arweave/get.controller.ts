import ArweaveService from '@/services/ArweaveService';
import { Request, Response } from 'express';

export default {
    controller: async (req: Request, res: Response) => {
        const id = req.params['id'];
        if (!id) return res.status(440).send('There no ID to process');
        const response = await ArweaveService.getData(id);
        res.status(200)
            .contentType(response.info.tags[0].get('value', { decode: true, string: true }))
            .send(response.data);
    },
};
