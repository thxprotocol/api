require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-web3');

module.exports = {
    defaultNetwork: 'default',
    networks: {
        default: {
            url: process.env.RPC,
            accounts: [process.env.PRIVATE_KEY],
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
