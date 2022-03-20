import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpecification } from '@/config/openapi';

const router = express.Router();

router.use('/', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

export default router;
