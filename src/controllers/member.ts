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
 *     description: Invite a member
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
 *         description: success
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
 *     description: Invite a member
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
 *         description: success
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
 * /members:
 *   get:
 *     tags:
 *       - members
 *     description: Invite a member
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
 *         description: success
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
