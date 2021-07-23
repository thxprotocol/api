module.exports = {
    paths: {
        sources: './contracts/contracts',
        tests: './test',
        cache: './cache',
        artifacts: './src/artifacts',
    },
    solidity: {
        version: '0.7.4',
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
};
