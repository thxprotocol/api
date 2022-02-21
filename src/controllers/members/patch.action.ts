import { Request, Response } from 'express';
import { callFunction, sendTransaction } from '@/util/network';
import { VERSION } from '@/util/secrets';
import { NotFoundError } from '@/util/errors';

/**
 * @swagger
 * /members/:address:
 *   patch:
 *     tags:
 *       - Members
 *     description: Get information about a member in the asset pool
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
 *       '200':
 *         description: OK
 *       '302':
 *         description: Redirect. GET /members/:address
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
export const patchMember = async (req: Request, res: Response) => {
    const isMember = await callFunction(
        req.assetPool.solution.methods.isMember(req.params.address),
        req.assetPool.network,
    );

    if (!isMember) {
        throw new NotFoundError();
    }

    await sendTransaction(
        req.assetPool.address,
        req.assetPool.solution.methods[req.body.isManager ? 'addManager' : 'removeManager'](req.params.address),
        req.assetPool.network,
    );

    res.redirect(`/${VERSION}/members/${req.params.address}`);
};
