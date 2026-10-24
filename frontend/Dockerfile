FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
ARG BACKEND_URL=http://api:4000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm","start"]