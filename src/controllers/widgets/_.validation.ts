import { body, param } from 'express-validator';

export const validations = {
    getWidget: [param('rat').exists()],
    postWidget: [body('requestUris').exists(), body('postLogoutRedirectUris').exists()],
};
