FROM node:18-alpine 

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
COPY src src
COPY .env .env
COPY webpack.config.js webpack.config.js

RUN npm install

RUN npm run build

EXPOSE 4321

CMD [ "node", "dist/main.js" ]