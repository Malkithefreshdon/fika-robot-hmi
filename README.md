# Fika Robot — HMI

Interface homme-machine (Nuxt 4) pour le système collaboratif de service de café développé avec deux robots UR10/UR10e. Le projet correspond au plan de développement dans [`docs/`](./docs).

Deux écrans, une seule app :

- **Écran client (kiosque)** — parcours de commande chaleureux et simple, pensé tablette d'abord, lisible aussi sur ordinateur. Traduit en suédois (par défaut), anglais, espagnol, allemand et français.
- **Mode technicien (`/dev`)** — tableau de bord, commandes manuelles, réglages fins et journaux pour calibrer précisément la séquence robot/vision/communication. Interface en anglais uniquement (pas de i18n côté technicien).

## Les deux scénarios de service

Le client choisit son verre (taille + lait optionnel) puis son expérience de préparation :

- **Précision sur balance** (*Default*, recommandé) — le Robot 1 pèse la cafetière puis la dégage, le Robot 2 dépose le verre sur la balance, et le Robot 1 verse en boucle fermée jusqu'à la masse cible. Précis, le verre est posé seul sur la balance pendant le versement.
- **Versement Stylé** (*Stylish*) — les deux robots saisissent leur élément simultanément, le Robot 2 maintient le verre en suspension pendant que le Robot 1 verse une durée fixe (chronométrée, non pesée). Plus rapide et spectaculaire, présenté à l'utilisateur avec un avertissement commercial indiquant que le résultat peut être légèrement moins précis.

Le Robot A gère toujours la cafetière (pesée/versement/retour), le Robot B gère toujours le verre du client (prise/pose sur balance/maintien/service).

## Pourquoi ces choix

- **Nuxt 4** en mode SPA (`ssr: false`) : c'est une app kiosque locale (tablette à côté des robots), pas un site public — pas besoin de SSR, et ça évite les problèmes d'hydratation avec le WebSocket / localStorage.
- **Pinia** pour l'état partagé (commande en cours, états robots, paramètres).
- **Tailwind CSS v4** avec des tokens de design "café chaleureux" définis dans `app/assets/css/main.css`.
- **@nuxtjs/i18n** pour l'écran client uniquement — fichiers de traduction dans `i18n/locales/*.json`, suédois par défaut, pas de persistance inter-session volontairement (un kiosque public ne doit pas hériter de la langue du client précédent).
- **Couche superviseur interchangeable** (`app/services/backend`) : une simulation (`mockBackend.ts`) tourne dès aujourd'hui dans le navigateur avec la même interface que le futur pont WebSocket (`liveBackend.ts`) vers le contrôleur superviseur Python (WP3 du plan projet). Voir le protocole documenté en tête de `liveBackend.ts`.

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:3000` pour l'écran client, et `http://localhost:3000/dev` pour le mode technicien (code par défaut : `1234`, voir `.env.example`).

## Variables d'environnement

Copier `.env.example` en `.env` pour ajuster :

- `NUXT_PUBLIC_BACKEND_MODE` — `mock` (par défaut) ou `live` pour se connecter au vrai superviseur Python.
- `NUXT_PUBLIC_BACKEND_WS_URL` — adresse WebSocket du superviseur en mode `live`.
- `NUXT_PUBLIC_DEV_PIN` — code d'accès au mode technicien.

## Structure

```
app/
  assets/css/       tokens de design (palette café chaleureux)
  components/kiosk/ composants de l'écran client (dont LanguageSwitcher)
  components/dev/   composants du mode technicien
  composables/       useDevAuth (verrou PIN du mode technicien)
  layouts/           kiosk.vue (client) / dev.vue (technicien)
  pages/             /, /order, /order/status, /dev, /dev/tuning, /dev/logs
  services/backend/  contrat superviseur + implémentations mock/live
  stores/            system (robots, params, logs) et order (commande en cours, mode)
  types/             vocabulaire partagé (commandes, états robots, scénarios, paramètres)
i18n/
  i18n.config.ts     config vue-i18n (suédois par défaut, repli anglais)
  locales/*.json     traductions écran client (sv, en, es, de, fr)
docs/                plan de projet original
```

## Brancher le vrai superviseur Python

1. Passer `NUXT_PUBLIC_BACKEND_MODE=live` et pointer `NUXT_PUBLIC_BACKEND_WS_URL` vers le service.
2. Implémenter côté Python le protocole JSON décrit dans `app/services/backend/liveBackend.ts` — vocabulaire commandes/états dans `app/types/index.ts` : `PICK_GLASS`, `WEIGH_POT`, `PLACE_ON_SCALE`, `HOLD_GLASS`, `POUR_COFFEE`, `POUR_MILK`, `DELIVER`, `HOME` / `READY`, `BUSY`, `DONE`, `FAULT`.

Aucune autre modification de l'HMI n'est nécessaire — pages et stores ne connaissent que l'interface `SupervisorBackend`, pas son implémentation.
