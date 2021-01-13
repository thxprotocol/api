import { body, param } from "express-validator";
import { validateAssetPoolHeader } from "../../util/validation";

export const validations = {
    postReward: [
        validateAssetPoolHeader,
        body("title").exists(),
        body("description").exists(),
        body("withdrawAmount").exists(),
        body("withdrawDuration").exists(),
    ],
    getReward: [validateAssetPoolHeader, param("id").exists().isNumeric()],
    patchReward: [validateAssetPoolHeader, param("id").exists().isNumeric()],
    postRewardClaim: [validateAssetPoolHeader, param("id").exists().isNumeric()],
    postRewardClaimFor: [validateAssetPoolHeader, param("id").exists(), body("member").exists()],
};
