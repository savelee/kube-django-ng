### STAGE 1: Build ###
#FROM node:latest as builder
FROM gcr.io/cloud-builders/npm
LABEL maintainer="Lee Boonstra"

ADD . .

WORKDIR .

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force
RUN npm install

RUN npm run build:client-and-server-bundles
RUN npm run webpack:server

## Build the angular app in production mode and store the artifacts in dist folder
#RUN npm rebuild node-sass
#RUN $(npm bin)/ng build --prod --build-optimizer

### STAGE 2: Setup ###
FROM nginx:1.13.3-alpine

ADD ./nginx/default.conf /etc/nginx/conf.d/
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder ./dist /usr/share/nginx/html

## TODO how to launch the SSR version?

CMD ["nginx", "-g", "daemon off;"]