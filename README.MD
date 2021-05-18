![CI/CD Production](https://github.com/thxprotocol/api/workflows/CI/CD%20Production/badge.svg)
![CI/CD Staging](https://github.com/thxprotocol/api/workflows/CI/CD%20Staging/badge.svg)

# THX API

This repository holds the source for the THX REST API.

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
# 1. Initialize the submodule
git submodule init

# 2. Update the submodule
git submodule update

# 3. Duplicate .env.example and
#    1. remove the Hardhat Config section,
#    2. uncomment the Docker settings
#    3. replace localhost with Docker IP if required
cp .env.example .env

# 4. Install packages
npm install

# 4. Compile the smart contracts
npm run build:contracts

# 5. Start the containers
npm run build:keys

# 6. Start the containers
docker-compose up

# 7. Provide the asset pool factory address from the output your .env file
npm run deploy:factory

# 8. Rebuild the API project
npm run build
```

## 3. Running

```
# Start containers
docker-compose up

# Start containers and suppress logging
docker-compose up -d
```

The thx_ganache container will start with 4 prefilled accounts:

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

# Run load tests in dockerized k6 container (open Grafana to visualize results)
# Mind that it will target the MONGODB_URI set in .env
npm run test:load
```

## 5. Development

```
# Builds artifacts for the solidity files in the submodule
npm run build:contracts

# Deploys AssetPoolFactory (diamond) on the RPC set in .env
npm run deploy:factory

# Deploys TestToken on the RPC set in .env
npm run deploy:token
```

## 6. Fixture DB

Make sure you have `mongo-development-tools` installed with brew. See mongo documentation installation steps.

```
# Export local db
mongoexport --uri="mongodb://root:root@localhost:27017/admin" --collection="client" --out="./db/client.json"
mongoexport --uri="mongodb://root:root@localhost:27017/admin" --collection="accounts" --out="./db/accounts.json"
mongoexport --uri="mongodb://root:root@localhost:27017/admin" --collection="registration_access_token" --out="./db/registration_access_token.json"

# Import local db
mongoimport --uri="mongodb://root:root@localhost:27017/admin" --collection="client" --file="./db/client.json"
mongoimport --uri="mongodb://root:root@localhost:27017/admin" --collection="accounts" --file="./db/accounts.json"
mongoimport --uri="mongodb://root:root@localhost:27017/admin" --collection="registration_access_token" --file="./db/registration_access_token.json"

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
