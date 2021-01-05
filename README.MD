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
-   Nodejs 10.x

## 2. Debugging

1. `git submodule init`
2. `git submodule update`
3. `npm run copy-contracts`
4. Create `.env` in repo root and provide contents:

```
PRIVATE_KEY=0x873c254263b17925b686f971d7724267710895f1585bb0533db8e693a2af32ff
GAS_STATION_ADDRESS=0x278ff6d33826d906070ee938cdc9788003749e93
MONGODB_URI=mongodb://root:root@mongo:27017/admin
PORT=3000
ORIGIN=https://localhost:8080
RPC=http://ganache:8545
```

5. `docker-compose up`

## 3. Running

```
# Generate keys
node ./scripts/generateKeys.js

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

## 4. Testing

```
# Run end to end tests on inmemory database and ganache network
npm run test

# Run load tests in dockerized k6 container (open Grafana to visualize results)
# Mind that it will target the development database that is currently active
npm run test:load
```

## 5. Interface

Swagger Documentation is provided in the controllers of the routes and lives at the following endpoints:

-   [Local Mongo Express](http://localhost:8081)
-   [Local Grafana](http://localhost:8082)
-   [Local API Specs](https://localhost:3000/v1/docs/)
-   [Staging API Specs](https://dev.api.thx.network/v1/docs/)
-   [Production API Specs](https://api.thx.network/v1/docs/)
