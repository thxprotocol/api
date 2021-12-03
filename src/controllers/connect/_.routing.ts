import express from 'express';
import checkScopes from 'express-jwt-authz';
import { validate } from '../../util/validation';
import { validations } from './_.validation';
import { getYoutube } from './getYoutube.action';
import { postYoutube } from './postYoutube.action';
// import { deleteYoutube } from './deleteYoutube.action';

const router = express.Router();

// These endpoints will be deprecated soon.
router.get('/youtube', checkScopes(['dashboard']), getYoutube);
router.post('/youtube', checkScopes(['dashboard']), postYoutube);
// router.delete('/youtube', checkScopes(['dashboard']), deleteYoutube);

export default router;
