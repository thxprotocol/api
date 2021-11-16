import { param } from 'express-validator';

export const validations = {
    getMembership: [param('id').exists()],
    deleteMembership: [param('id').exists()],
};
