FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm install && npm ci --prefix client && npm ci --prefix server
COPY . .
RUN npm run build && mkdir -p server/public && cp -r client/dist/. server/public/

FROM node:24-slim AS production
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=build /app/server/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/public ./public
COPY --from=build /app/server/src/database/migrations ./dist/src/database/migrations
COPY --from=build /app/server/.sequelizerc ./
COPY --from=build /app/server/src/config/config.cjs ./dist/src/config/config.cjs
EXPOSE 5000
CMD ["node", "dist/src/index.js"]
