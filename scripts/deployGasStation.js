const Web3 = require('web3');
const dotenv = require('dotenv');
const GAS_STATION = require('../src/artifacts/GasStation.json');

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

(async () => {
    const web3 = new Web3(process.env.RPC);
    const admin = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    const gasStationContract = new web3.eth.Contract(GAS_STATION.abi);

    web3.eth.accounts.wallet.add(admin);

    const tx = await gasStationContract.deploy({ data: GAS_STATION.bytecode, arguments: [admin.address] }).send({
        from: admin.address,
        gas: 6e6,
    });

    console.log(tx.options.address);
})();
