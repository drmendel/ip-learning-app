# ip-learning-app – single self-contained container (no npm dependencies)
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8766

COPY package.json server.js ./
COPY engines ./engines
COPY content ./content
COPY public ./public

USER node
EXPOSE 8766
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8766/api/health || exit 1
CMD ["node", "server.js"]
