import { NextFunction, Request, Response } from "express";
import { RPC, PRIVATE_KEY, ASSET_POOL_FACTORY_ADDRESS } from "../util/secrets";
import { ethers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import AssetPoolFactoryArtifact from "../artifacts/contracts/contracts/factories/AssetPoolFactory.sol/AssetPoolFactory.json";
import ISolutionArtifact from "../artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json";
import ExampleTokenArtifact from "../artifacts/contracts/contracts/ExampleToken.sol/ExampleToken.json";
import { HttpRequest } from "../models/Error";

export const provider = new ethers.providers.JsonRpcProvider(RPC);
export const admin = new ethers.Wallet(PRIVATE_KEY, provider);
export const assetPoolFactory = new ethers.Contract(ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);

export const solutionContract = (address?: string) => {
    return new ethers.Contract(address, ISolutionArtifact.abi, admin);
};
export const tokenContract = (address?: string) => {
    return new ethers.Contract(address, ExampleTokenArtifact.abi, admin);
};
export function parseHeader(req: Request, res: Response, next: NextFunction) {
    const assetPollAddress = req.header("AssetPool");

    if (assetPollAddress && isAddress(assetPollAddress)) {
        (req as HttpRequest).solution = solutionContract(assetPollAddress);
    }

    return next();
}
