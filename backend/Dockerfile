# 1. Usamos una versión ligera de Node
FROM node:18-alpine

# 2. Instalamos herramientas necesarias para compilar librerías nativas como bcrypt
RUN apk add --no-cache python3 make g++

# 3. Directorio de trabajo
WORKDIR /app

# 4. Copiamos dependencias y las instalamos
COPY package*.json ./
RUN npm install --timeout=300000

# 5. Copiamos el resto del código
COPY . .

# 6. Exponemos el puerto de tu .env
EXPOSE 3000

# 7. Arrancamos la aplicación
CMD ["npm", "start"]