import express from "express";
import { validate } from "../../util/validation";
import { validations } from "./_.validation";
import { getPoll } from "./get.action";
import { postVote } from "./postVote.action";
import { deleteVote } from "./deleteVote.action";
import { postPollFinalize } from "./postPollFinalize.action";
import { parseHeader } from "../../util/network";

const router = express.Router();

router.get("/:id", validate(validations.getPoll), parseHeader, getPoll);
router.post("/:id/vote", validate(validations.postVote), parseHeader, postVote);
router.delete("/:id/vote", validate(validations.deleteVote), parseHeader, deleteVote);
router.post("/:id/finalize", validate(validations.postPollFinalize), parseHeader, postPollFinalize);

export default router;
