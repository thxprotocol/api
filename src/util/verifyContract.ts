import { POLYGONSCAN_TESTNET_API_KEY, POLYGON_TESTNET_API_ENDPOINT } from '../config/secrets';
import axios from 'axios';
import abi from 'ethereumjs-abi';
//const jsonInput = require('./jsoniput2.json');

async function verifyContract() {
    const url = POLYGON_TESTNET_API_ENDPOINT;
    const contractAddress = '0x09dE4Db75015E8f52C250fc2478Da9F0a5a60FF9';
    //const compiledCode = require('../../node_modules/@thxnetwork/artifacts/dist/exports/bytecodes/LimitedSupplyToken.json');

    const contractname = 'LimitedSupplyToken';
    const compiledVersion = 'v0.7.6+commit.7338295f';
    const sourceCode =
        "// SPDX-License-Identifier: Apache-2.0\n\npragma solidity ^0.7.6;\n\n/******************************************************************************\\\n* @title ERC20 Limited Supply\n* @author Peter Polman <peter@thx.network>\n* @notice Used for point systems with a limited supply. Mints the full supply to the to argument given in the contructor. \n* @dev Not upgradable contract.\n/******************************************************************************/\n\nimport '@openzeppelin/contracts/token/ERC20/ERC20.sol';\n\ncontract LimitedSupplyToken is ERC20 {\n    constructor(\n        string memory _name,\n        string memory _symbol,\n        address to,\n        uint256 amount\n    ) ERC20(_name, _symbol) {\n        _mint(to, amount);\n    }\n}\n";

    const abiencodedArguments = abi
        .rawEncode(
            ['string', 'string', 'address', 'uint256'],
            ['LIMITED TOKEN', 'LIM', '0x4033eBb1Cd52fdDffb023e3172400E3864D7DD8b', 1000000],
        )
        .toString('hex');

    const licenseType = 12; //Apache 2.0 (Apache-2.0)

    const data = {
        apikey: POLYGONSCAN_TESTNET_API_KEY, //A valid API-Key is required
        module: 'contract', //Do not change
        action: 'verifysourcecode', //Do not change
        contractaddress: contractAddress, //Contract Address starts with 0x...
        sourceCode: sourceCode, //Contract Source Code (Flattened if necessary)
        codeformat: 'solidity-single-file', //solidity-single-file (default) or solidity-standard-json-input (for std-input-json-format support
        contractname: contractname, //ContractName (if codeformat=solidity-standard-json-input, then enter contractname as ex: erc20.sol:erc20)
        compilerversion: compiledVersion, // see https://polygonscan.com/solcversions for list of support versions
        optimizationUsed: 0, //0 = No Optimization, 1 = Optimization used (applicable when codeformat=solidity-single-file)
        runs: 200, //set to 200 as default unless otherwise  (applicable when codeformat=solidity-single-file)
        constructorArguements: abiencodedArguments, //if applicable
        licenseType: licenseType,
    };

    const params = new URLSearchParams();

    Object.entries(data).map((x) => {
        params.append(x[0], String(x[1]));
    });

    console.log('START VERIFICATION...');
    const result = await axios({
        url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: params,
    });

    console.log('POST RESULT', result.data);

    if (result.data.status == 1) {
        await checkVerificationStatus(result.data.result);
    }
}

async function checkVerificationStatus(verificationGuid: string) {
    const data = {
        apikey: POLYGONSCAN_TESTNET_API_KEY, //A valid API-Key is required
        guid: verificationGuid,
        module: 'contract',
        action: 'checkverifystatus',
    };

    const params = new URLSearchParams();

    Object.entries(data).map((x) => {
        params.append(x[0], String(x[1]));
    });

    console.log('CHECK VERIFICATION STATUS...');
    const verificationResult = await axios({
        url: POLYGON_TESTNET_API_ENDPOINT,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: params,
    });

    console.log('VERIFICATION RESULT', verificationResult.data);
    return verificationResult.data;
}

verifyContract();
//checkVerificationStatus('hdliafwnfcqsqydtxjbfxibvsbatarfkej4uxuk2xumbznihuy');
