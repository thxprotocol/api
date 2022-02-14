FROM node:16-alpine as node_modules

WORKDIR /usr/src/app
RUN apk add g++ make py3-pip
COPY package*.json ./
RUN npm install --ci


FROM node:16-alpine as develop

WORKDIR /usr/src/app
COPY --from=node_modules ./usr/src/app/ ./
COPY . .

CMD [ "npx", "ts-node", "-r", "tsconfig-paths/register", "src/server.ts" ]


FROM node:16-alpine as build

WORKDIR /usr/src/app
COPY --from=node_modules ./usr/src/app/ ./
COPY . .
RUN npm run build
COPY newrelic.js dist/newrelic.js

FROM node:16-alpine as production

ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package* ./
RUN npm config set update-notifier false
RUN apk add --virtual .build g++ make py3-pip && \
    npm install --production --ci && \
    apk del .build
COPY --from=build ./usr/src/app/dist ./
COPY tsconfig.json ./

CMD [ "-r", "tsconfig-paths/register", "src/server.js" ]