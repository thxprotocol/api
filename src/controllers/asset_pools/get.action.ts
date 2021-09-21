import { Response, NextFunction } from 'express';
import { callFunction, tokenContract } from '../../util/network';
import { HttpError, HttpRequest } from '../../models/Error';
import { fromWei } from 'web3-utils';

export const getAssetPool = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const tokenAddress = await callFunction(req.solution.methods.getToken(), req.assetPool.network);
        const tokenInstance = tokenContract(req.assetPool.network, tokenAddress);
        const proposeWithdrawPollDuration = await callFunction(
            req.solution.methods.getProposeWithdrawPollDuration(),
            req.assetPool.network,
        );
        const rewardPollDuration = await callFunction(
            req.solution.methods.getRewardPollDuration(),
            req.assetPool.network,
        );

        res.json({
            sub: req.assetPool.sub,
            rat: req.assetPool.rat,
            address: req.assetPool.address,
            network: req.assetPool.network,
            bypassPolls: req.assetPool.bypassPolls,
            token: {
                address: tokenInstance.options.address,
                name: await callFunction(tokenInstance.methods.name(), req.assetPool.network),
                symbol: await callFunction(tokenInstance.methods.symbol(), req.assetPool.network),
                totalSupply: Number(
                    fromWei(await callFunction(tokenInstance.methods.totalSupply(), req.assetPool.network)),
                ),
                balance: Number(
                    fromWei(
                        await callFunction(tokenInstance.methods.balanceOf(req.params.address), req.assetPool.network),
                    ),
                ),
            },
            proposeWithdrawPollDuration,
            rewardPollDuration,
        });
    } catch (error) {
        return next(new HttpError(500, 'Could not obtain Asset Pool data from the network.', error));
    }
};
