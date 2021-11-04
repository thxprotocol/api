[![CI/CD Production](https://github.com/thxprotocol/api/workflows/CI/CD%20Production/badge.svg)](https://github.com/thxprotocol/api/actions/workflows/ci-cd-master.yml)
[![CI/CD Staging](https://github.com/thxprotocol/api/workflows/CI/CD%20Staging/badge.svg)](https://github.com/thxprotocol/api/actions/workflows/ci-cd-develop.yml)

# THX API

This repository holds the code for the THX API project. A REST API that can be used to interact the the THX Smart Contract layer and which main purpose is to make it easier for developers to utilize blockchain technology in their applications.

## Index

1. Prerequisites
2. Installing
3. Usage
4. Testing
5. Register clients
6. Interface
7. Database Schema Migration

## 1. Prerequisites

-   Docker
-   Nodejs 12.x

## 2. Installing

```
# 1. Provide environment variables
cp .env.example .env;

# 2. Checkout SCSS submodule
git submodule init;
git submodule update;

# 3. Install packages
npm install;

# 4. Extract docker volumes in ./cache
mkdir cache;
unzip cache.zip -d ./cache;

# 5. Start the containers
docker compose up;
```

## 3. Usage

The thx_mainnet and thx_testnet containers will start with 2 prefilled wallets and both the AssetPoolFactory and AssetPoolRegistry will be deployed automatically:

```
0x873c254263b17925b686f971d7724267710895f1585bb0533db8e693a2af32ff
0x5a05e38394194379795422d2e8c1d33e90033d90defec4880174c39198f707e3
```

## 4. Testing

```
# Run e2e tests
npm run test
```

## 5. Register clients

### 5.1 client_credentials example

```
POST http://localhost:3000/reg
{
    "application_type": "web",
    "client_name": "Your App",
    "grant_types": ["client_credentials"],
    "redirect_uris": [],
    "response_types": [],
    "scope": "openid admin"
}
```

### 5.2 authorization_code example

```
POST http://localhost:3000/reg
{
    "application_type": "web",
    "client_name": "THX Wallet",
    "grant_types": ["authorization_code"],
    "redirect_uris": ["https://dev.wallet.thx.network/signin-oidc"],
    "post_logout_redirect_uris": ["https://dev.wallet.thx.network"],
    "response_types": ["code"],
    "scope": "openid user email offline_access"
}
```

## 6. Interface

Swagger Documentation is provided in the controllers of the routes and lives at the following endpoints:

-   [API Health](https://localhost:3000/v1/health/)
-   [Local API Specs](https://localhost:3000/v1/docs/)
-   [Staging API Specs](https://dev.api.thx.network/v1/docs/)
-   [Production API Specs](https://api.thx.network/v1/docs/)
-   [Developer Documentation](http://docs.thx.network)

## 7. Database Schema Migration

### 7.1 To add a new migration script, use the following CLI command

```
npm run migrate:create name-of-my-script
```

A new file will be created inside migrations folder with a corresponding timestamp.

```
|_ migrations/
   |- 20210108114324-name-of-my-script.js
```

### 7.2 To add a new property to the existing collection

Considering we want to add a quantity property to the products collection, the migration could be as follows:

```
export = {
    async up(db: Db) {
        return db.collection('products').updateMany({}, { $set: { quantity: 10 } });
    },

    async down(db: Db) {
        return db.collection('products').updateMany({}, { $unset: { quantity: null } });
    },
};
```

### 7.3 Running migrations

To get the migration status

```
npm run migrate:status
```

To run your migrations, simply run the command

```
npm run migrate
```

To rollback a migration use the down command

```
npm run migrate:undo-last
```
