FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.mjs db.mjs ./
COPY data/leaderboard.json ./data/leaderboard.json

ENV NODE_ENV=production
EXPOSE 8787

CMD ["node", "server.mjs"]