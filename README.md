# Tiles Hunting Routing – Application Web

## Présentation

Tiles Hunting Routing est une application web JavaScript/Node.js permettant d’afficher une carte Leaflet avec un quadrillage « tiles hunting » (zoom 14, standard OSM, ~1 mile x 1 mile), d’importer et visualiser vos activités Strava, de colorier dynamiquement les tuiles traversées, de calculer des itinéraires (OSRM, profils vélo/voiture/piéton), d’utiliser l’autocomplétion d’adresses (Nominatim), et de garantir la persistance locale des données (localStorage). L’application gère également l’authentification Strava (OAuth2) et propose une expérience utilisateur fluide avec un loader non bloquant, ainsi que la gestion complète du quadrillage et des tuiles selon les standards VeloViewer/Statshunters.

## Fonctionnalités principales

- **Carte interactive Leaflet** avec quadrillage dynamique (zoom 14 OSM, ~1 mile x 1 mile, standard tiles hunting)
- **Coloration automatique** des tuiles traversées par vos activités Strava (en rouge)
- **Affichage de toutes les activités Strava** sur la carte (traces violettes)
- **Import Strava** sécurisé via OAuth2 (connexion, callback, récupération du token, import par lots)
- **Calcul d’itinéraires** (OSRM, profils vélo/voiture/piéton) avec affichage de la distance
- **L’itinéraire affiché suit toujours le réseau routier réel (OSRM)**
- **Autocomplétion d’adresses** (Nominatim) pour le départ et l’arrivée
- **Persistance locale** : activités et tuiles sauvegardées/restaurées via localStorage
- **Loader non bloquant** (badge spinner en haut à droite) pendant les chargements/redessins
- **Boutons** : Connexion Strava, Stopper import, Réinitialiser (efface localStorage), RAZ itinéraire
- **Vue par défaut** : zoom sur Lyon
- **Gestion robuste du quadrillage et de l’affichage** (pas de doublons, pas de flou, redessin correct après zoom/déplacement)
- **Découpage des tuiles conforme au standard OSM/Slippy Map (x, y, z)**

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
- **Calcul d’itinéraire** : Saisissez un départ et une arrivée (autocomplétion), choisissez le mode (vélo, voiture, piéton), cliquez sur « Calculer l’itinéraire ». L’itinéraire affiché suit toujours les routes réelles (OSRM).
- **Navigation sur la carte** : Le quadrillage et la coloration des tuiles s’adaptent dynamiquement au zoom/déplacement.

## Structure du projet

```
app/
  index.html         # Frontend principal (carte, UI)
  main.js            # Logique JS principale (Leaflet, Strava, BRouter, loader, etc.)
server.js            # Serveur Node.js/Express (auth Strava, API)
.env                 # Variables d’environnement (à créer)
package.json         # Dépendances et scripts
```

## Technologies utilisées

- JavaScript (frontend pur, sans framework)
- Node.js + Express (backend)
- Leaflet (cartographie)
- OSRM (calcul d’itinéraires vélo/voiture/piéton)
- Nominatim (autocomplétion d’adresses)
- Strava API (OAuth2, activités)
- localStorage (persistance locale)

## Points d’attention / Limites

- L’application ne stocke rien côté serveur (tout est en localStorage).
- Le quadrillage est toujours carré et calé sur le découpage OSM zoom 14 (standard tiles hunting).
- Le loader est non bloquant et disparaît automatiquement après chaque chargement/redessin.
- Après réinitialisation, il faut se reconnecter à Strava pour réimporter les activités.
- Le serveur doit tourner en local pour l’auth Strava (redirection sur localhost).
- Les alternatives d’itinéraire sur la grille ne sont plus affichées : seul l’itinéraire routier réel (OSRM) est visible.

## Dépannage

- **Erreur d’auth Strava** : Vérifiez vos identifiants et l’URL de redirection dans `.env`.
- **Carte vide ou tuiles non coloriées** : Rechargez la page, vérifiez le localStorage, ou réinitialisez.
- **Loader bloqué** : Si le loader ne disparaît pas, vérifiez la console JS pour d’éventuelles erreurs.

## Licence

MIT