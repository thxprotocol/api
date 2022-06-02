import express from 'express';
import checkScopes from 'express-jwt-authz';
import { assertRequestInput } from '@/middlewares';
import ReadERC20 from './get.controller';
import ListERC20 from './list.controller';
import CreateERC20 from './post.controller';
import DeleteERC20 from './delete.controller';
import { dashboardScopes, userDashboardScopes } from '../scopes';

const router = express.Router();

router.get('/', ListERC20.controller);
router.get('/:id', checkScopes(userDashboardScopes), assertRequestInput(ReadERC20.validation), ReadERC20.controller);
router.post('/', checkScopes(dashboardScopes), assertRequestInput(CreateERC20.validation), CreateERC20.controller);
router.delete('/:id', checkScopes(dashboardScopes), assertRequestInput(DeleteERC20.validation), DeleteERC20.controller);

export default router;
