import { NextFunction, Request, Response } from 'express';
import { assetPoolContract, ASSET_POOL, parseLogs, tokenContract } from '../util/network';
import { HttpError } from '../models/Error';
import { VERSION } from '../util/secrets';

/**
 * @swagger
 * /members:
 *   post:
 *     tags:
 *       - Members
 *     description: Add a member to the asset pool
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
 *       200:
 *         description: OK
 *       '302':
 *          description: Redirect to `GET /members/:address`
 *          headers:
 *             Location:
 *                type: string
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const postMember = async (req: Request, res: Response, next: NextFunction) => {
    const instance = assetPoolContract(req.header('AssetPool'));

    if (await instance.isMember(req.body.address)) {
        next(new HttpError(400, 'Address is member already.'));
        return;
    }

    try {
        const tx = await (await instance.addMember(req.body.address)).wait();

        try {
            const events = await parseLogs(ASSET_POOL.abi, tx.logs);
            const event = events.filter((e: { name: string }) => e.name === 'RoleGranted')[0];
            const address = event.args.account;

            res.redirect(`/${VERSION}/members/${address}`);
        } catch (err) {
            next(new HttpError(500, 'Parse logs failed.', err));
            return;
        }
    } catch (err) {
        next(new HttpError(502, 'Asset Pool addMember failed.', err));
    }
};

/**
 * @swagger
 * /members:
 *   delete:
 *     tags:
 *       - Members
 *     description: Remove a member from the asset pool
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
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const instance = assetPoolContract(req.header('AssetPool'));

        await instance.removeMember(req.params.address);

        res.end();
    } catch (err) {
        next(new HttpError(502, 'Asset Pool removeMember failed.', err));
    }
};

/**
 * @swagger
 * /members/:address:
 *   get:
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
 *       200:
 *         description: OK
 *         schema:
 *            type: object
 *            properties:
 *               token:
 *                  type: object
 *                  properties:
 *                     name:
 *                        type: string
 *                        description: The name of the token configured for this asset pool
 *                     symbol:
 *                        type: string
 *                        description: The symbol of the token configured for this asset pool
 *                     balance:
 *                        type: number
 *                        description: The token balance of the asset pool for this token
 *               isMember:
 *                  type: boolean
 *                  description: If this address is known as member of the asset pool
 *               isManager:
 *                  type: boolean
 *                  description: If this address is known as manager of the asset pool
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Address is not a member.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.

 */
export const getMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetPoolInstance = assetPoolContract(req.header('AssetPool'));
        const isMember = await assetPoolInstance.isMember(req.params.address);

        if (!isMember) {
            next(new HttpError(404, 'Address is not a member.'));
            return;
        }

        const tokenAddress = await assetPoolInstance.token();
        const tokenInstance = tokenContract(tokenAddress);
        const balance = await tokenInstance.balanceOf(req.params.address);

        res.json({
            isMember,
            isManager: await assetPoolInstance.isManager(req.params.address),
            token: {
                name: await tokenInstance.name(),
                symbol: await tokenInstance.symbol(),
                balance,
            },
        });
    } catch (err) {
        next(new HttpError(502, 'Asset Pool get member failed.', err));
    }
};

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
 *       '400':
 *         description: Bad Request. Indicates incorrect body parameters.
 *       '401':
 *         description: Unauthorized. Authenticate your request please.
 *       '403':
 *         description: Forbidden. Your account does not have access to this pool.
 *       '404':
 *         description: Not Found. Address is not a member.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
export const patchMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const instance = assetPoolContract(req.header('AssetPool'));
        const isMember = await instance.isMember(req.params.address);

        if (!isMember) {
            next(new HttpError(404, 'Address is not a member.'));
            return;
        }

        await instance[req.body.isManager ? 'addManager' : 'removeManager'](req.params.address);

        res.redirect(`/${VERSION}/members/${req.params.address}`);
    } catch (err) {
        next(new HttpError(502, 'Asset Pool add/remove Manager failed.', err));
    }
};
