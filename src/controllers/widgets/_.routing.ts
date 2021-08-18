import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '../../util/validation';
import { validations } from './_.validation';
import { getWidget } from './get.action';
import { getWidgets } from './getAll.action';
import { postWidget } from './post.action';
import { validateClientAccess } from './utils/validateAccess';

const router = express.Router();

router.get('/', checkScopes(['dashboard']), getWidgets);
router.get('/:rat', checkScopes(['dashboard']), validate(validations.getWidget), validateClientAccess, getWidget);
router.post('/', checkScopes(['dashboard']), validate(validations.postWidget), postWidget);

export default router;
