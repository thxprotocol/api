import express from 'express';
import { validate } from '@/util/validation';
import { validations } from './_.validation';

import { getClient } from './getClient.action';
import { postClient } from './post.action';
import { deleteClient } from './delete.action';
import checkScopes from 'express-jwt-authz';
import { validateRegistrationToken } from '@/util/validation';

const router = express.Router();

router.get('/:rat', checkScopes(['dashboard']), validateRegistrationToken, validate(validations.getClient), getClient);
router.post('/', checkScopes(['dashboard']), validate(validations.postClient), postClient);
router.delete(
    '/:rat',
    checkScopes(['dashboard']),
    validateRegistrationToken,
    validate(validations.deleteClient),
    deleteClient,
);

export default router;
