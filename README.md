# Tiles Hunting Routing – Application Web

## Présentation

Tiles Hunting Routing est une application web JavaScript/Node.js permettant d’afficher une carte Leaflet avec un quadrillage « tiles hunting » (1 mile x 1 mile), d’importer et visualiser vos activités Strava, de colorier dynamiquement les tuiles traversées, de calculer des itinéraires (OSRM), d’utiliser l’autocomplétion d’adresses (Nominatim), et de garantir la persistance locale des données (localStorage). L’application gère également l’authentification Strava (OAuth2) et propose une expérience utilisateur fluide avec un loader non bloquant.

## Fonctionnalités principales

- **Carte interactive Leaflet** avec quadrillage dynamique (1 mile x 1 mile, toujours carré)
- **Coloration automatique** des tuiles traversées par vos activités Strava (en rouge)
- **Affichage de toutes les activités Strava** sur la carte (traces violettes)
- **Import Strava** sécurisé via OAuth2 (connexion, callback, récupération du token, import par lots)
- **Calcul d’itinéraires** (OSRM) avec choix du mode (marche, vélo, voiture) et affichage de la distance
- **Autocomplétion d’adresses** (Nominatim) pour le départ et l’arrivée
- **Persistance locale** : activités et tuiles sauvegardées/restaurées via localStorage
- **Loader non bloquant** (badge spinner en haut à droite) pendant les chargements/redessins
- **Boutons** : Connexion Strava, Stopper import, Réinitialiser (efface localStorage)
- **Vue par défaut** : zoom sur Lyon
- **Gestion robuste du quadrillage et de l’affichage** (pas de doublons, pas de flou, redessin correct après zoom/déplacement)

## Installation

1. **Cloner le dépôt**

```bash
git clone https://github.com/blamouche/tileshuntingrouting.git
cd tileshuntingrouting
```

2. **Installer les dépendances Node.js**

```bash
npm install
```

3. **Configurer les variables d’environnement**

Créer un fichier `.env` à la racine avec :

```
STRAVA_CLIENT_ID=VOTRE_CLIENT_ID
STRAVA_CLIENT_SECRET=VOTRE_CLIENT_SECRET
STRAVA_REDIRECT_URI=http://localhost:3000/strava/callback
SESSION_SECRET=un_secret_aleatoire
```

4. **Lancer le serveur**

```bash
node server.js
```

5. **Accéder à l’application**

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Utilisation

- **Connexion Strava** : Cliquez sur « Connexion Strava » pour importer vos activités.
- **Stopper l’import** : Arrête l’import en cours (utile si vous avez beaucoup d’activités).
- **Réinitialiser** : Efface toutes les activités et tuiles sauvegardées (localStorage).
- **Calcul d’itinéraire** : Saisissez un départ et une arrivée (autocomplétion), choisissez le mode, cliquez sur « Calculer l’itinéraire ».
- **Navigation sur la carte** : Le quadrillage et la coloration des tuiles s’adaptent dynamiquement au zoom/déplacement.

## Structure du projet

```
app/
  index.html         # Frontend principal (carte, UI)
  main.js            # Logique JS principale (Leaflet, Strava, OSRM, loader, etc.)
server.js            # Serveur Node.js/Express (auth Strava, API)
.env                 # Variables d’environnement (à créer)
package.json         # Dépendances et scripts
```

## Technologies utilisées

- JavaScript (frontend pur, sans framework)
- Node.js + Express (backend)
- Leaflet (cartographie)
- OSRM (calcul d’itinéraires)
- Nominatim (autocomplétion d’adresses)
- Strava API (OAuth2, activités)
- localStorage (persistance locale)

## Points d’attention / Limites

- L’application ne stocke rien côté serveur (tout est en localStorage).
- Le quadrillage est toujours carré et calé sur 1 mile x 1 mile.
- Le loader est non bloquant et disparaît automatiquement après chaque chargement/redessin.
- Après réinitialisation, il faut se reconnecter à Strava pour réimporter les activités.
- Le serveur doit tourner en local pour l’auth Strava (redirection sur localhost).

## Dépannage

- **Erreur d’auth Strava** : Vérifiez vos identifiants et l’URL de redirection dans `.env`.
- **Carte vide ou tuiles non coloriées** : Rechargez la page, vérifiez le localStorage, ou réinitialisez.
- **Loader bloqué** : Si le loader ne disparaît pas, vérifiez la console JS pour d’éventuelles erreurs.

## Licence

MIT