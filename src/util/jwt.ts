import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { AUTH_URL } from '../../src/util/secrets';

export const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${AUTH_URL}/jwks`,
    }),
    issuer: AUTH_URL,
    algorithms: ['RS256'],
});
