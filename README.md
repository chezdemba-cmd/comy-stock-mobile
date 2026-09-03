# Comy Stock

Application mobile de gestion de boutique construite avec Expo SDK 57, Expo Router, React Native et Supabase.

## Fonctionnalités

- authentification et onboarding d'entreprise ;
- gestion des boutiques, produits et niveaux de stock ;
- caisse, paiements, reçus et dettes clients ;
- fournisseurs, approvisionnements et dépenses ;
- rapports, gestion d'équipe et limites d'abonnement ;
- file de synchronisation hors ligne ;
- assistant Comy IA via une Supabase Edge Function.
- équipe multi-boutiques avec rôles modifiables par le propriétaire ;
- notifications internes de chaque mouvement de stock aux propriétaires et comptables responsables.

## Prérequis

- Node.js 22 ;
- npm ;
- un projet Supabase ;
- un compte Expo/EAS pour produire les builds natifs.

## Installation

```bash
npm install
cp .env.example .env
npm start
```

Sous Windows PowerShell, utiliser `Copy-Item .env.example .env`. Renseigner ensuite :

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SUPPORT_WHATSAPP_NUMBER=223XXXXXXXX
```

Les variables `EXPO_PUBLIC_*` sont intégrées à l'application cliente. Ne jamais y placer une clé Supabase `service_role` ni un autre secret serveur.

Un bundle de production refuse désormais de démarrer si l'URL ou la clé anonyme Supabase manque. Le client factice n'est autorisé qu'en développement local.

Le numéro de support doit utiliser le format international malien sans `+` ni espaces. Remplacer `223XXXXXXXX` par le véritable numéro de l'entreprise.

## Base de données Supabase

Les migrations versionnées sont dans `supabase/migrations`. Pour un nouveau projet, les appliquer dans l'ordre, de `0001` à `0018`, avec la CLI Supabase ou le tableau de bord SQL.

Avant toute mise en production, vérifier que les migrations distantes sont à jour et tester les politiques RLS avec chaque rôle applicatif.

## Comy IA

La fonction se trouve dans `supabase/functions/comy-ai`. Son environnement serveur doit contenir :

- `ANTHROPIC_API_KEY` ;
- `ANTHROPIC_WORKSPACE_ID` pour une clé Anthropic liée à une identité ;
- `SUPABASE_URL` ;
- `SUPABASE_ANON_KEY`.

Déploiement avec la CLI Supabase :

```bash
supabase functions deploy comy-ai
```

La clé Anthropic doit rester exclusivement dans les secrets de l'Edge Function.

## Contrôles locaux

```bash
npm run lint
npm run typecheck
npm run test
npm run build:web
npm run check
```

`npm run check` exécute ESLint, TypeScript, les tests Vitest et Expo Doctor. La CI exécute les mêmes contrôles à chaque push et pull request.

## Builds EAS

Les profils sont définis dans `eas.json` :

```bash
eas build --profile preview --platform android
eas build --profile production --platform android
eas build --profile production --platform ios
```

Le profil `preview` produit un APK interne. Le profil `production` produit un Android App Bundle ; le format iOS est géré par EAS.

Sentry est initialisé par `EXPO_PUBLIC_SENTRY_DSN`. L'upload automatique est actuellement désactivé dans les profils EAS : configurer les identifiants Sentry et réactiver l'upload des source maps avant une publication publique.

Pour activer les source maps, définir `SENTRY_ORG` et `SENTRY_PROJECT` dans l'environnement de build, créer `SENTRY_AUTH_TOKEN` comme secret EAS, puis retirer `SENTRY_DISABLE_AUTO_UPLOAD` du profil `production`. Sans ces variables, Metro utilise automatiquement sa configuration Expo standard et n'affiche pas d'avertissement Sentry trompeur.

## Publication

Avant soumission aux stores :

- tester caméra, scan, PDF, partage, liens d'authentification et mode hors ligne sur appareils réels ;
- ajouter une politique de confidentialité, des conditions d'utilisation et un parcours de suppression de compte ;
- valider les sauvegardes Supabase et la supervision Sentry ;
- préparer les captures, descriptions et coordonnées de support des stores.
