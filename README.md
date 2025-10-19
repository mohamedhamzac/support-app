# Support App - mini ticket system

## Installation
1. Installer Node.js (version 16+).
2. Copier `.env.example` → `.env` et remplir les valeurs (JWT_SECRET, DISCORD_WEBHOOK, SMTP si utilisé).
3. Installer les dépendances :
npm install
4. Lancer le serveur :
npm start
5. Ouvrir :
- Page publique : http://localhost:3000/
- Admin : http://localhost:3000/admin
- Admin par défaut : login `admin` / mot de passe `admin123` (change le direct !)

## Notes
- `db.sqlite` est créé automatiquement.
- Met à jour `JWT_SECRET` dans `.env`.
- Configure SMTP si tu veux recevoir un mail lorsque qu'un ticket arrive.
- Discord webhook envoie une notification vers ton serveur Discord.
