import dotenv from 'dotenv';
import '@nomiclabs/hardhat-ethers';

const env = process.env.NODE_ENV;

if (env) {
    dotenv.config({ path: `.env.${env === 'test' ? 'example' : env}` });
} else {
    dotenv.config({ path: '.env' });
}

module.exports = {
    networks: {
        default: {
            url: process.env.PUBLIC_RPC,
            accounts: [process.env.PRIVATE_KEY],
            gas: 6e6,
            gasPrice: 1000000000,
        },
        hardhat: {
            accounts: [
                {
                    privateKey: process.env.PRIVATE_KEY,
                    balance: '1000000000000000000000000000000000000000',
                },
            ],
        },
    },
    paths: {
        sources: './contracts/contracts',
        tests: './test',
        cache: './cache',
        artifacts: './src/artifacts',
    },
    solidity: '0.7.4',
};
