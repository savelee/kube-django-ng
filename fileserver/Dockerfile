FROM node:latest

LABEL maintainer="Lee Boonstra"

WORKDIR .

COPY package.json .
COPY app.js .

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force
RUN npm install grpc --build-from-source

RUN npm install
RUN npm install pm2 -g
RUN npm rebuild

EXPOSE 3200

CMD ["pm2-runtime", "app.js"]
