import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { AUTH_URL, ISSUER } from '../../src/util/secrets';

export const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${AUTH_URL}/jwks`,
    }),
    issuer: ISSUER,
    algorithms: ['RS256'],
});
