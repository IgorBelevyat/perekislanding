# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_GTM_ID
ENV VITE_GTM_ID=$VITE_GTM_ID
ARG VITE_BINOTEL_WIDGET_HASH
ENV VITE_BINOTEL_WIDGET_HASH=$VITE_BINOTEL_WIDGET_HASH
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
