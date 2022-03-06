FROM node:16-alpine AS build-website
WORKDIR /website
ADD website/package.json /tmp/website/
RUN cd /tmp/website && npm install
RUN mv /tmp/website/node_modules /website
COPY website /website
RUN npm run build

FROM node:16-alpine
WORKDIR /server
ADD server/package.json /tmp/server/
RUN cd /tmp/server && npm install
RUN mv /tmp/server/node_modules /server
COPY --from=build-website /website/dist /website-build
COPY server /server
ENV WEBSITE_BUILD_PATH /website-build
ENV PORT 80
ENV ROOM_JWT_SECRET $ROOM_JWT_SECRET
EXPOSE 80
CMD ["npm", "run", "start"]
