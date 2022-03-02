import { Request, Response } from 'express';
import { CIRCULATING_SUPPLY } from '@/config/secrets';

export async function getCirculatingSupply(req: Request, res: Response) {
    res.header('Content-Type', 'text/plain').send(CIRCULATING_SUPPLY);
}
