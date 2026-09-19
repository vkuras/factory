FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY public ./public

ENV PORT=8080
ENV DATA_DIR=/data

RUN mkdir -p /data

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=3s --retries=10 \
  CMD wget -q -O - http://127.0.0.1:8080/health || exit 1

CMD ["node", "src/server.js"]
