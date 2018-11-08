FROM node:latest

LABEL maintainer="Lee Boonstra"

WORKDIR .

COPY /my-app/package.json .
COPY /my-app/app.js .
COPY /my-app/structjson.js .

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force
RUN npm install grpc --build-from-source

RUN npm install
RUN npm install pm2 -g
RUN npm rebuild

EXPOSE 3000

CMD ["pm2-runtime", "app.js"]
