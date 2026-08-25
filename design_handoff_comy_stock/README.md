# Handoff : page d'accueil Comy_stock

## Prompt à coller dans Claude Code

> Implémente la landing page `Comy_stock` d'après la maquette HTML fournie dans ce dossier (`Accueil Comy_stock.dc.html` + dossier `img/`).
>
> **Contexte** — Comy_stock est une application mobile de gestion commerciale (stock, ventes, caisse, comptabilité) pour les commerçants d'Afrique de l'Ouest. Cette page est le site vitrine : elle présente le produit, montre des captures de l'app et vend l'abonnement.
>
> **Stack attendue** — Next.js (App Router) + TypeScript + Tailwind CSS. Un seul écran (`/`), rendu statique, plus les routes vides `/a-propos`, `/confidentialite`, `/conditions`. Si le projet existe déjà, respecte ses conventions plutôt que celles-ci.
>
> **Fidélité** — haute fidélité : reprends exactement les couleurs, tailles de police, rayons, espacements et textes documentés ci-dessous. Le fichier HTML est une **référence de design**, pas du code à copier : recrée-le proprement en composants.
>
> **À livrer**
> 1. Les tokens de design (couleurs, typo, rayons) dans `tailwind.config.ts`.
> 2. Les composants : `Header`, `Hero`, `StatsBar`, `Features`, `ScreensCarousel`, `AiSection`, `Pricing`, `CtaBand`, `Footer`.
> 3. Un état client unique : la bascule mensuel/annuel des tarifs (`useState<'monthly'|'yearly'>`), seul composant en `"use client"`.
> 4. Responsive mobile-first, testé à 375, 768, 1280 px.
> 5. Accessibilité : contraste AA, focus visible, `alt` sur toutes les images, carrousel navigable au clavier.
> 6. SEO : métadonnées `title`/`description`/OpenGraph en français, `lang="fr"`.
>
> Ne rajoute aucune section, aucun texte et aucune couleur qui ne soit pas dans la spec.

## Fidélité
Haute fidélité (hifi). Valeurs exactes ci-dessous.

## Design tokens

### Couleurs
| Rôle | Hex |
|---|---|
| Fond page | `#071411` |
| Surface carte | `#0d1f1a` |
| Surface carte (dégradé haut) | `#10241e` |
| Surface carte mise en avant | `#123028` → `#0d1f1a` |
| Vert accent | `#2fa85c` |
| Vert dégradé bouton | `#1c8a45` → `#2fa85c` |
| Vert profond (halos) | `#197a3e`, `#14663a`, `#0d4426` |
| Or accent | `#d4af37` |
| Or clair (titres dégradés) | `#e8c46a`, `#f0d68a` |
| Texte principal | `#f2f8f5` / `#ffffff` |
| Texte secondaire | `#9ab5ab` |
| Texte tertiaire | `#7d968d`, `#8ba79d` |
| Texte sur fond clair | `#072e17` |
| Bordures | `rgba(47,168,92,0.2)` — 0.35 au survol, 0.6 sur la carte Premium |

### Typographie
- Titres : **Poppins** 600/700, `letter-spacing: -0.02em`.
- Texte : **DM Sans** 400/500.
- H1 : `clamp(38px, 6.2vw, 66px)`, `line-height: 1.03`.
- H2 : `clamp(28px, 4vw, 44px)`, poids 600.
- H3 (cartes) : 20px / 1.3.
- Corps : 15–17px, `line-height: 1.6–1.65`.
- Sur-titres de section : 13px, majuscules, `letter-spacing: 0.16em`, couleur `#2fa85c`.
- Prix : Poppins 700, `clamp(30px, 3.4vw, 40px)`.

### Rayons et ombres
- Boutons 14px · pilules 999px · cartes 22–24px · grands blocs 30px.
- Ombre bouton principal : `0 20px 45px -18px rgba(28,138,69,0.8)`.
- Ombre carte Premium : `0 30px 70px -35px rgba(47,168,92,0.8)`.
- Ombre visuel : `0 30px 60px -30px rgba(0,0,0,0.9)`.

### Grille
Conteneur `max-width: 1180px`, padding latéral 22px. Sections : `padding-block: clamp(56px, 8vw, 100px)`. Grilles en `repeat(auto-fit, minmax(260–320px, 1fr))`, gap 18–20px.

## Sections

### 1. Header (sticky)
Fond `rgba(7,20,17,0.75)` + `backdrop-filter: blur(18px)`, bordure basse `rgba(47,168,92,0.16)`. À gauche : `img/mark.png` (36×36) + « Comy_stock » (underscore en `#d4af37`). Au centre-droit : Fonctionnalités, L'app, Comy IA, Tarifs (14.5px, `#9ab5ab` → blanc au survol). À droite : bouton pilule « Télécharger » (dégradé vert).

### 2. Hero
Fond : deux `radial-gradient` verts sur `#071411`. Deux colonnes.
- Badge pilule « NOUVEAU · Comy IA » lié vers `#ai`.
- H1 : « Pilotez votre boutique depuis votre mobile » — « mobile » en dégradé or (`#e8c46a` → `#f0d68a`, `background-clip: text`).
- Paragraphe : « Comy Stock centralise ventes, stocks, employés et comptabilité en une seule app. Fini les outils coûteux et les pertes. »
- CTA : « Play Store » (plein) + « App Store — bientôt » (désactivé, bordure).
- Trois puces or : « Votre téléphone, votre caisse », « Zéro vol, zéro perte », « 24h/24 ».
- Visuel : `img/hero-phone.png`, largeur max 380px, halo radial flouté derrière, animation `floaty` (translateY 0 → -14px, 7s, ease-in-out, infinie, désactivée en `prefers-reduced-motion`).

### 3. Bandeau de chiffres
Quatre cellules séparées par 1px de `rgba(47,168,92,0.18)`, dans un bloc à bordure et rayon 22px : **2023** Année de création · **10** Boutiques par compte Pro · **0 F** Pour commencer · **CI** Conçue à Abidjan.

### 4. Fonctionnalités (`#features`)
Sur-titre « Fonctionnalités », H2 « Ce que Comy Stock résout pour vous », intro « Moins de matériel, moins de coûts… ». Trois cartes numérotées 01/02/03 (pastille 46×46, rayon 14px) :
1. Votre téléphone remplace l'ordinateur — « Plus besoin d'un ordinateur coûteux. Gérez stocks, ventes, employés et rapports directement depuis votre poche. »
2. Scanner intégré, zéro machine — « Comy Stock remplace votre machine de scan. Scannez les codes-barres et enregistrez vos ventes instantanément, sans achat de matériel. »
3. Reçu numérique, partagé en un clic — « Visualisez et partagez le reçu de chaque vente par WhatsApp, SMS ou email en quelques secondes. »

### 5. Carrousel d'écrans (`#screens`)
Fond en dégradé vertical `#071411 → #0b2019 → #071411`. H2 « Chaque écran fait gagner du temps ». Défilement horizontal `scroll-snap-type: x mandatory`, cartes `min(78vw, 300px)`, rayon 24px, bordure verte.
- `img/dashboard.png` — **Dashboard** — « Chiffre d'affaires, ventes et bénéfices du jour »
- `img/caisse.png` — **Caisse** — « Scan, panier, encaissement en quelques secondes »
- `img/boutiques.png` — **Mes boutiques** — « Jusqu'à 10 points de vente sur un même compte »

### 6. Comy IA (`#ai`)
Bloc unique, rayon 30px, `radial-gradient` vert en haut à droite. Sur-titre « Comy IA », H2 « Votre assistant financier personnel », paragraphe « Chattez avec Comy IA, analysez votre rentabilité et vos dépenses, et prenez les meilleures décisions pour votre boutique. », quatre pilules (Rentabilité, Dépenses, Trésorerie, Profit net), bouton blanc « Voir nos formules d'abonnement » → `#pricing`. Visuel `img/compta.png` (max 300px).

### 7. Tarifs (`#pricing`)
Bascule pilule **Mensuel / Annuel · -10%** (onglet actif : fond blanc, texte `#072e17`). Trois cartes.

| | Free | Premium (mis en avant, badge « POPULAIRE ») | Pro |
|---|---|---|---|
| Mensuel | Gratuit | 10 000 F/mois | 20 000 F/mois |
| Annuel | Gratuit | 108 000 F/an — soit 9 000 F/mois | 216 000 F/an — soit 18 000 F/mois |
| Sous-titre mensuel | Pour démarrer sans risque | ou 108 000 FCFA/an (-10%) | ou 216 000 FCFA/an (-10%) |
| CTA | Commencer gratuitement | S'abonner | S'abonner |

Free : 1 boutique · Espace de vente · 10 produits maximum · 15 messages/mois avec Comy IA · Analyse financière par l'IA · Espace caisse · Clients illimités · 5 approvisionnements · Historique des mouvements.
Premium : 3 boutiques · Produits illimités · 15 messages/jour avec Comy IA · Analyse financière par l'IA · Approvisionnements illimités · Fournisseurs illimités · Utilisateurs illimités · Rapports.
Pro : 10 boutiques · Produits illimités · 50 messages/jour avec Comy IA · Utilisateurs illimités · Rapports · Espace comptabilité · États financiers.

Chaque ligne est précédée d'une puce 6×6 `#d4af37`.

### 8. Bandeau final
Bloc centré, rayon 30px, halo vert. H2 « Prêt à piloter votre boutique ? », sous-titre « Téléchargez Comy Stock et commencez gratuitement dès aujourd'hui. », bouton blanc « Play Store » + bouton bordé « Nous écrire sur WhatsApp ».

### 9. Footer
Quatre colonnes : lockup `img/logo.png` (200px) + « Chaque entrepreneur mérite des outils puissants, quelle que soit la taille de sa boutique. » · Application (Fonctionnalités, L'app, Tarifs) · Ressources (À propos, Contact WhatsApp) · Légal (Confidentialité, Conditions d'utilisation). Ligne de bas de page : « © 2026 Comy Stock — Eso-dev, Abidjan. Tous droits réservés. »

## Interactions
- Ancres avec défilement fluide (`scroll-behavior: smooth`) et `scroll-margin-top` égal à la hauteur du header.
- Survol des cartes : bordure de `rgba(47,168,92,0.2)` à `0.55`.
- Survol des boutons pleins : `filter: brightness(1.08)` ; boutons blancs : `brightness(0.94)`.
- Bascule tarifs : change prix, unité et sous-titre, sans changer la liste de fonctionnalités.
- Carrousel : glissement tactile + `scroll-snap`, plus des flèches précédent/suivant en desktop (à ajouter).

## État
Un seul : `billing: 'monthly' | 'yearly'` (défaut `monthly`). Aucune donnée distante.

## Liens à confirmer par le client
- Play Store : le lien actuel pointe vers `com.djeli.app` — remplacer par l'identifiant Comy_stock.
- Confidentialité / Conditions : pointent vers `sites.djeli.pro` — remplacer.
- WhatsApp : `https://wa.me/2250508294939`.
- App Store : pas encore de lien (bouton désactivé).

## Assets
Dossier `img/` :
- `logo.png` — lockup complet, fond détouré (transparent).
- `mark.png` — symbole seul, carré.
- `hero-phone.png` — photo du téléphone en main.
- `dashboard.png`, `caisse.png`, `boutiques.png`, `compta.png` — captures de l'app recadrées et recolorées dans la palette verte.

À prévoir côté client : `og-image.jpg` (1200×630) et des favicons dérivés de `mark.png`.

## Fichiers de référence
- `Accueil Comy_stock.dc.html` — la maquette complète (structure, styles, textes).
- `img/` — tous les visuels utilisés.
