# Build frontend
FROM node:18-alpine AS frontend-build
RUN echo "cachebust-v2"
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
ARG VITE_API_URL
RUN cd frontend && VITE_API_URL=${VITE_API_URL} npm run build

# Final image
FROM python:3.11-slim
RUN echo "cachebust-v2"
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=frontend-build /app/frontend/dist ./static
EXPOSE 8000
CMD ["/bin/sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
