import express from "express";
import { validate } from "../../util/validation";
import { validations } from "./_.validation";
import { getMember } from "./get.action";
import { postMember } from "./post.action";
import { patchMember } from "./patch.action";
import { deleteMember } from "./delete.action";
import checkScopes from "express-jwt-authz";
import { parseHeader } from "../../util/network";

const router = express.Router();

router.post("/", checkScopes(["admin"]), validate(validations.postMember), parseHeader, postMember);
router.patch("/:address", checkScopes(["admin"]), validate(validations.patchMember), parseHeader, patchMember);
router.delete("/:address", checkScopes(["admin"]), validate(validations.deleteMember), parseHeader, deleteMember);
router.get("/:address", checkScopes(["admin", "user"]), validate(validations.getMember), parseHeader, getMember);

export default router;
