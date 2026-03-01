FROM node:20-alpine AS builder

WORKDIR /app

# LOL skip env vars validation during build phase
ENV SKIP_ENV_VALIDATION=true

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
