const Web3 = require('web3');
const dotenv = require('dotenv');
const TEST_TOKEN = require('../src/artifacts/THXToken.json');

//0x82F1DD84Dd720Db4A62646652Ed93FF73b6d8838

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

(async () => {
    const web3 = new Web3(process.env.RPC);
    const admin = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    const testTokenContract = new web3.eth.Contract(TEST_TOKEN.abi);

    web3.eth.accounts.wallet.add(admin);

    const tx = await testTokenContract
        .deploy({ data: TEST_TOKEN.bytecode, arguments: [admin.address, 100000e10] })
        .send({
            from: admin.address,
            gas: 6e6,
        });

    console.log(tx.options.address);
})();
