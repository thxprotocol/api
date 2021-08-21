import { body, param, query } from 'express-validator';

export const validations = {
    getWidgets: [query('asset_pool').optional().isString()],
    getWidget: [param('rat').exists()],
    postWidget: [body('requestUris').exists(), body('postLogoutRedirectUris').exists()],
};
