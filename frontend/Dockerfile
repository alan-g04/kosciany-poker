FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY public ./public
COPY src ./src

# Build the bundle with a literal placeholder; the runtime entrypoint script
# replaces it with the real $VITE_WS_URL value at container start.
ENV VITE_WS_URL=__VITE_WS_URL__
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/10-set-ws-url.sh /docker-entrypoint.d/10-set-ws-url.sh
RUN chmod +x /docker-entrypoint.d/10-set-ws-url.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
