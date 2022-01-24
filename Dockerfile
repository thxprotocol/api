FROM node:16-alpine as develop

WORKDIR /usr/src/app

RUN apk add g++ make py3-pip

COPY package*.json ./
RUN npm install --ci

COPY . .
RUN npm run build

CMD [ "node", "dist/src/server.js" ]


FROM node:16-alpine as production

WORKDIR /usr/src/app

COPY package* ./

RUN npm config set update-notifier false

RUN apk add --virtual .build g++ make py3-pip && \
    npm install --production --ci && \
    apk del .build

COPY --from=develop ./usr/src/app/dist ./

EXPOSE 3001

CMD [ "node", "src/server.js" ]
