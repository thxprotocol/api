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

1. Create THX account at https://wallet.thxprotocol.com/register
2. Connect the wallet to the networks
3. Join or create a reward pool

## 3. Installation

1. `nvm install 10`
2. `nvm use 10`
3. `npm install`
4. `git submodule init` (deprecated)
5. `git submodule update` (deprecated)
6. `npm run contracts:compile` (deprecated)

## 4. Running

1. `npm run serve`

## 5. API Endpoints

The THX API exposes endpoints for reward and reward rule management for your pool. When targeting the development environment endpoints use `http://ec2-35-180-251-50.eu-west-3.compute.amazonaws.com:8443` as a domain for your API url.

### GET RewardRules:

```
curl "https://api.thxprotocol.com/v1/rules" \
    -X GET \
    -H "RewardPool: 0xAF856BE68391f2703216d286F00B1608F1fae4E1"
```

### GET RewardRule 0:

```
curl "https://api.thxprotocol.com/v1/rules/0" \
    -X GET \
    -H "RewardPool: 0xAF856BE68391f2703216d286F00B1608F1fae4E1"
```

### POST Reward:

```
curl "https://api.thxprotocol.com/v1/rewards" \
    -X POST \
    -H "RewardPool: 0xAF856BE68391f2703216d286F00B1608F1fae4E1" \
    -H "Content-Type: application/json" \
    -d '{"rule": "0", "address": "0x2d7ab3737030959489f9b5880a6ea78942570151"}'
```

### GET QR Connect:

```
curl --output qr.png "https://api.thxprotocol.com/v1/qr/connect/0xAF856BE68391f2703216d286F00B1608F1fae4E1/XXXXXXXX" \
    -X GET
```

### GET QR Reward:

```
curl --output qr.png "https://api.thxprotocol.com/v1/qr/reward/0xAF856BE68391f2703216d286F00B1608F1fae4E1/0/-Ww34AsIY91" \
    -X GET
```

## 6. Slack Proxy Endpoints

The THX Slack Proxy exposes endpoints to be called by Slack slash commands.

```
https://api.thxprotocol.com/v1/slack/connect
https://api.thxprotocol.com/v1/slack/rules
https://api.thxprotocol.com/v1/slack/reward
```
