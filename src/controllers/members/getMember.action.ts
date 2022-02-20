import { Request, Response } from 'express';
import MemberService from '@/services/MemberService';
import { NotFoundError } from '@/util/errors';

export const getMember = async (req: Request, res: Response) => {
    const isMember = await MemberService.isMember(req.assetPool, req.params.address);

    if (!isMember) {
        throw new NotFoundError();
    }

    const member = await MemberService.getByAddress(req.assetPool, req.params.address);

    res.json(member);
};

/**
 * @swagger
 * /members/:address:
 *   get:
 *     tags:
 *       - Members
 *     description: Provides information about a membership for the pool.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *         content: application/json           
 *         schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   description: The most recent address known for this member
 *                 isMember:
 *                   type: boolean
 *                   description: If this address is known as member of the asset pool
 *                 isManager:
 *                   type: boolean
 *                   description: If this address is known as manager of the asset pool
 *                 balance:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: The name of the token configured for this asset pool
 *                     symbol:
 *                       type: string
 *                       description: The symbol of the token configured for this asset pool
 *                     amount:
 *                       type: number
 *                       description: The token balance of the asset pool for this token
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Address is not a member.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'

 */
