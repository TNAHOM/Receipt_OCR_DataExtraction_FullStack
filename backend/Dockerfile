FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --production=false

COPY backend/prisma ./prisma

RUN npx prisma generate

COPY backend/tsconfig.json .
COPY backend/. ./

RUN npm run build

RUN mkdir -p uploads

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "dist/apolloServer.js"]