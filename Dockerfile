FROM node:16-alpine as develop

WORKDIR /usr/src/app

RUN apk add g++ make py3-pip

COPY package*.json ./
RUN npm install --ci

COPY . .

CMD [ "npx", "ts-node", "src/server.ts" ]

FROM node:16-alpine as build

WORKDIR /usr/src/app

COPY --from=develop ./usr/src/app/ ./

RUN npm run build

CMD [ "dist/src/server.js" ]

FROM node:16-alpine as production

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package* ./

RUN npm config set update-notifier false

RUN apk add --virtual .build g++ make py3-pip && \
    npm install --production --ci && \
    apk del .build

COPY --from=build ./usr/src/app/dist ./

EXPOSE 3001

CMD [ "src/server.js" ]
