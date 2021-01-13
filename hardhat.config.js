require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
require('hardhat-jest-plugin');
require('@nomiclabs/hardhat-ethers');

module.exports = {
    networks: {
        default: {
            url: process.env.PUBLIC_RPC,
            accounts: [process.env.PRIVATE_KEY],
            gas: 6e6,
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
