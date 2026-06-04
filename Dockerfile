FROM node:20-slim
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
