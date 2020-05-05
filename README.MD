# THX API v0.1.0-alpha

## Description

This repository holds the source for the THX API and the Slack Proxy that is used by the THX Slack App.

## Index

1. Prerequisites
2. Register
3. Installation
4. Usage
5. API Endpoints
6. Slack Proxy Endpoints

## 1. Prerequisites

-   nodejs 10.x
-   nvm 0.35.2
-   solc 0.6.4

## 2. Register

1. Create THX account at https://thx-wallet-dev.firebaseapp.com/register
2. Connect the wallet to the networks
3. Join or create a reward pool

## 3. Installation

1. `nvm install 10`
2. `nvm use 10`
3. `npm install`
4. `git submodule init`
5. `git submodule update`
6. `npm run contracts:compile`

## 4. Running

1. `npm run serve`

## 5. API Endpoints

The THX API exposes endpoints for reward and reward rule management for your pool.

### GET RewardRules:

```
curl "http://ec2-35-180-251-50.eu-west-3.compute.amazonaws.com/api/rules" \
    -X GET \
    -H "RewardPool: 0xABC4DA93438C8D63590E8adaF8E4257CCB85f9e6"
```

### GET RewardRule 0:

```
curl "http://ec2-35-180-251-50.eu-west-3.compute.amazonaws.com/api/rules/0" \
    -X GET \
    -H "RewardPool: 0xABC4DA93438C8D63590E8adaF8E4257CCB85f9e6"
```

### POST Reward:

```
curl "http://ec2-35-180-251-50.eu-west-3.compute.amazonaws.com/api/rewards" \
    -X POST \
    -H "RewardPool: 0xABC4DA93438C8D63590E8adaF8E4257CCB85f9e6" \
    -H "Content-Type: application/json" \
    -d '{"rule": "0", "address": "0x7334b51060e9452c2a1e595dca301b75ca207c28"}'
```

### GET QR Connect:

```
curl "http://ec2-35-180-251-50.eu-west-3.compute.amazonaws.com/api/qr/connect" \
    -X GET \
    -H "RewardPool: 0xABC4DA93438C8D63590E8adaF8E4257CCB85f9e6" \
    -d '{"slack": "XXXXXXXX"}'
```

### GET QR Reward:

```
curl "http://ec2-35-180-251-50.eu-west-3.compute.amazonaws.com/api/qr/connect/0xABC4DA93438C8D63590E8adaF8E4257CCB85f9e6/0/-Ww34AsIY91" \
    -X GET
```

## 6. Slack Proxy Endpoints

The THX Slack Proxy exposes endpoints to be called by Slack slash commands.

```
http://localhost:5000/slack/connect
http://localhost:5000/slack/rules
http://localhost:5000/slack/reward
```
