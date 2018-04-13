FROM node:latest

LABEL maintainer="Lee Boonstra"

# Create app directory

ADD . .

WORKDIR ./my-app

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

## Storing node modules on a separate layer will prevent unnecessary npm installs at each build
RUN npm install

EXPOSE 3000

CMD ["node", "app.js"]