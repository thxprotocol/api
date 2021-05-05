import { body, param } from 'express-validator';

export const validations = {
    getClient: [param('rat').exists()],
    deleteClient: [param('rat').exists()],
    postClient: [body('title').exists()],
};
