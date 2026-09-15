# Multi Arena

Jeu d'arène pour apprendre les tables de multiplication de 0 à 10.
React 19 + Vite + Tailwind 4, compilé en **un seul fichier HTML**, installable en PWA, fonctionne hors ligne.

---

## ⚠️ Publier sur GitHub Pages (le piège de la page blanche)

La page blanche vient presque toujours de la même erreur : avoir poussé **le dossier source** au lieu du dossier compilé.
Le fichier `index.html` des sources contient `<script src="/src/main.tsx">`, que le navigateur ne sait pas lire — d'où l'écran vide.

**À pousser sur GitHub : le contenu du dossier `dist/`, et lui seul.**

```
votre-depot/
├── index.html              ← celui de dist/, pas celui de la racine des sources
├── manifest.webmanifest
├── sw.js
├── .nojekyll
└── icons/
```

1. Déposer ces fichiers à la racine du dépôt (glisser-déposer via **Add file → Upload files** convient).
2. **Settings → Pages** → *Source* : **Deploy from a branch** → branche `main` → dossier `/ (root)` → **Save**.
3. Attendre une minute. L'adresse est `https://VOTRE-PSEUDO.github.io/NOM-DU-DEPOT/`.

Si la page reste blanche : ouvrir l'adresse et vérifier que `index.html` fait bien ~320 ko (le fichier compilé) et non ~500 octets (le fichier source).
Le `.nojekyll` est indispensable, sinon GitHub ignore certains fichiers.

Installation : Android/Chrome propose l'installation automatiquement ; iPhone → Partager → *Sur l'écran d'accueil*.

## Modifier et recompiler

```bash
npm install
npx vite build     # régénère dist/
```

Après chaque mise en ligne, incrémenter `multiarena-r1` dans `public/sw.js` (`r2`, `r3`…), sinon les appareils déjà installés gardent l'ancienne version en cache.

---

## Le parcours

0. **Tutoriel** — quatre étapes au premier lancement. Le reste de l'écran est assombri, l'élément expliqué est entouré d'un liseré doré, et tous les autres boutons sont bloqués tant que l'étape n'est pas passée.
1. **Écran titre** — une seule action : taper pour commencer.
2. **Prénom et âge** — bandeau « Bienvenue ! » incliné, curseur d'âge de **7 à 90 ans**.
3. **Choix du héros** — écran plein : grille à gauche, héros en grand à droite, coins qui s'arrondissent à la sélection, fiche avec réplique, jauges et avantage.
4. **Tutoriel** — quatre panneaux brefs sur le menu, passables à tout moment, rejouables depuis l'Atelier.
5. **Menu** — d'abord **Solo / À deux**, puis la liste : Aventure en tête, les modes spéciaux dessous, la Boutique en bas. Le héros occupe la colonne de droite, les réglages sont une petite roue en bas à droite.
6. **Rythme** — quatre cartes de cadence.
7. **Mondes** — bannières en bas, niveaux du monde sélectionné au-dessus avec leur nom.
8. **Chargement** — 4 secondes par défaut, avec une astuce de calcul. Durée réglable dans l'Atelier, jusqu'à 0 pour la supprimer.
9. **Partie** — grosse barre à paliers en dégradé, chronomètre global animé, jauge par question, bonus en gros à l'écran.
10. **Résultat**, puis **cérémonie** à la fin d'un monde.

## La table de 0

Elle ne fait plus partie du parcours : aucun niveau ne la travaille et elle n'apparaît pas dans le tableau de progression, qui va de 1 à 10. Elle revient en **question piège**, environ une fois sur douze, sans être comptée dans la mémoire du joueur — juste pour vérifier que le réflexe « par 0, c'est toujours 0 » tient.

## Le rythme, à la place des cylindrées

Les rythmes ne s'ouvrent qu'en avançant réellement dans l'aventure : **Entraînement** demande les 6 mondes terminés, **Réflexe** 48 ⭐, **Miroir** les 72 ⭐. Quand un rythme est verrouillé, taper dessus affiche exactement ce qui manque.

| Rythme | Temps par question | Rubis |
|---|---|---|
| 🧠 Réflexion — le temps de poser le calcul | 12 s | × 1 |
| 🎯 Entraînement — le rythme des révisions | 8 s | × 1,5 |
| ⚡ Réflexe — la réponse vient toute seule | 5 s | × 2,2 |
| 🪞 Miroir — le résultat est donné, trouve le calcul | 7 s | × 2,6 |

Trois barres verticales indiquent l'exigence, comme des barres de signal.

## Rubis et déblocages

Les rubis se gagnent à chaque niveau, selon les étoiles, la difficulté et le rythme choisi.

**Un monde ouvert le reste définitivement.** L'achat est enregistré dans `ownedWorlds` ; dépenser ses rubis ailleurs ne referme jamais un monde déjà payé. Même principe pour les héros et les modes.

- **Mondes** : Vallée (offert), Camp 12 💎, Forêt 30 💎, Cimes 55 💎, Donjon 85 💎, Arène 130 💎.
- **Héros** : Mage 20 💎, Barbare 40 💎, Dragonnet 70 💎, Princesse 100 💎, Golem 140 💎, Roi 200 💎.
- **Modes** : Sprint offert, Chasse aux pièges 25 💎, Miroir 50 💎, Mort subite 80 💎, Ascension 120 💎, Duel offert.

Chaque déblocage déclenche un panneau de félicitations. Taper sur un élément verrouillé le fait trembler et affiche ce qui manque.

## Les héros et leurs avantages

| Héros | Avantage |
|---|---|
| Chevalier, Princesse | La 1re erreur d'une partie est pardonnée |
| Archère, Golem | +30 % de temps par question |
| Mage | Une astuce affichée à chaque question |
| Barbare | Les séries rapportent le double de points |
| Dragonnet, Roi | +50 % de rubis gagnés |

## Les niveaux gardiens

Le quatrième niveau de chaque monde est un **gardien** : cadre doré, halo lumineux, bandeau « ⚔️ GARDIEN » et bas de vignette brun doré au lieu du bleu. Impossible de le confondre avec un niveau ordinaire.

---

## Renvoyer l'habillage dans le jeu

Ce qui est déposé dans l'atelier vit dans le navigateur de l'appareil. Pour que le jeu l'utilise **partout**,
l'onglet **Publier** de l'atelier propose deux voies :

- **Télécharger `pack.json`**, puis le déposer à la racine du dépôt GitHub. Le jeu le charge au démarrage.
- **Publier directement sur GitHub**, avec un jeton personnel *fine-grained* limité à ce dépôt et à
  *Contents : read and write*. Le jeton reste dans le navigateur et ne part que vers GitHub. Le fichier
  `pack.json` est écrit ou mis à jour, et GitHub Pages se rafraîchit en une à deux minutes.

Ce qui est déposé localement reste prioritaire sur le pack publié : on peut donc tester une image sur son
appareil avant de la publier pour tout le monde.

## L'Atelier — page séparée du jeu

L'atelier n'est **plus accessible depuis l'application**. C'est une page à part du site :

```
https://VOTRE-PSEUDO.github.io/NOM-DU-DEPOT/atelier.html
```

Aucun bouton du jeu n'y mène. Mettez l'adresse en favori sur votre propre appareil.

- **Images** — un emplacement par fond, monde, niveau, héros (vignette carrée **et** portrait en pied vertical) et mode. **Glisser-déposer** une image dessus, ou taper pour la choisir. Elle est recadrée au format attendu et rangée dans l'appareil (IndexedDB), donc disponible hors ligne. La croix rouge remet le dessin d'origine.
- **Sons** — un fichier audio par événement : appui, bonne réponse, erreur, étoile, victoire, défaite, rubis, déblocage. Sans fichier, le son de synthèse intégré est utilisé.
- **Jeu** — activer ou désactiver chaque jeu, tout débloquer d'un coup (jeux, héros, mondes, rythmes), ajouter 100 💎, rejouer le tutoriel, régler la **durée des chargements** de 0 à 10 s.
- **Sons & musiques** — un fichier par événement, plus deux boucles de musique (menus et parties) activables dans les réglages du jeu.

## Comment le jeu fait apprendre

- Chaque multiplication est suivie séparément, niveau 0 à 6. `3 × 7` et `7 × 3` comptent pour un seul fait.
- Répétition espacée : juste **et** rapide (moins de 4 s) fait monter d'un cran et repousse la révision — 10 min, 1 h, 1 jour, 3 jours, 1 semaine, 3 semaines. Une erreur redescend de deux crans.
- Les questions sont mélangées entre les tables plutôt que récitées dans l'ordre.
- Les mauvaises réponses proposées sont les erreurs classiques : table voisine, résultat décalé de `a` ou de `b`, addition à la place du produit.
- Après une erreur, l'astuce de calcul correspondante s'affiche.
- Les écrans de chargement et la cérémonie de fin de monde servent de rappels de méthode.
- La carte des 121 multiplications, dans les réglages, montre d'un coup d'œil ce qui est solide.

## Où toucher quoi

| Pour changer… | Aller dans |
|---|---|
| Couleurs, biseaux, animations | `src/styles.css` |
| Thèmes | tableau `THEMES` de `src/engine.ts` |
| Mondes, niveaux, tables travaillées | tableau `WORLDS` |
| Héros, avantages, prix | tableau `HEROES` |
| Modes spéciaux, prix | tableau `MODES` |
| Rythmes | tableau `CADENCES` |
| Astuces de chargement | tableau `TIPS` |
| Emplacements d'images et de sons | `SLOTS` et `SOUND_SLOTS` |
