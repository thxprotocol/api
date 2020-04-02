# THX API v0.1.0-alpha

## Description
This repository holds the source for the Firebase Functions used for the API and Slack Proxy.

## Index
1. Prerequisites
2. Install
3. Deployment
4. Contract Compilation
5. Testing
6. References

## 3. Deployment

### Firebase Functions
Firebase Functions are specified in the `./functions` folder. There are Express instances created for the API and the Slack Proxy. This is how you publish them:
```
yarn deploy:api:dev;
yarn deploy:api:prod;

yarn deploy:slack:dev;
yarn deploy:slack:prod;
```

## 4. Contract Compilation
```
yarn contracts:compile
```


## Usage

1. Create account at https://thx-wallet-dev.firebaseapp.com/
2. Generate private keys for Rinkeby and Loom/Extdev networks
3. Connect account
4. Join or create a reward pool

### Reward Claim QR Image:
https://us-central1-thx-wallet-dev.cloudfunctions.net/api/qr/claim/:poolAddr/:ruleId

### Firebase Functions API (Dev):
https://us-central1-thx-wallet-dev.cloudfunctions.net/api

### Available endpoints:

```
curl https://us-central1-thx-wallet-dev.cloudfunctions.net/api/rules \
  -X GET
```

```
curl https://us-central1-thx-wallet-dev.cloudfunctions.net/api/rules/0 \
  -X GET
```

```
curl https://us-central1-thx-wallet-dev.cloudfunctions.net/api/rewards \
	-X POST \
	-H "Content-Type: application/json" \
	-d '{"pool": "0xE7FA4ca3257F852a96de1543fb8B9f802C7be933", "rule": "0", "address": "0xEwFA4cU9s090wjOGAW43fb8B9f802C7be933"}'
```
