import express from "express";
import { validate } from "../../util/validation";
import { validations } from "./_.validation";

import { getReward } from "./get.action";
import { postReward } from "./post.action";
import { patchReward } from "./patch.action";
import { postRewardClaim } from "./postRewardClaim.action";
import { postRewardClaimFor } from "./postRewardClaimFor.action";
import { parseHeader } from "../../util/network";

const router = express.Router();

router.get("/:id", validate(validations.getReward), parseHeader, getReward);
router.post("/", validate(validations.postReward), parseHeader, postReward);
router.patch("/:id", validate(validations.patchReward), parseHeader, patchReward);
router.post("/:id/claim", validate(validations.postRewardClaim), parseHeader, postRewardClaim);
router.post("/:id/give", validate(validations.postRewardClaimFor), parseHeader, postRewardClaimFor);

export default router;
