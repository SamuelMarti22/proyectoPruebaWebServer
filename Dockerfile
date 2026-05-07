FROM node:lts-alpine
WORKDIR /movies-project
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
