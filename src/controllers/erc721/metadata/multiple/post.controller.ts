import { s3Client } from '@/util/s3';
import { Request, Response } from 'express';
import { check } from 'express-validator';

const validation = [
    check('compressedFile').custom((value, { req }) => {
        console.log('mimetype -------------------------------', req.file.mimetype);
        switch (req.file.mimetype) {
            case 'application/x-rar-compressed':
            case 'application/octet-stream':
            case 'application/zip':
                console.log('OK');
                return true;
            default:
                return false;
        }
    }),
];

const controller = async (req: Request, res: Response) => {
    // UNZIP THE FILE

    res.status(201).send('Successfully uploaded ' + req.file + ' file!');
};

export default { controller, validation };
