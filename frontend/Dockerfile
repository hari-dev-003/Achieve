# Use Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy everything from your frontend folder
COPY . .

# Install dependencies
RUN npm install

# Expose port 5000
EXPOSE 5000

# Start the dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]