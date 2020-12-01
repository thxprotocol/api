import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../../swagger.json';

const router = express.Router();

router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

export default router;
