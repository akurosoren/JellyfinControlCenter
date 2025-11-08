# Jellyfin Control Center

Jellyfin Control Center (JCC) est une application web conçue pour vous donner un contrôle accru sur votre écosystème multimédia auto-hébergé. Elle s'intègre directement avec Jellyfin, Radarr et Sonarr pour fournir un tableau de bord centralisé et des outils d'automatisation puissants pour gérer votre bibliothèque.

L'objectif principal est de vous aider à gérer intelligemment votre espace de stockage en supprimant automatiquement le contenu ancien que vous ne regardez plus, tout en vous donnant un contrôle total sur ce qui est conservé.

## 🚀 Fonctionnalités

*   **Tableau de bord dynamique :** Obtenez un aperçu rapide de l'état de connexion de vos services (Jellyfin, Radarr, Sonarr) et découvrez les derniers films et épisodes ajoutés à votre bibliothèque.
*   **Automatisation du nettoyage :** Configurez des règles de rétention personnalisées. Par exemple, supprimez automatiquement les films après 7 jours ou les saisons de séries TV après 28 jours. L'application identifie les médias éligibles et vous permet de les supprimer en un seul clic.
*   **Gestion des exclusions :** Protégez vos films et séries préférés ! Tout élément ajouté à la liste d'exclusion sera ignoré par le processus d'automatisation, garantissant qu'il ne sera jamais supprimé.
*   **Contrôle total :** Avant chaque suppression, vous pouvez passer en revue la liste des éléments, désélectionner ceux que vous souhaitez conserver temporairement ou les ajouter à votre liste d'exclusion permanente.
*   **Interface sécurisée et locale :** L'application est protégée par un mot de passe que vous définissez lors de la première utilisation. Toutes vos informations de connexion et vos paramètres sont stockés **uniquement localement** dans le stockage de votre navigateur, garantissant ainsi votre confidentialité.

---

## 🛠️ Installation et Configuration

L'application est conçue pour être simple à déployer. Une fois déployée, suivez ces étapes pour la configurer :

### 1. Premier Lancement

Lorsque vous ouvrez l'application pour la première fois, elle vous demandera de créer un mot de passe. Ce mot de passe sécurise l'accès à vos paramètres et sera stocké localement dans votre navigateur.

### 2. Configuration des Services

Allez dans l'onglet **Paramètres** (icône d'engrenage).

*   **Jellyfin (Requis) :**
    1.  **URL du serveur :** Saisissez l'adresse complète de votre serveur Jellyfin (par ex., `http://192.168.1.10:8096`).
    2.  **Clé API :** Générez une clé API dans votre tableau de bord d'administration Jellyfin (`Tableau de bord > Avancé > Clés API`) et collez-la ici.
    3.  **Charger les utilisateurs :** Cliquez sur ce bouton. Si les informations sont correctes, une liste déroulante apparaîtra.
    4.  **Utilisateur à utiliser :** Sélectionnez le compte Jellyfin dont vous souhaitez analyser la bibliothèque.
*   **Radarr & Sonarr (Optionnel mais recommandé) :**
    - Ces services sont nécessaires pour que l'automatisation puisse **supprimer des fichiers**. Si vous ne les configurez pas, l'analyse fonctionnera, mais la suppression échouera.
    - Saisissez l'URL et la clé API pour chaque service que vous utilisez. Vous pouvez trouver la clé API dans la section `Settings > General` de Radarr/Sonarr.
    - Utilisez le bouton "Tester la connexion" pour vérifier que les informations sont correctes.
*   **Automation :**
    - Définissez le nombre de jours de rétention pour les films et les saisons de séries TV. Cette durée détermine si un média est considéré comme "ancien".

N'oubliez pas de cliquer sur **"Enregistrer les Paramètres"** !

---

## 📖 Guide d'utilisation

### Tableau de bord

C'est votre page d'accueil. Elle vous donne un aperçu rapide de l'état de vos services et des derniers ajouts à votre bibliothèque multimédia, vous permettant de voir si tout fonctionne correctement.

### Automation

C'est le cœur de l'application.

1.  **Lancer une analyse :** Cliquez sur le bouton "Analyser la bibliothèque Jellyfin". L'application interrogera votre serveur Jellyfin pour trouver tous les films et saisons qui dépassent la période de rétention que vous avez définie et qui ne figurent pas sur votre liste d'exclusion.
2.  **Examiner les résultats :** Les éléments trouvés sont affichés sous forme de cartes. Par défaut, ils sont tous sélectionnés pour la suppression.
3.  **Ajuster la sélection :**
    *   Cliquez sur une carte pour la **désélectionner**. Elle ne sera pas supprimée cette fois-ci mais pourra réapparaître lors d'une future analyse.
    *   Survolez une carte et cliquez sur l'**icône bouclier** pour ajouter l'élément à votre liste d'exclusion permanente.
4.  **Supprimer :** Une fois que vous êtes satisfait de votre sélection, cliquez sur le bouton "Supprimer de Radarr/Sonarr". Une confirmation vous sera demandée. Après confirmation, l'application contactera Radarr/Sonarr pour supprimer les fichiers correspondants de votre disque.
5.  **Vérifier les logs :** La colonne de droite affiche un journal en temps réel des opérations, vous informant des succès et des échecs.

### Exclusions

Cette page affiche tous les films et séries que vous avez marqués comme exclus. Ils sont protégés et n'apparaîtront jamais dans les résultats de l'analyse d'automatisation. Vous pouvez retirer un élément de cette liste à tout moment en cliquant sur le bouton "Retirer" qui apparaît au survol.
