import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '@/util/validation';
import { validations } from './_.validation';
import { getWidget } from './get.controller';
import { getWidgets } from './list.controller';
import { postWidget } from './post.controller';
import { deleteWidget } from './delete.controller';
import { validateClientAccess } from './utils/validateAccess';

const router = express.Router();

router.get('/', checkScopes(['dashboard']), validate(validations.getWidgets), getWidgets);
router.get('/:clientId', checkScopes(['dashboard']), validate(validations.getWidget), validateClientAccess, getWidget);
router.post('/', checkScopes(['dashboard']), validate(validations.postWidget), postWidget);
router.delete(
    '/:clientId',
    checkScopes(['dashboard']),
    validate(validations.deleteWidget),
    validateClientAccess,
    deleteWidget,
);

export default router;
