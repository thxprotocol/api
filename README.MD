# THX API v0.1.0-alpha

## Description
This repository holds the source for the Firebase Functions used for the API.

## Index
1. Prerequisites
2. Install
3. Contract Compilation
4. Deployment
5. Usage

## 1. Prerequisites
* nodejs v12.16.0
* nvm 0.35.2
* yarn 1.22.0
* firebase-cli 7.13.0
* solc 0.6.4

## 2. Install
1. `git submodule init;`
2. `git submodule update;`
3. `yarn contracts:compile;`
4. `cd ./functions;`
5. `yarn;`

## 3. Contract Compilation
```
yarn contracts:compile
```

## 4. Deployment
Firebase Functions are specified in the `./functions` folder. This is how you publish them:

```
yarn deploy:dev;
yarn deploy:prod;
```

## 5. Usage

1. Create account at https://thx-wallet-dev.firebaseapp.com/
2. Generate private keys for Rinkeby and Loom/Extdev networks
3. Connect account
4. Join or create a reward pool

### Get RewardRules:

```
curl https://us-central1-thx-wallet-dev.cloudfunctions.net/api/rules \
  -X GET
```

### Get RewardRule 0:

```
curl https://us-central1-thx-wallet-dev.cloudfunctions.net/api/rules/0 \
  -X GET
```

### Create Reward Pool Rewards:

```
curl https://us-central1-thx-wallet-dev.cloudfunctions.net/api/rewards \
	-X POST \
	-H "Content-Type: application/json" \
	-d '{"pool": "0xE7FA4ca3257F852a96de1543fb8B9f802C7be933", "rule": "0", "address": "0xEwFA4cU9s090wjOGAW43fb8B9f802C7be933"}'
```
