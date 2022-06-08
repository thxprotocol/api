import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import { validateClientAccess } from './utils/validateAccess';
import CreateWidget from './post.controller';
import ReadWidget from './get.controller';
import DeleteWidget from './delete.controller';
import ListWidgets from './list.controller';

const router = express.Router();

router.get('/', checkScopes(['widgets:read']), assertRequestInput(ListWidgets.validation), ListWidgets.controller);
router.get(
    '/:clientId',
    checkScopes(['widgets:read']),
    assertRequestInput(ReadWidget.validation),
    validateClientAccess,
    ReadWidget.controller,
);
router.post(
    '/',
    checkScopes(['widgets:write', 'widgets:read']),
    assertRequestInput(CreateWidget.validation),
    CreateWidget.controller,
);
router.delete(
    '/:clientId',
    checkScopes(['widgets:write']),
    assertRequestInput(DeleteWidget.validation),
    validateClientAccess,
    DeleteWidget.controller,
);

export default router;
