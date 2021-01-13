import express from "express";
import { validate } from "../../util/validation";
import { validations } from "./_.validation";

import { postSignup } from "./postSignup.action";
import { postForgot } from "./postForgot.action";
import { postReset } from "./postReset.action";

const router = express.Router();

router.post("/signup", validate(validations.postSignup), postSignup);
router.post("/forgot", validate(validations.postForgot), postForgot);
router.post("/reset/:token", validate(validations.postReset), postReset);

export default router;
