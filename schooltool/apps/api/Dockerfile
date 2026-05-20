FROM node:20-alpine

WORKDIR /app

COPY schooltool/package*.json ./schooltool/
RUN cd schooltool && npm ci --omit=dev

COPY schooltool/apps/api ./schooltool/apps/api
COPY schooldata ./schooldata

RUN mkdir -p /app/runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8010
ENV SCHOOL_DATA_PATH=/app/schooldata/data.json
ENV RUNTIME_DIR=/app/runtime

EXPOSE 8010

CMD ["node", "schooltool/apps/api/server.js"]
