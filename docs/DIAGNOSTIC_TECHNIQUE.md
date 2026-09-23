# Diagnostic technique — Multi X Arena 4.6.9

## Conclusion

Le fond bleu au lancement des deux modes duo venait d'une zone morte temporelle JavaScript (TDZ) dans chaque décompte. Une variable locale `e`, déclarée pour stocker le minuteur, masquait la prop `e` qui porte les réglages. À la fin du décompte, l'accès à `e.settings` levait `ReferenceError: Cannot access 'e' before initialization` et React démontait l'écran. La 4.6.9 donne un nom distinct aux deux minuteurs et le contrôle de livraison refuse désormais les anciennes signatures fautives.

Le curseur des effets utilisait seulement `onChange`, moins fiable pendant un glissement sur certaines versions mobiles de WebKit. Il utilise maintenant l'événement natif continu `input`, applique le gain immédiatement et enregistre la valeur dans la sauvegarde locale. Le gain propre au son `tap` est aussi séparé des sons de jeu afin que les boutons Options et Retour restent modérés.

Le portrait carré `heroFace_5.webp` de la Princesse était ensuite agrandi et décalé par une règle CSS ajoutée tardivement. Ce second cadrage a été retiré : le fichier déjà recadré est affiché tel quel.

La seconde source de fragilité était le préchargement simultané des 95 images, toutes conservées en mémoire. Sur WebKit/iOS, la mémoire décodée peut dépasser largement le poids des fichiers et provoquer un rechargement brutal de la PWA. La 4.6.6 ne bloque plus le lancement sur tout le pack : elle charge les visuels critiques, puis les autres par petits lots inactifs sans conserver les objets `Image`.

## Correctifs P0 intégrés

| Sujet | Cause | Correction | Effet attendu |
|---|---|---|---|
| Écran bleu duo | variable de minuteur masquant les réglages dans les deux décomptes | noms de minuteurs distincts et signatures interdites par le vérificateur | Bataille et Boss arrivent sur la première question |
| Volume des clics | événement de curseur mobile fragile et gain `tap` commun aux autres effets | mise à jour sur `input`, gain du clic dédié, défaut à 40 % | réglage immédiat et clics moins forts |
| Vignette Princesse | zoom et translation CSS appliqués à un portrait déjà recadré | suppression de la transformation pour l'héroïne 5 | visage net et centré |
| Multitouch duo | anti-double-tap global à 320 ms + `click` tardif | suppression du filtre global, `pointerdown`, `touch-action:none` sur les zones de jeu | deux réponses réellement simultanées |
| Temps morts | 900 à 1 450 ms après une erreur | 450 ms en Bataille, maximum 480 ms dans Bats le boss | rythme continu et lisible |
| Crash iOS/PWA | décodage et rétention des 95 images au démarrage | noyau visuel prioritaire, lots de 8 au repos, références libérées | pic mémoire réduit |
| Mise à jour en pleine partie | rechargement automatique sur `controllerchange` | nouvelle version activée sans recharger l'écran courant | aucune partie interrompue |
| Cache médias | cache recréé à chaque version et plafond de 90 | cache média conservé et plafond porté à 128 | moins de vignettes vides après mise à jour |
| Progression des rythmes | étoiles indexées seulement par identifiant de niveau | étoiles, mondes terminés et mondes achetés séparés par rythme | Entraînement/Réflexe repartent au niveau 1 |

## Mesures de la livraison

- `index.html` : environ 396 Kio, 115 Kio compressé gzip.
- `atelier.html` : environ 310 Kio, 90 Kio gzip.
- Pack actif : 95 images, dont les 24 vignettes de niveau utilisent leurs WebP 640 × 640.
- Dossier `assets` complet : environ 40 Mio, mais le navigateur ne télécharge pas toutes les variantes PNG/JPG/WebP ; `pack.json` choisit les formats actifs.
- Musiques : environ 2,9 Mio.

## Points encore recommandés

### P1 — source maintenable

La branche publiée contient essentiellement les bundles compilés. C'est le plus gros risque de régression restant. Il faut remettre dans le dépôt la source TypeScript correspondant exactement à la version publiée, puis déployer automatiquement `dist/` avec GitHub Actions. Cela rendra les tests unitaires de progression et les tests tactiles reproductibles.

### P1 — budget mémoire explicite

Ajouter un test de build qui refuse :

- une image de niveau active de plus de 160 Kio ;
- un portrait héros actif de plus de 900 Kio ;
- un fond actif de plus de 1,5 Mio ;
- un pack actif dépassant 16 Mio.

### P1 — test réel iOS

Automatiser un parcours de 20 parties consécutives : lancer, répondre, réessayer, changer de héros, ouvrir Bataille, ouvrir Bats le boss, mettre l'app en arrière-plan, revenir. Mesurer mémoire et absence de rechargement avec Safari Web Inspector sur un iPad et un iPhone réels.

### P2 — rendu

- Décoder les grands fonds à la taille effectivement affichée avec `createImageBitmap` lorsque WebKit le permet.
- Mettre les animations décoratives en pause quand `document.visibilityState !== 'visible'`.
- Limiter les halos animés à `transform` et `opacity`, sans filtre plein écran.

## Vérification locale

```bash
node scripts/verify-release.mjs
```

Ce contrôle vérifie la cohérence des versions, la syntaxe du bundle, les marqueurs des correctifs critiques, l'orientation et l'existence de chaque asset référencé par le pack.
