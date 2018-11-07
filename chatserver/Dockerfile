FROM node:latest

LABEL maintainer="Lee Boonstra"

ADD . .

WORKDIR ./my-app

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

RUN npm install --force

EXPOSE 3000

CMD ["node", "app.js"]