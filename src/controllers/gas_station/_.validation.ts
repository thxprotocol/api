import { ethers } from 'ethers';
import { body } from 'express-validator';

export const validations = {
    postCall: [body('call').exists(), body('nonce').exists(), body('sig').exists()],
    postCallUpgradeAddress: [body('call').exists(), body('nonce').exists(), body('sig').exists()],
};
