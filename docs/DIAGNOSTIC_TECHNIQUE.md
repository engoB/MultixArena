# Diagnostic technique — Multi X Arena 4.6.11

## Conclusion

La 4.6.11 isole le cadrage de la colonne de sélection des héros dans `.hero-thumb`. Les portraits sont désormais découpés par leur carte et utilisent des zooms locaux, sans modifier le grand visuel du héros ni les badges en partie. Le changement de monde par swipe ne joue plus `F.page()`.

Le volume appliqué aux fichiers d'effets reposait sur `HTMLMediaElement.volume`. Certaines versions mobiles de WebKit, notamment dans une PWA iOS, peuvent ignorer ce gain. La 4.6.10 a introduit un nœud `GainNode` Web Audio et l'arrêt des médias en arrière-plan ; ces protections restent actives.

La musique n'était par ailleurs arrêtée par aucun événement de cycle de vie. Tous les éléments audio créés par le jeu sont désormais suivis : `visibilitychange`, `pagehide` et `freeze` les mettent immédiatement en pause. Au retour via `pageshow` ou lorsque le document redevient visible, seule la musique qui était active reprend ; les effets interrompus restent arrêtés.

Les correctifs 4.6.9 du mode duo, du curseur mobile et du portrait Princesse restent intégrés et couverts par le vérificateur de livraison.

Le portrait carré `heroFace_5.webp` de la Princesse était ensuite agrandi et décalé par une règle CSS ajoutée tardivement. Ce second cadrage a été retiré : le fichier déjà recadré est affiché tel quel.

La seconde source de fragilité était le préchargement simultané des 95 images, toutes conservées en mémoire. Sur WebKit/iOS, la mémoire décodée peut dépasser largement le poids des fichiers et provoquer un rechargement brutal de la PWA. La 4.6.6 ne bloque plus le lancement sur tout le pack : elle charge les visuels critiques, puis les autres par petits lots inactifs sans conserver les objets `Image`.

## Correctifs P0 intégrés

| Sujet | Cause | Correction | Effet attendu |
|---|---|---|---|
| Écran bleu duo | variable de minuteur masquant les réglages dans les deux décomptes | noms de minuteurs distincts et signatures interdites par le vérificateur | Bataille et Boss arrivent sur la première question |
| Vignettes du choix des héros | transformations globales et débordement non masqué | cadrage limité à `.hero-thumb` avec découpe et zooms locaux | portraits homogènes dans la colonne gauche |
| Son au swipe des mondes | appel explicite à `F.page()` après le geste | navigation directe sans effet sonore | swipe silencieux |
| Volume des clics iOS | `HTMLMediaElement.volume` ignoré par certaines PWA WebKit | effets routés par un `GainNode`, clic `tap` atténué à 35 % de son gain déjà réglé | curseur réellement appliqué et clic discret |
| Musique en arrière-plan | aucune écoute du cycle de vie de la page | pause sur `visibilitychange`, `pagehide` et `freeze`, reprise sélective sur retour visible | silence immédiat lorsque l'app est masquée ou fermée |
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
