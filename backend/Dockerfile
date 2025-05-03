FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["npm", "run", "start"]
