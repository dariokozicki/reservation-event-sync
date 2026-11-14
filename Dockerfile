FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS source
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

FROM source AS production
RUN npm run build
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "start"]
