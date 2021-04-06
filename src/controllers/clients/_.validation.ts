import { body, param } from 'express-validator';

export const validations = {
    getClient: [, param('rat').exists()],
    postClient: [
        body('requestUri')
            .exists()
            .custom((value) => value.startsWith('http')),
        body('title').exists(),
    ],
};
