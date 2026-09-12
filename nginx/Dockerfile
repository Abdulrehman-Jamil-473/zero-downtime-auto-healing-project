FROM nginx:alpine

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy frontend static files (served at /)
COPY frontend/ /usr/share/nginx/html

# Copy our reverse-proxy + blue-green config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
