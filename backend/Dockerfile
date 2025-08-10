FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production=false

COPY prisma ./prisma

RUN npx prisma generate

COPY tsconfig.json ./
COPY . .

RUN npm run build

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/apolloServer.js"]