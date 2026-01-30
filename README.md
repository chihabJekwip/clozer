# Clozer - Application de Gestion de Tournées Commerciales

Application web mobile-first pour optimiser et gérer les tournées de prospection commerciale.

## Fonctionnalités

### 1. Gestion des Clients
- Import de fichiers Excel (.xlsx) avec les colonnes : Civilité, Nom, Prénom, Domicile, Portable M., Portable Mme, Adresse, CP, Ville
- Géocodage automatique des adresses (via Nominatim/OpenStreetMap)
- Visualisation sur carte

### 2. Planification de Tournées
- Création de tournées avec sélection des clients
- Optimisation automatique de l'itinéraire (algorithme TSP : Nearest Neighbor + 2-opt)
- Calcul des distances et temps de trajet (via OSRM)
- Point de départ : Angoulême (configurable)

### 3. Suivi en Temps Réel
- Interface mobile-first pour le commercial
- Vue carte + liste des visites
- Marquage des visites : Terminé / Absent
- Progression en temps réel

### 4. Gestion des Absences
- 3 options quand un client est absent :
  - Revenir après le prochain client
  - Revenir sur le chemin du retour
  - Reporter à un autre jour
- Recalcul automatique de l'itinéraire

### 5. Création de Devis
- Formulaire de prise de besoin mobile
- Ajout de lignes de produits/services
- Calcul automatique HT/TVA/TTC
- Zone de signature tactile
- Sauvegarde en brouillon ou validation

## Installation

```bash
# Cloner et accéder au dossier
cd clozer-app

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# L'application sera accessible sur http://localhost:3000
```

## Utilisation

### Étape 1 : Importer les clients
1. Cliquez sur "Importer des clients"
2. Sélectionnez votre fichier Excel
3. Les clients sont automatiquement importés

### Étape 2 : Géolocaliser les adresses
1. Cliquez sur "Géolocaliser"
2. L'application convertit les adresses en coordonnées GPS
3. Attendez que toutes les adresses soient géocodées (1 req/sec pour Nominatim)

### Étape 3 : Créer une tournée
1. Cliquez sur "Nouvelle tournée"
2. Nommez la tournée et choisissez la date
3. Sélectionnez les clients à visiter
4. Cliquez sur "Créer"

### Étape 4 : Optimiser et démarrer
1. Ouvrez la tournée créée
2. Cliquez sur le bouton "Optimiser" (icône rotation)
3. L'itinéraire optimal est calculé
4. Commencez vos visites !

### Pendant la tournée
- **Visite terminée** : Cliquez sur "Visite terminée" (vert)
- **Client absent** : Cliquez sur "Absent" (orange) et choisissez quand repasser
- **Navigation GPS** : Cliquez sur le bouton navigation pour ouvrir Google Maps
- **Créer un devis** : Cliquez sur l'icône document pour créer un devis

## Stack Technique

- **Frontend** : Next.js 14 + React 18 + TypeScript
- **UI** : Tailwind CSS + shadcn/ui components
- **Cartographie** : Leaflet + React-Leaflet + OpenStreetMap
- **Géocodage** : Nominatim (gratuit)
- **Routing** : OSRM (gratuit)
- **Import Excel** : xlsx library
- **Stockage** : localStorage (côté client)

## Structure du Projet

```
clozer-app/
├── src/
│   ├── app/                    # Pages Next.js
│   │   ├── page.tsx           # Dashboard principal
│   │   └── tour/[id]/page.tsx # Page de tournée
│   ├── components/
│   │   ├── map/               # Composants carte
│   │   ├── tour/              # Composants tournée
│   │   ├── quote/             # Formulaire devis
│   │   └── ui/                # Composants UI réutilisables
│   ├── lib/
│   │   ├── storage.ts         # Stockage localStorage
│   │   ├── geocoding.ts       # Service Nominatim
│   │   ├── routing.ts         # Service OSRM
│   │   ├── optimization.ts    # Algorithme TSP
│   │   └── excel-import.ts    # Import Excel
│   └── types/                 # Types TypeScript
└── public/
    └── manifest.json          # PWA manifest
```

## APIs Utilisées (Gratuites)

| Service | Usage | Limite |
|---------|-------|--------|
| Nominatim | Géocodage adresses | 1 requête/seconde |
| OSRM | Calcul d'itinéraires | Illimité (serveur public) |
| OpenStreetMap | Tuiles de carte | Fair use |

## Configuration

Le point de départ par défaut est Angoulême. Pour le modifier, changez les paramètres dans les Settings de l'application ou modifiez `ANGOULEME_COORDINATES` dans `src/lib/geocoding.ts`.

## Responsive Design

L'application est conçue mobile-first :
- Écrans mobiles : Vue carte compacte + liste scrollable
- Tablettes : Vue split carte/liste
- Desktop : Interface complète avec carte plus grande

## Licence

Projet privé - Usage interne uniquement.
