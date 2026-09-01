FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-cache
COPY . .
ARG API_URL=/api
ENV API_URL=$API_URL
RUN npm run build:deploy

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY static-server.mjs /app/static-server.mjs
ENV PORT=8080
EXPOSE 8080
CMD ["node", "static-server.mjs"]