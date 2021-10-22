import { body, param, query } from 'express-validator';

export const validations = {
    getWidget: [param('rat').exists()],
    getWidgets: [query('asset_pool').optional().isString()],
    postWidget: [body('requestUris').exists(), body('postLogoutRedirectUris').exists(), body('metadata').exists()],
};
