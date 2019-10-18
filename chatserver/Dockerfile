FROM node:10.13.0

LABEL maintainer="Lee Boonstra"

WORKDIR /app

COPY package.json /app
COPY . /app

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force
RUN npm install grpc --unsafe-perm
RUN npm install pm2 -g
RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["pm2-runtime", "/app/dist/src/main.js"]