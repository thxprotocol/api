import crypto from 'crypto';
import { Account } from '../models/Account';
import { DASHBOARD_URL } from './secrets';

export function createRandomToken() {
    const buf = crypto.randomBytes(16);
    return buf.toString('hex');
}
