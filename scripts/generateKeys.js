const fs = require('fs');
const path = require('path');
const jose = require('jose');
const keystore = new jose.JWKS.KeyStore();

Promise.all([
    keystore.generate('RSA', 2048, { use: 'sig', alg: 'RS256' }),
    keystore.generate('RSA', 2048, { use: 'enc', alg: 'RS256' }),
    // keystore.generate('EC', 'P-256', { use: 'sig' }),
    // keystore.generate('EC', 'P-256', { use: 'enc' }),
    // keystore.generate('OKP', 'Ed25519', { use: 'sig' }),
]).then(() => {
    fs.writeFileSync(path.resolve('src/jwks.json'), JSON.stringify(keystore.toJWKS(true), null, 2));
});
