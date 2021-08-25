import { NextFunction, Response } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import MemberService from '../../services/MemberService';

export const getMembers = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { members, error } = await MemberService.getByPoolAddress(req.assetPool);

        if (error) throw new Error(error);

        res.json(members);
    } catch (error) {
        return next(new HttpError(502, error.toString(), error));
    }
};

/**
 * @swagger
 * /members:
 *   get:
 *     tags:
 *       - Members
 *     description: Provides a list of all members in the pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *        '200':
 *          description: OK
 *          schema:
 *            type: array
 *            items:
 *              type: string
 *              description: The address of the member
 *        '400':
 *           description: Bad Request. Indicates incorrect body parameters.
 *        '401':
 *           description: Unauthorized. Authenticate your request please.
 *        '403':
 *           description: Forbidden. Your account does not have access to this pool.
 *        '404':
 *           description: Not Found. Address is not a member.
 *        '500':
 *           description: Internal Server Error.
 *        '502':
 *           description: Bad Gateway. Received an invalid response from the network or database.
 */
