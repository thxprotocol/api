import MemberService from '@/services/MemberService';
import MembershipService from '@/services/MembershipService';
import AccountProxy from '@/proxies/AccountProxy';
import { Request, Response } from 'express';
import { VERSION } from '@/config/secrets';
import { AlreadyAMemberError } from '@/util/errors';

export async function postMember(req: Request, res: Response) {
    const account = await AccountProxy.getByAddress(req.body.address);
    const isMember = await MemberService.isMember(req.assetPool, account.address);
    if (isMember) throw new AlreadyAMemberError(account.address, req.assetPool.address);

    await MemberService.addMember(req.assetPool, req.body.address);
    await MembershipService.addMembership(account.id, req.assetPool);

    res.redirect(`/${VERSION}/members/${account.address}`);
}

/**
 * @swagger
 * /members:
 *   post:
 *     tags:
 *       - Members
 *     description: Adds a membership to the asset pool and updates the account with the address.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: AssetPool
 *         in: header
 *         required: true
 *         type: string
 *       - name: address
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '302':
 *         description: Redirect. GET /members/:address.
 *       '400':
 *         $ref: '#/components/responses/400'
 *       '401':
 *         $ref: '#/components/responses/401'
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         $ref: '#/components/responses/500'
 *       '502':
 *         $ref: '#/components/responses/502'
 */
