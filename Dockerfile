FROM node:18-slim

WORKDIR /app

# No package.json, so we just copy all files
COPY . .

# Set permissions for Hugging Face (optional but good practice)
RUN chmod -R 777 /app

ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
