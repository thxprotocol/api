import { body, check } from 'express-validator';
import { confirmPassword } from '../../util/validation';
import { isAddress } from 'web3-utils';

export const validations = {};
