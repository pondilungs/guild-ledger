FROM node:22-alpine

WORKDIR /app

COPY server.mjs ./
COPY data/leaderboard.json ./data/leaderboard.json

ENV NODE_ENV=production
EXPOSE 8787

CMD ["node", "server.mjs"]