# ✅ Use Playwright base image with all dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.43.1-jammy

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Set environment variable for production (optional)
ENV NODE_ENV=production

# Start the scraper
CMD ["node", "index.js"]
