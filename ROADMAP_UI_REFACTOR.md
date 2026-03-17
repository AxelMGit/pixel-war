# Roadmap — Refactor UI (Pixel War)

Dernière mise à jour : 2026-03-17

Objectif
- Rendre l'UI maintenable, testable et conforme aux principes SOLID, DRY, KISS.
- Réduire la duplication, clarifier les responsabilités, améliorer la robustesse et l'accessibilité.

Contexte
- Fichiers principaux analysés : `src/ui.js`, `src/dom.js`, `src/main.js`, `src/focus.js`.
- Problèmes identifiés : logique multi-responsabilités dans `src/ui.js`, duplications (modales, calcul coordonnées, sync couleur), validations côté UI qui devraient être côté blockchain, manque de garde null sur certains éléments DOM.

Critères d'acceptation
- Code découpé en modules cohérents (couleur, modales, contrôles, wallet) avec responsabilités uniques.
- Pas de duplication évidente (modales, calcul coordonnées, sync couleur).
- Validation financière / conversion wei gérée côté blockchain/main quand `web3` est disponible.
- Composants testables et aides utilitaires exportées (ex : `getCanvasCoordinates`, `removeDomModal`, `showToast`).
- A11y de base pour les modales (focus, roles/aria).

Priorités & étapes (ordre recommandé)

1) Quick wins (faible risque — 1 jour)
- Extraire `syncColor(value)` dans `src/ui/color.js` et remplacer handlers dupliqués dans `src/ui.js`.
- Remplacer la logique de calcul des coordonnées dans `onCanvasMove` par `getCanvasCoordinates` exporté depuis `src/dom.js`.
- Unifier suppression de modale : réutiliser `removeDomModal` (dans `src/dom.js`) et supprimer `removeModal` redondante.
- Tests manuels rapides + smoke test UI.

Livrables : 3 petits commits (color sync, coords, modal)

2) Stabilisation & sécurité (moyen risque — 1–2 jours)
- Ajouter null checks systématiques avant écriture dans le DOM (ex. `els.walletAddress && ...`).
- Remonter la conversion wei→ETH et la validation de montant vers `main.js`/`blockchain.js` (utiliser `web3.utils.fromWei`).
- Créer événements distincts si nécessaire (`ui:changeColor` vs `ui:buyPixel`) pour clarifier intent.

Livrables : patchs vers `main.js` et `ui` + tests manuels d’achat/surenchère

3) Refactor modulaire (plus gros — 2–3 jours)
- Split de `src/ui.js` en modules :
  - `src/ui/color.js` (gestion color pickers, recentColors, syncColor, render)
  - `src/ui/modals.js` (showConfirm, showPrompt, showInfo, removeModal, focus-trap basics)
  - `src/ui/controls.js` (zoom, togglePanel, canvas event wiring)
  - `src/ui/wallet.js` (connectWallet wrapper qui émet events mais délègue logique réelle au `blockchain`)
- Mettre à jour imports/exports et résoudre dépendances circulaires.

Livrables : nouveau dossier `src/ui/` avec fichiers, mise à jour `index.html` si nécessaire

4) Tests & A11y (1 jour)
- Ajouter tests unitaires pour utilitaires (`shorten`, `syncColor`, `getCanvasCoordinates`).
- Vérifier focus/aria pour modales, ajouter `role="dialog"`, `aria-modal`, focus trap minimal.

5) Améliorations optionnelles (1–2 jours)
- Centraliser toasts et historique de transactions dans un petit service UI.
- Ajouter un petit wrapper d’événements pour normaliser `window.dispatchEvent` vs un event bus local.
- Documenter les APIs UI (événements émis, handlers attendus).

Risques & mitigations
- Refactor modulaire peut introduire régressions : mitiger via petits commits, tests manuels ciblés et sauvegarde branch/PR.
- Déplacement des conversions wei→ETH nécessite accès à `web3` : gérer par API (ex : `blockchain.formatWei(wei)`).

Estimations totales
- Quick wins : 0.5–1 jour
- Stabilisation : 1–2 jours
- Refactor modulaire complet : 2–3 jours
- Tests + A11y : 1 jour
- Total (approx.) : 4.5–7 jours pour une refonte prudente

Tâches pratiques immédiates (patchs rapides que je peux appliquer maintenant)
- Implémenter `syncColor` et remplacer handlers dupliqués dans `src/ui.js`.
- Remplacer `onCanvasMove` par `getCanvasCoordinates` (exporter si nécessaire depuis `dom.js`).
- Remplacer `removeModal` par `removeDomModal` et nettoyer redondances.

Souhaitez-vous que j'applique automatiquement ces 3 patches rapides ?

---

Notes :
- Les fichiers mentionnés existent dans le repo analysé : `src/ui.js`, `src/dom.js`, `src/main.js`, `src/focus.js`.
- Pour la suite (split modulaire), je propose d'ouvrir une branche `refactor/ui-modular` et d'y appliquer les étapes incrémentales.
