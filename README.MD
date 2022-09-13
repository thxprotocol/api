[![CI](https://github.com/thxprotocol/api/actions/workflows/ci.yml/badge.svg)](https://github.com/thxprotocol/api/actions/workflows/ci.yml)

# THX API

This repository holds the REST API consumed by THX client and third party apps. It exposes data stored in EVM compatible blockchain networks and a MongoDB database.

-   [API Health](https://localhost:3000/v1/health/)
-   [Local API Specs](https://localhost:3000/v1/docs/)
-   [Staging API Specs](https://dev.api.thx.network/v1/docs/)
-   [Production API Specs](https://api.thx.network/v1/docs/)
-   [Developer Documentation](http://docs.thx.network)

## 1. Prerequisites

### Docker

https://www.docker.com/products/docker-desktop/

### OpenSSL

```
# Install latest openssl
brew update
brew install openssl

# Create openssl alias (optionally replace .zshrc with .bash_profile)
echo "export PATH="/opt/homebrew/opt/openssl@1.1/bin:$PATH" >> ~/.zshrc
source ~/.zshrc
```

Alternatively you can use [mkcert](https://github.com/FiloSottile/mkcert) to simplify generation of certs and easily register the root CA.

### NVM

```
brew install nvm # mind the optional install instructions
```

## 2. Installing

```
# 1. Install/activate current nodejs defined in .nvmrc
nvm use

# 2. Provide environment variables
cp .env.example .env

# 3 Install certificates
npm run build:ssl localhost

or

mkcert -key-file certs/localhost.key -cert-file certs/localhost.crt localhost

# 4. Install node-canvas binaries for your OS
# MacOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Ubuntu
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Alpine
apk add build-base g++ cairo-dev jpeg-dev pango pango-dev giflib-dev imagemagick freetype fontconfig

# 5. Install packages
npm ci
```

## 3. Usage

A thx_hardhat container with prefilled wallets and all required contracts will be deployed automatically.

```
# 1. Start containers
docker compose up

# 2. Start app
npm start
```

## 4. Testing

```
#Runs all suites
npm test

#Runs a specific test by file name
npm test <file_name_part>
```

## 5. Database Schema Migration

### 5.1 Add migrations

```
npm run migrate:create name-of-my-migration
```

A new file will be created inside migrations folder with a corresponding timestamp.

```
|_ migrations/
   |- 20210108114324-name-of-my-script.js
```

### 5.3 Run migrations

```
# To get the migration status
npm run migrate:status

# To run your migrations, simply run the command
npm run migrate

# To rollback a migration use the down command
npm run migrate:undo-last
```

### 5.4 Upgrading contracts

```
# To get the contracts artifacts upgraded:
1. npm i @thxnetwork/artifacts@x.x.x --save
2. Update hardhat-thx-artifacts version in docker-compose.yml
3. docker compose pull
3. docker compose up
```
