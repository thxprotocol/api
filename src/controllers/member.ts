import { Request, Response } from 'express';
import { assetPoolContract, ASSET_POOL, parseLogs, tokenContract } from '../util/network';
import '../config/passport';
import { validationResult } from 'express-validator';
import logger from '../util/logger';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

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
 */
export const postMember = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array()).end();
    }

    try {
        const instance = assetPoolContract(req.header('AssetPool'));
        const tx = await (await instance.addMember(req.body.address)).wait();
        const events = await parseLogs(ASSET_POOL.abi, tx.logs);
        const event = events.filter((e: { name: string }) => e.name === 'RoleGranted')[0];
        const address = event.args.account;

        res.redirect(`members/${address}`);
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
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
 *       200:
 *         description: OK
 */
export const deleteMember = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
    }

    try {
        const instance = assetPoolContract(req.header('AssetPool'));
        const tx = await instance.removeMember(req.params.address);
        res.json(tx.events.MemberRemoved.returnValues.account);
    } catch (err) {
        const error = err.toString();
        logger.error(error);
        res.status(500).json({ msg: 'Member not removed', error });
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
 */
export const getMember = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json(errors.array()).end();
    }

    try {
        const assetPoolInstance = assetPoolContract(req.header('AssetPool'));
        const tokenAddress = await assetPoolInstance.token();
        const tokenInstance = tokenContract(tokenAddress);
        const balance = await tokenInstance.balanceOf(req.params.address);

        res.json({
            isMember: await assetPoolInstance.isMember(req.params.address),
            isManager: await assetPoolInstance.isManager(req.params.address),
            token: {
                name: await tokenInstance.name(),
                symbol: await tokenInstance.symbol(),
                balance,
            },
        });
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({ msg: err.toString() });
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
 *       200:
 *         description: OK
 */
export const patchMember = async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).json(errors.array()).end();
    }

    try {
        const assetPoolInstance = assetPoolContract(req.header('AssetPool'));

        await assetPoolInstance[!req.body.isManager ? 'addManager' : 'removeManager'](req.params.address);

        res.redirect(`members/${req.params.address}`);
    } catch (err) {
        const error = err.toString();
        logger.error(error);
        res.status(500).json({ msg: 'Patch operation failed', error });
    }
};
