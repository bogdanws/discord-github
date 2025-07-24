# syntax=docker/dockerfile:1
FROM node:20-slim

# set working directory
WORKDIR /app

# install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# copy source code
COPY . .

# run the bot
CMD ["npm", "start"] 