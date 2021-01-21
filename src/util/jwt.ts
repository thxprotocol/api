import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { ISSUER } from '../util/secrets';

export const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${ISSUER}/jwks`,
    }),
    issuer: ISSUER,
    algorithms: ['RS256'],
});
