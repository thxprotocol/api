import { body, param, query } from 'express-validator';

export const validations = {
    getWidget: [param('clientId').exists()],
    getWidgets: [query('asset_pool').optional().isString()],
    postWidget: [body('requestUris').exists(), body('postLogoutRedirectUris').exists(), body('metadata').exists()],
    deleteWidget: [param('clientId').exists()],
};
