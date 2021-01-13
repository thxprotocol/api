import { body, param } from "express-validator";
import { ethers } from "ethers";
import { validateAssetPoolHeader } from "../../util/validation";

export const validations = {
    getPoll: [validateAssetPoolHeader, param("id").exists().isNumeric()],
    postVote: [validateAssetPoolHeader, body("agree").exists()],
    deleteVote: [validateAssetPoolHeader, param("address").exists()],
    postPollFinalize: [validateAssetPoolHeader],
};
