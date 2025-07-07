# FROM node:18.18.2-alpine3.18
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# CMD ["npm", "start"]


# Stage 1: Build React app
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# # Stage 2: Serve with NGINX
# FROM nginx:1.25.4-alpine
# COPY --from=build /app/build /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

# Stage 2: Serve with NGINX with custom env
FROM nginx:1.25.4-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
# Copy script to docker entrypoint and allow execution
COPY .docker/env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh
# Create assets directory and copy env.template.js
RUN mkdir -p /usr/share/nginx/html/assets
COPY assets/env.template.js /usr/share/nginx/html/assets/env.template.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]