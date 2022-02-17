import { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/models/Error';
import WidgetService from '@/services/WidgetService';

const ERROR_WIDGET_FETCH_DATEBASE = 'Could not fetch widgets from database';

export const getWidgets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { result, error } = await WidgetService.getForUserByPool(req.user.sub, req.query.asset_pool.toString());

        if (error) throw new Error(ERROR_WIDGET_FETCH_DATEBASE);

        res.json(result);
    } catch (e) {
        next(new HttpError(500, 'Could not return client information.', e));
    }
};

/**
 * @swagger
 * /widgets:
 *   get:
 *     tags:
 *       - Widgets
 *     description: Gets all widget records.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: asset_pool
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *         content: application/json
 *         schema:
 *               type: array
 *               items:
 *                 type: string
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this widget information.
 *       '404':
 *         description: Not Found. Widget information not found.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
