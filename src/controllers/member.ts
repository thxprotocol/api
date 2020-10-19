import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, options, tokenContract } from '../util/network';
import '../config/passport';
import { validationResult } from 'express-validator';

/**
 * @swagger
 * /members:
 *   post:
 *     tags:
 *       - members
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
 */
export const postMember = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array()).end();
    }

    try {
        const tx = await assetPoolContract(req.header('AssetPool')).methods.addMember(req.body.address).send(options);
        return res.status(200).send(tx.events.MemberAdded.returnValues.account);
    } catch (err) {
        return res.status(500).send({ msg: 'Member not invited', err });
    }
};

/**
 * @swagger
 * /members:
 *   delete:
 *     tags:
 *       - members
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
 *       200:
 *         description: OK
 */
export const deleteMember = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array()).end();
    }

    try {
        const tx = await assetPoolContract(req.header('AssetPool'))
            .methods.removeMember(req.params.address)
            .send(options);
        return res.status(200).send(tx.events.MemberRemoved.returnValues.account);
    } catch (err) {
        return res.status(500).send({ msg: 'Member not removed', err });
    }
};

/**
 * @swagger
 * /members/:address:
 *   get:
 *     tags:
 *       - members
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
 */
export const getMember = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).send(errors.array()).end();
    }

    try {
        const assetPoolInstance = assetPoolContract(req.header('AssetPool'));
        const isMember = await assetPoolInstance.methods.isMember(req.params.address).call(options);
        const isManager = await assetPoolInstance.methods.isManager(req.params.address).call(options);
        const tokenAddress = await assetPoolInstance.methods.token().call(options);
        const tokenInstance = tokenContract(tokenAddress);
        const balance = await tokenInstance.methods.balanceOf(req.params.address).call(options);
        const name = await tokenInstance.methods.name().call(options);
        const symbol = await tokenInstance.methods.symbol().call(options);

        return res.status(200).send({
            isMember,
            isManager,
            token: {
                name,
                symbol,
                balance,
            },
        });
    } catch (err) {
        return res.status(500).send({ msg: 'Check failed', err });
    }
};
