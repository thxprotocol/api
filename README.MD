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

### 5.1 Asset Pools

`GET /asset_pools/:address`

Method for obtaining the asset pool contract and metadata for the specified asset pool.

```
curl "https://localhost:8088/v1/asset_pools/0x036BD58cdB0e48425765BB4DD56b0a55E12e1Acd" \
    -X GET
```

### 5.2 Rewards

`GET /rewards/:id`

Method for obtaining the reward contract and metadata for a specific reward configuration in the specified asset pool.

```
curl "https://localhost:8088/v1/rewards/0" \
    -X GET \
    -H "AssetPool: 0xAF856BE68391f2703216d286F00B1608F1fae4E1"
```

### 5.3 Withdrawals

`GET /withdrawals/:address`

Method for obtaining the withdrawal and metadata for a withdrawal in the specified asset pool.

```
curl "https://localhost:8088/v1/withdrawals/0x2d7ab3737030959489f9b5880a6ea78942570151" \
    -X GET \
    -H "AssetPool: 0xAF856BE68391f2703216d286F00B1608F1fae4E1"
```

### POST Reward:

Creates a withdraw proposal for the specified address in the specified asset pool.

```
curl "https://api.thxprotocol.com/v1/withdrawals" \
    -X POST \
    -H "AssetPool: 0xAF856BE68391f2703216d286F00B1608F1fae4E1" \
    -H "Content-Type: application/json" \
    -d '{"rule": "0", "address": "0x2d7ab3737030959489f9b5880a6ea78942570151"}'
```
