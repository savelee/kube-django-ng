### STAGE 1: Build ###

# We label our stage as 'builder'
FROM node:latest as builder

LABEL maintainer="Lee Boonstra"

ADD . .

WORKDIR .

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

## Storing node modules on a separate layer will prevent unnecessary npm installs at each build
RUN npm install

## Build the angular app in production mode and store the artifacts in dist folder

RUN npm rebuild node-sass

RUN $(npm bin)/ng build --prod --build-optimizer


### STAGE 2: Setup ###

FROM nginx:1.13.3-alpine

## Copy our default nginx config
ADD ./my-app/nginx/default.conf /etc/nginx/conf.d/

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

## From 'builder' stage copy over the artifacts in dist folder to default nginx public folder
COPY --from=builder ./my-app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]