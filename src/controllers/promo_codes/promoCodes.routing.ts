// Should routing get,post,patch and delete be handled in the controllers?
// Seen it in some examples, but it doesnt feel like the controllers
// responsibility imo
import express from 'express';
import checkScopes from 'express-jwt-authz';
import CreatePromoCodeController from './post.controller';

const router = express.Router();
const postController = new CreatePromoCodeController();

router.post(
    '/',
    // Will start with the introduction of new scope definitions
    // This will deprecate the 'admin' scope and introduce service
    // specific read/write alternatives.
    checkScopes(['admin', 'promo_codes:write', 'promo_codes:read']),
    postController.validateHeader,
    postController.validate,
    postController.parseHeader,
    postController.exec,
);

export default router;
