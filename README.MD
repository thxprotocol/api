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
-   nodejs 10.x
-   solc (only if you need ot recompile contracts frequently)

## 2. Installation

1. `git submodule init` (only if you need ot recompile contracts frequently)
2. `git submodule update` (only if you need ot recompile contracts frequently)
3. `npm install`
4. `mv .env.example .env`

## 3. Running

1. Start Ganache on port 7545
2. Get private key value for account index 0
3. Set PRIVATE_KEY in the active .env file with this value

```
npm run serve
```

## 4. Debugging

```
npm run watch-debug
```

## 5. Interface

The API specification is living at:

-   https://localhost:8088/v1/docs/ (local)
-   https://dev.thx.api.network/v1/docs/ (staging)
-   https://thx.api.network/v1/docs/ (production)
