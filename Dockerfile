FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM busybox:1.30 AS runner
WORKDIR /app
COPY --from=builder /app/dist .
COPY httpd.conf /etc/httpd.conf
CMD ["busybox", "httpd", "-f", "-v", "-p", "8080", "-c", "/etc/httpd.conf"]
