FROM browserless/chrome:latest

WORKDIR /app

COPY package.json ./
COPY .env.example ./
COPY index.js ./

RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]
