FROM node:22-alpine AS build
WORKDIR /app
COPY front-end/package*.json ./
RUN npm ci
COPY front-end/ ./
RUN npm run build

FROM nginx:alpine
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
