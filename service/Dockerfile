# Utiliser une image Node.js comme base
FROM node:20.12.2

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier .env
COPY .env .

# Copier le package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le reste du code source
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 5002

# Démarrer l'application
CMD ["npm", "run", "start:prod"]
