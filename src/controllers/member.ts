import { Request, Response, NextFunction } from 'express';
import { assetPoolContract, options, tokenContract } from '../util/network';
import '../config/passport';
import { handleValidation } from '../util/validation';

/**
 * Invite a member
 * @route POST /members
 */
export const postMember = async (req: Request, res: Response) => {
    handleValidation(req, res);

    try {
        const tx = await assetPoolContract(req.header('AssetPool')).methods.addMember(req.body.address).send(options);
        return res.status(200).send(tx.events.MemberAdded.returnValues.account);
    } catch (err) {
        return res.status(500).send({ msg: 'Member not invited', err });
    }
};

/**
 * Remove a member
 * @route DELETE /members/:address
 */
export const deleteMember = async (req: Request, res: Response) => {
    handleValidation(req, res);

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
 * Get a member
 * @route GET /members/:address
 */
export const getMember = async (req: Request, res: Response) => {
    handleValidation(req, res);

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
