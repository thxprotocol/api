![CI](https://github.com/thxprotocol/api/workflows/CI/badge.svg?branch=master)

# THX API

This repository holds the source for the THX API and the Slack Proxy that is used by the THX Slack App.

## Index

1. Prerequisites
2. Installation
3. Usage
4. Debugging
5. API Endpoints

## 1. Prerequisites

-   nodejs 10.x
-   solc 0.6.4

## 2. Installation

2. `git submodule init`
3. `git submodule update`
4. `npm install`
5. `npm run contracts:compile`

## 3. Running

```
npm run serve
```

## 4. Debugging

```
npm run watch-debug
```

## 5. REST Interface

### 5.1 Reward Pools

`GET /reward_pools/:address`

Method for obtaining the reward pool contract and metadata for the specified reward pool.

```
curl "https://localhost:8088/v1/reward_pools/0x036BD58cdB0e48425765BB4DD56b0a55E12e1Acd" \
    -X GET
```

### 5.2 Reward Rules

`GET /reward_rules/:id`

Method for obtaining the reward rule contract and metadata for a specific reward rule in the specified reward pool.

```
curl "https://localhost:8088/v1/reward_rules/0" \
    -X GET \
    -H "RewardPool: 0xAF856BE68391f2703216d286F00B1608F1fae4E1"
```

### 5.3 Rewards

`GET /reward_rules/:id`

Method for obtaining the reward rule contract and metadata for a specific reward rule in the specified reward pool.

```
curl "https://localhost:8088/v1/rewards/0" \
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
