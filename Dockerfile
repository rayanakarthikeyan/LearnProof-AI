FROM node:22-bookworm-slim AS web
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM python:3.12-slim-bookworm
ENV PYTHONUNBUFFERED=1 LEARNPROOF_DATA_DIR=/data
RUN apt-get update && apt-get install -y --no-install-recommends libreoffice-impress fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.lock.txt ./
RUN pip install --no-cache-dir -r requirements.lock.txt
COPY learnproof ./learnproof
COPY demo-materials ./demo-materials
COPY evaluation ./evaluation
COPY --from=web /build/dist ./dist
RUN useradd --create-home --uid 10001 learnproof && mkdir /data && chown learnproof /data
USER learnproof
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health',timeout=3)"
CMD ["python","-m","uvicorn","learnproof.api:app","--host","0.0.0.0","--port","8000"]
