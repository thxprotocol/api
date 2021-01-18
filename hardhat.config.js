require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
require('@nomiclabs/hardhat-ethers');

const pkey = process.env.PRIVATE_KEY || '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709';
const url = process.env.PUBLIC_RPC || 'http://localhost:8545';

module.exports = {
    networks: {
        default: {
            url,
            accounts: [pkey],
            gas: 6e6,
        },
        hardhat: {
            accounts: [
                {
                    privateKey: pkey,
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
