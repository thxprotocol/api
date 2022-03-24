import { body, param } from 'express-validator';

const validation = {
    getERC20Token: [param('id').exists().isString()],
    postERC20Token: [
        body('name').exists().isString(),
        body('symbol').exists().isString(),
        body('network').exists().isNumeric(),
        body('totalSupply').exists().isString(),
    ],
};

export default validation;
