// Should routing get,post,patch and delete be handled in the controllers?
// Seen it in some examples, but it doesnt feel like the controllers
// responsibility imo
import express from 'express';
import checkScopes from 'express-jwt-authz';
import { CreatePromoCodeController } from './post.controller';
import { parseHeader } from '../../util/network';

const router = express.Router();
const postController = new CreatePromoCodeController();

router.post(
    '/',
    checkScopes(['admin']),
    postController.validateHeader,
    postController.validate,
    parseHeader,
    postController.exec,
);

export default router;
