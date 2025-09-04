# Gunakan image Node.js versi LTS
FROM node:20-alpine

# Set direktori kerja
WORKDIR /app

# Salin file package.json dan package-lock.json (jika ada)
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Salin semua source code ke image
COPY . .

# Build aplikasi Next.js
RUN npm run build

# Jalankan aplikasi Next.js
EXPOSE 3000
CMD ["npm", "start"]