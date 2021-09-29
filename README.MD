[![CI/CD Production](https://github.com/thxprotocol/api/workflows/CI/CD%20Production/badge.svg)](https://github.com/thxprotocol/api/actions/workflows/ci-cd-master.yml)
[![CI/CD Staging](https://github.com/thxprotocol/api/workflows/CI/CD%20Staging/badge.svg)](https://github.com/thxprotocol/api/actions/workflows/ci-cd-develop.yml)

# THX API

This repository holds the code for the THX API project. A REST API that can be used to interact the the THX Smart Contract layer and which main purpose is to make it easier for developers to utilize blockchain technology in their applications.

## Index

1. Prerequisites
2. Debugging
3. Running
4. Testing
5. Interface

## 1. Prerequisites

-   Docker
-   Nodejs 12.x

## 2. Installing

```
# 1. Provide environment variables
cp .env.example .env;

# 2. Install SCSS submodule (will move to an npm package eventually)
git submodule init;
git submodule update;

# 3. Install packages
npm install;

# 4. Start the containers
docker compose up;

#5. Install fixture data (if database is empty)
npm run reset:db;
```

## 3. Running

```
# Start containers
docker compose up

# Start containers and suppress logging
docker compose up -d
```

The thx_mainnet and thx_testnet containers will start with 4 prefilled accounts and both the AssetPoolFactory and AssetPoolRegistry will be deployed automatically:

```
0x873c254263b17925b686f971d7724267710895f1585bb0533db8e693a2af32ff
0xe9793d9246355c0f9fd3b330c0ee0aebdb24c813d47a27c1df87d6656c691d37
0x447b6475b1170c4edd9521ba4960bbcf4252cec02b14e0564c87ec00624033a8
0x1b8242ac13eb24f83479b3d9d83eabf484844de02708758c27142d0ed98aec2c
```

## 4. Testing

```
# Run e2e tests on MemoryMongoDB and temporary Hardhat node
npm run test
```

## 6. Fixture DB

Make sure you have `mongo-development-tools` installed with brew. See mongo documentation installation steps.

```
# Export local db
mongoexport --uri="mongodb://root:root@localhost:27017/admin" --collection="client" --out="./fixture/db/client.json"
mongoexport --uri="mongodb://root:root@localhost:27017/admin" --collection="accounts" --out="./fixture/db/accounts.json"
mongoexport --uri="mongodb://root:root@localhost:27017/admin" --collection="registration_access_token" --out="./fixture/db/registration_access_token.json"

# Import local db
mongoimport --uri="mongodb://root:root@localhost:27017/admin" --collection="client" --file="./fixture/db/client.json"
mongoimport --uri="mongodb://root:root@localhost:27017/admin" --collection="accounts" --file="./fixture/db/accounts.json"
mongoimport --uri="mongodb://root:root@localhost:27017/admin" --collection="registration_access_token" --file="./fixture/db/registration_access_token.json"

```

## 6. Register clients

### 6.1 client_credentials example

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

### 6.2 authorization_code example

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

-   [Local Mongo Express](http://localhost:8081)
-   [Local Grafana](http://localhost:8082)
-   [Local API Specs](https://localhost:3000/v1/docs/)
-   [Staging API Specs](https://dev.api.thx.network/v1/docs/)
-   [Production API Specs](https://api.thx.network/v1/docs/)

## 7. Database Schema Migration

### 7.1 To add a new migration script, use the following CLI command

```
migrate-mongo create name-of-my-script
```

A new file will be created inside migrations folder with a corresponding timestamp.

|_ migrations/
   |- 20210108114324-name-of-my-script.js

### 7.2 To add a new property to the existing collection

Considering we want to add a quantity property to the products collection, the migration could be as follows:
```
module.exports = {
    async up(db) {
        return db.collection('products').updateMany({}, { $set: { quantity: 10 } })
    }
    async down(db) {
        return db.collection('products').updateMany({}, { $unset: { quantity: null } })
    }
}
```

### 7.3 Running migrations

To run your migrations, simply run the command

```
migrate-mongo up
```

To rollback a migration use the down command

```
migrate-mongo down
```



