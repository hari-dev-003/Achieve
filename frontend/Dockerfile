FROM node:20-alpine

WORKDIR /app

# Copy only package files first
COPY frontend/package*.json ./

# Clean install to avoid optional dependency bug
RUN rm -rf node_modules package-lock.json && npm install

# Copy the rest of the frontend code
COPY frontend/ ./

EXPOSE 5000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]