# THX API

This repository holds the source for the THX REST API.

## Index

1. Prerequisites
2. Installation
3. Usage
4. Debugging
5. Interface

## 1. Prerequisites

-   [Ganache](https://www.trufflesuite.com/ganache)
-   Docker
-   nodejs 10.x

## 2. Debugging

1. `git submodule init`
2. `git submodule update`
3. `npm run copy-contracts`
4. Create `.env` in repo root and provide contents:

```
PRIVATE_KEY=0x873c254263b17925b686f971d7724267710895f1585bb0533db8e693a2af32ff
GAS_STATION_ADDRESS=0x278ff6d33826d906070ee938cdc9788003749e93
MONGODB_URI=mongodb://root:root@mongo:27017/admin
SESSION_SECRET=uoifubjhjfknbdkjhiluaerhrgja
PORT=3000
ORIGIN=https://localhost:8080
RPC=http://ganache:8545
```

5. `docker-compose up`

## 3. Running

```
# Start all containers
docker-compose up

# Suppress logging
docker-compose up -d

# Running in prod
# make sure to provide correct .env contents
npm install;
npm run build;
npm run serve;
```

## 4. Interface

Swagger Documentation is provided in the controllers of the routes and lives at the following endpoints:

-   [Local API Specs](https://localhost:3000/v1/docs/)
-   [Staging API Specs](https://dev.api.thx.network/v1/docs/)
-   [Production API Specs](https://api.thx.network/v1/docs/)
