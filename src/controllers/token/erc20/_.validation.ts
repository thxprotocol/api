import { body } from 'express-validator';

const validation = {
    postERC20Token: [
        body('name').exists().isString(),
        body('symbol').exists().isString(),
        body('network').exists().isString(),
        body('totalSupply').exists().isString(),
    ],
};

export default validation;
