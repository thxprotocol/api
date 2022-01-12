FROM node:16-alpine  as develop

WORKDIR /usr/src/app

RUN apk add g++ make py3-pip

COPY package*.json ./
RUN npm install --ci

COPY . .
RUN npm run build

CMD [ "node", "dist/src/server.js" ]


FROM node:16-alpine as production

WORKDIR /usr/src/app

COPY --from=develop ./usr/src/app/dist ./dist
COPY package* ./

RUN apk add --virtual .build g++ make py3-pip && \
    npm install --production --ci && \
    apk del .build

EXPOSE 3001

CMD [ "node", "dist/src/server.js" ]
