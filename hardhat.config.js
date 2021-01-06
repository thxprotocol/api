require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-web3');

const dotenv = require('dotenv');

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

module.exports = {
    defaultNetwork: 'mumbai',
    networks: {
        mumbai: {
            url: 'https://rpc-mumbai.matic.today',
            accounts: [process.env.PRIVATE_KEY],
        },
    },
    paths: {
        sources: './contracts/contracts',
        tests: './contracts/test',
        cache: './contracts/cache',
        artifacts: './src/artifacts',
    },
    solidity: '0.7.4',
};
