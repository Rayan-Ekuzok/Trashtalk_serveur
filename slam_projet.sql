-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 05 juin 2026 à 13:29
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `slam_projet`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin`
--

CREATE TABLE `admin` (
  `Id_utilisateur` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `admin`
--

INSERT INTO `admin` (`Id_utilisateur`) VALUES
(1);

-- --------------------------------------------------------

--
-- Structure de la table `centre_traitement`
--

CREATE TABLE `centre_traitement` (
  `Id_centre` int(11) NOT NULL,
  `adresse` varchar(50) DEFAULT NULL,
  `ville` varchar(50) DEFAULT NULL,
  `code_postal` varchar(50) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `centre_traitement`
--

INSERT INTO `centre_traitement` (`Id_centre`, `adresse`, `ville`, `code_postal`, `latitude`, `longitude`) VALUES
(1, '1 rue A', 'Marseille', '13001', 43.2965000, 5.3698000),
(2, '2 rue B', 'Marseille', '13002', 43.3000000, 5.3700000),
(3, '3 rue C', 'Aix', '13100', 43.5297000, 5.4474000);

-- --------------------------------------------------------

--
-- Structure de la table `conducteur`
--

CREATE TABLE `conducteur` (
  `Id_utilisateur` int(11) NOT NULL,
  `numéro_license` varchar(50) DEFAULT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `prenom` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `conducteur`
--

INSERT INTO `conducteur` (`Id_utilisateur`, `numéro_license`, `nom`, `prenom`) VALUES
(3, 'LIC123', 'Martin', 'Paul'),
(4, 'LIC124', 'Durand', 'Julie'),
(7, 'LIC125', 'Bernard', 'Luc'),
(10, 'LIC126', 'Petit', 'Emma');

-- --------------------------------------------------------

--
-- Structure de la table `contenant`
--

CREATE TABLE `contenant` (
  `Id_contenant` int(11) NOT NULL,
  `capacite_kg` varchar(50) DEFAULT NULL,
  `poids_actuel_kg` decimal(15,3) DEFAULT NULL,
  `scelle` tinyint(1) DEFAULT NULL,
  `date_creation` datetime DEFAULT NULL,
  `Id_type_dechet` int(11) NOT NULL,
  `Id_emplacement` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `contenant`
--

INSERT INTO `contenant` (`Id_contenant`, `capacite_kg`, `poids_actuel_kg`, `scelle`, `date_creation`, `Id_type_dechet`, `Id_emplacement`) VALUES
(1, '100', 50.000, 0, '2026-04-27 16:10:37', 1, 1),
(2, '120', 80.000, 1, '2026-04-27 16:10:37', 2, 1),
(3, '100', 30.000, 0, '2026-04-27 16:10:37', 3, 2),
(4, '150', 90.000, 1, '2026-04-27 16:10:37', 4, 2),
(5, '200', 200.000, 0, '2026-04-27 16:10:37', 5, 3),
(6, '100', 100.000, 1, '2026-04-27 16:10:37', 1, 3),
(7, '120', 80.000, 0, '2026-04-27 16:10:37', 2, 4),
(8, '100', 50.000, 1, '2026-04-27 16:10:37', 3, 4),
(9, '150', 100.000, 0, '2026-04-27 16:10:37', 4, 5),
(10, '200', 160.000, 1, '2026-04-27 16:10:37', 5, 5),
(11, '100', 50.000, 0, '2026-04-27 16:10:37', 1, 6),
(12, '120', 90.000, 1, '2026-04-27 16:10:37', 2, 6),
(13, '100', 20.000, 0, '2026-04-27 16:10:37', 3, 7),
(14, '150', 120.000, 1, '2026-04-27 16:10:37', 4, 7),
(15, '200', 180.000, 0, '2026-04-27 16:10:37', 5, 8),
(16, '100', 60.000, 1, '2026-04-27 16:10:37', 1, 8),
(17, '120', 70.000, 0, '2026-04-27 16:10:37', 2, 9),
(18, '100', 30.000, 1, '2026-04-27 16:10:37', 3, 9),
(19, '150', 110.000, 0, '2026-04-27 16:10:37', 4, 10),
(20, '200', 180.000, 1, '2026-04-27 16:10:37', 5, 10);

-- --------------------------------------------------------

--
-- Structure de la table `emplacement`
--

CREATE TABLE `emplacement` (
  `Id_emplacement` int(11) NOT NULL,
  `code_postal` varchar(5) DEFAULT NULL,
  `libelle` varchar(50) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `emplacement`
--

INSERT INTO `emplacement` (`Id_emplacement`, `code_postal`, `libelle`, `latitude`, `longitude`) VALUES
(1, '13001', 'Vieux-Port', 43.2965000, 5.3698000),
(2, '13002', 'Panier', 43.3000000, 5.3700000),
(3, '13003', 'Belle de Mai', 43.3100000, 5.3800000),
(4, '13004', 'Longchamp', 43.3050000, 5.3900000),
(5, '13005', 'Baille', 43.2900000, 5.4000000),
(6, '13006', 'Castellane', 43.2850000, 5.3800000),
(7, '13007', 'Endoume', 43.2800000, 5.3600000),
(8, '13008', 'Prado', 43.2700000, 5.3700000),
(9, '13009', 'Mazargues', 43.2500000, 5.4000000),
(10, '13010', 'Timone', 43.2800000, 5.4100000);

-- --------------------------------------------------------

--
-- Structure de la table `lot`
--

CREATE TABLE `lot` (
  `Id_contenant` int(11) NOT NULL,
  `Id_lot` varchar(50) NOT NULL,
  `poids_total_kg` varchar(50) DEFAULT NULL,
  `Id_transfert` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `lot`
--

INSERT INTO `lot` (`Id_contenant`, `Id_lot`, `poids_total_kg`, `Id_transfert`) VALUES
(1, 'LOT1', '50', 1),
(2, 'LOT2', '80', 1),
(3, 'LOT3', '30', 2),
(4, 'LOT4', '90', 2),
(5, 'LOT5', '150', 3),
(6, 'LOT6', '70', 3),
(7, 'LOT7', '60', 4),
(8, 'LOT8', '40', 4);

-- --------------------------------------------------------

--
-- Structure de la table `signalement`
--

CREATE TABLE `signalement` (
  `Id_signalement` int(11) NOT NULL,
  `text` varchar(2000) DEFAULT NULL,
  `evalutaion` int(11) DEFAULT NULL,
  `date_` datetime DEFAULT NULL,
  `Id_utilisateur` int(11) NOT NULL,
  `Id_emplacement` int(11) NOT NULL,
  `Id_utilisateur_1` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `signalement`
--

INSERT INTO `signalement` (`Id_signalement`, `text`, `evalutaion`, `date_`, `Id_utilisateur`, `Id_emplacement`, `Id_utilisateur_1`) VALUES
(1, 'Poubelle pleine', 1, '2026-04-01 08:00:00', 1, 1, 1),
(2, 'Débordement déchets', NULL, '2026-04-02 09:00:00', 1, 2, 2),
(3, 'Odeur forte', NULL, '2026-04-03 10:00:00', 1, 3, 5),
(4, 'Couvercle cassé', 0, '2026-04-04 11:00:00', 1, 4, 6),
(5, 'Déchets au sol', 0, '2026-04-05 12:00:00', 1, 5, 8),
(6, 'Poubelle brûlée', NULL, '2026-04-06 13:00:00', 1, 6, 9),
(7, 'Tri non respecté', 1, '2026-04-07 14:00:00', 1, 7, 1),
(8, 'Poubelle renversée', 0, '2026-04-08 15:00:00', 1, 8, 2),
(9, 'Présence rats', 1, '2026-04-09 16:00:00', 1, 9, 5),
(10, 'Débordement', 1, '2026-04-10 17:00:00', 1, 10, 6),
(11, 'azeaez', 1, '2026-05-27 13:48:58', 1, 4, 1),
(12, 'aze', NULL, '2026-06-01 19:45:59', 1, 6, 1),
(13, 'ezrzerzer', NULL, '2026-06-01 19:46:13', 1, 1, 1),
(14, 'azeazeaze', NULL, '2026-06-01 20:30:46', 1, 10, 1),
(15, 'azeaze', NULL, '2026-06-02 01:31:15', 1, 4, 2);

-- --------------------------------------------------------

--
-- Structure de la table `transfert`
--

CREATE TABLE `transfert` (
  `Id_transfert` int(11) NOT NULL,
  `date_demande` datetime DEFAULT NULL,
  `date_debut` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `Id_utilisateur` int(11) NOT NULL,
  `matricule` int(11) NOT NULL,
  `Id_centre` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `transfert`
--

INSERT INTO `transfert` (`Id_transfert`, `date_demande`, `date_debut`, `date_fin`, `Id_utilisateur`, `matricule`, `Id_centre`) VALUES
(1, '2024-12-30 00:00:00', '2025-01-01 00:00:00', NULL, 3, 1, 1),
(2, '2024-12-31 00:00:00', '2025-01-02 00:00:00', '2025-01-10 00:00:00', 4, 2, 2),
(3, '2025-01-01 00:00:00', '2025-01-03 00:00:00', NULL, 7, 3, 1),
(4, '2025-01-02 00:00:00', '2025-01-04 00:00:00', NULL, 10, 4, 3),
(5, '2026-05-20 08:00:00', '2026-05-22 07:00:00', NULL, 3, 1, 1),
(6, '2026-05-18 09:30:00', '2026-05-19 06:00:00', NULL, 3, 2, 2),
(7, '2026-05-24 10:00:00', '2026-05-25 08:30:00', NULL, 3, 3, 3),
(8, '2026-05-15 14:00:00', '2026-05-16 07:00:00', NULL, 3, 4, 1),
(9, '2026-05-21 11:00:00', '2026-05-23 09:00:00', NULL, 3, 1, 2),
(10, '2026-05-25 08:00:00', '2026-05-28 07:00:00', NULL, 3, 2, 3),
(11, '2026-05-25 09:00:00', '2026-05-29 08:00:00', NULL, 3, 3, 1),
(12, '2026-05-26 10:00:00', '2026-06-01 06:30:00', NULL, 3, 4, 2),
(13, '2026-05-26 11:00:00', '2026-06-03 07:00:00', NULL, 3, 1, 3),
(14, '2026-05-24 15:00:00', '2026-06-05 09:00:00', NULL, 3, 2, 1),
(15, '2026-05-23 16:00:00', '2026-06-08 07:30:00', NULL, 3, 3, 2),
(16, '2026-05-26 07:00:00', '2026-06-10 06:00:00', NULL, 3, 4, 3),
(17, '2026-04-01 08:00:00', '2026-04-02 07:00:00', '2026-04-02 17:00:00', 3, 1, 1),
(18, '2026-04-05 09:00:00', '2026-04-06 06:30:00', '2026-04-06 15:30:00', 3, 2, 2),
(19, '2026-04-10 10:00:00', '2026-04-11 08:00:00', '2026-04-11 18:00:00', 3, 3, 3),
(20, '2026-04-15 07:30:00', '2026-04-16 07:00:00', '2026-04-16 16:00:00', 3, 4, 1),
(21, '2026-04-20 11:00:00', '2026-04-21 09:00:00', '2026-04-21 19:00:00', 3, 1, 2),
(22, '2026-04-28 08:00:00', '2026-04-29 07:30:00', '2026-04-29 17:30:00', 3, 2, 3),
(23, '2026-05-03 09:00:00', '2026-05-04 06:00:00', '2026-05-04 14:00:00', 3, 3, 1),
(24, '2026-05-08 10:00:00', '2026-05-09 08:00:00', '2026-05-09 18:30:00', 3, 4, 2),
(25, '2026-05-12 07:00:00', '2026-05-13 06:30:00', '2026-05-13 16:30:00', 3, 1, 3),
(26, '2026-05-17 09:30:00', '2026-05-18 07:00:00', '2026-05-18 15:00:00', 3, 2, 1);

-- --------------------------------------------------------

--
-- Structure de la table `type_dechet`
--

CREATE TABLE `type_dechet` (
  `Id_type_dechet` int(11) NOT NULL,
  `libelle` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `type_dechet`
--

INSERT INTO `type_dechet` (`Id_type_dechet`, `libelle`) VALUES
(1, 'Verre'),
(2, 'Plastique'),
(3, 'Papier'),
(4, 'Organique'),
(5, 'Métal');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

CREATE TABLE `utilisateur` (
  `Id_utilisateur` int(11) NOT NULL,
  `icon` varchar(500) DEFAULT NULL,
  `login` varchar(50) DEFAULT NULL,
  `password` varchar(256) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `nb_avertissement` varchar(50) DEFAULT NULL,
  `est_bannie` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`Id_utilisateur`, `icon`, `login`, `password`, `type`, `nb_avertissement`, `est_bannie`) VALUES
(1, 'icon1.png', 'Joe', '7f58dc944448c64064a32ba56972792c03cfdebe327230d9442c9bd0f0810b37', NULL, '0', 0),
(2, 'icon2.png', 'Nathan', '9388bc4322591544c640f2a1611a2e4587d5333fedd01919b6bbef567e483a66', NULL, '1', 0),
(3, 'icon3.png', 'Simon', 'cc3a0558080d80d855e6ed2bec9c4cd76207a711c9890462754a6a3fdd028adb', NULL, '0', 0),
(4, 'icon4.png', 'user4', 'a9af9e458de716885185b7c6bdf93506ee6091bed92201f0e882c5e040ece911', NULL, '0', 0),
(5, 'icon5.png', 'user5', 'a9af9e458de716885185b7c6bdf93506ee6091bed92201f0e882c5e040ece911', NULL, '0', 0),
(6, 'icon6.png', 'user6', 'a9af9e458de716885185b7c6bdf93506ee6091bed92201f0e882c5e040ece911', NULL, '1', 0),
(7, 'icon7.png', 'user7', 'a9af9e458de716885185b7c6bdf93506ee6091bed92201f0e882c5e040ece911', NULL, '0', 0),
(8, 'icon8.png', 'user8', 'a9af9e458de716885185b7c6bdf93506ee6091bed92201f0e882c5e040ece911', NULL, '1', 0),
(9, 'icon9.png', 'user9', 'a9af9e458de716885185b7c6bdf93506ee6091bed92201f0e882c5e040ece911', NULL, '0', 0),
(10, 'icon10.png', 'user10', 'a9af9e458de716885185b7c6bdf93506ee6091bed92201f0e882c5e040ece911', NULL, '0', 0),
(11, 'https://cdn-icons-png.flaticon.com/512/149/149071.png', 'Joe', '7f58dc944448c64064a32ba56972792c03cfdebe327230d9442c9bd0f0810b37', NULL, '0', 0),
(12, 'https://cdn-icons-png.flaticon.com/512/149/149071.png', 'Joe', '7f58dc944448c64064a32ba56972792c03cfdebe327230d9442c9bd0f0810b37', NULL, '0', 0);

--
-- Déclencheurs `utilisateur`
--
DELIMITER $$
CREATE TRIGGER `trg_auto_ban_utilisateur` BEFORE UPDATE ON `utilisateur` FOR EACH ROW BEGIN
    IF CAST(NEW.nb_avertissement AS SIGNED) >= 5 THEN
        SET NEW.est_bannie = TRUE;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `vehicule`
--

CREATE TABLE `vehicule` (
  `matricule` int(11) NOT NULL,
  `type_vehicule` varchar(50) DEFAULT NULL,
  `capacite_kg` varchar(50) DEFAULT NULL,
  `capacite_m2` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `vehicule`
--

INSERT INTO `vehicule` (`matricule`, `type_vehicule`, `capacite_kg`, `capacite_m2`) VALUES
(1, 'Camion', '10000', '20'),
(2, 'Camion', '12000', '25'),
(3, 'Fourgon', '5000', '10'),
(4, 'Camion', '15000', '30');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`Id_utilisateur`);

--
-- Index pour la table `centre_traitement`
--
ALTER TABLE `centre_traitement`
  ADD PRIMARY KEY (`Id_centre`);

--
-- Index pour la table `conducteur`
--
ALTER TABLE `conducteur`
  ADD PRIMARY KEY (`Id_utilisateur`);

--
-- Index pour la table `contenant`
--
ALTER TABLE `contenant`
  ADD PRIMARY KEY (`Id_contenant`),
  ADD KEY `Id_type_dechet` (`Id_type_dechet`),
  ADD KEY `Id_emplacement` (`Id_emplacement`);

--
-- Index pour la table `emplacement`
--
ALTER TABLE `emplacement`
  ADD PRIMARY KEY (`Id_emplacement`);

--
-- Index pour la table `lot`
--
ALTER TABLE `lot`
  ADD PRIMARY KEY (`Id_contenant`,`Id_lot`),
  ADD KEY `Id_transfert` (`Id_transfert`);

--
-- Index pour la table `signalement`
--
ALTER TABLE `signalement`
  ADD PRIMARY KEY (`Id_signalement`),
  ADD KEY `Id_utilisateur` (`Id_utilisateur`),
  ADD KEY `Id_emplacement` (`Id_emplacement`),
  ADD KEY `Id_utilisateur_1` (`Id_utilisateur_1`);

--
-- Index pour la table `transfert`
--
ALTER TABLE `transfert`
  ADD PRIMARY KEY (`Id_transfert`),
  ADD KEY `Id_utilisateur` (`Id_utilisateur`),
  ADD KEY `matricule` (`matricule`),
  ADD KEY `Id_centre` (`Id_centre`);

--
-- Index pour la table `type_dechet`
--
ALTER TABLE `type_dechet`
  ADD PRIMARY KEY (`Id_type_dechet`);

--
-- Index pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  ADD PRIMARY KEY (`Id_utilisateur`);

--
-- Index pour la table `vehicule`
--
ALTER TABLE `vehicule`
  ADD PRIMARY KEY (`matricule`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `centre_traitement`
--
ALTER TABLE `centre_traitement`
  MODIFY `Id_centre` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `contenant`
--
ALTER TABLE `contenant`
  MODIFY `Id_contenant` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `emplacement`
--
ALTER TABLE `emplacement`
  MODIFY `Id_emplacement` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `signalement`
--
ALTER TABLE `signalement`
  MODIFY `Id_signalement` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `transfert`
--
ALTER TABLE `transfert`
  MODIFY `Id_transfert` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT pour la table `type_dechet`
--
ALTER TABLE `type_dechet`
  MODIFY `Id_type_dechet` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  MODIFY `Id_utilisateur` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `vehicule`
--
ALTER TABLE `vehicule`
  MODIFY `matricule` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`Id_utilisateur`) REFERENCES `utilisateur` (`Id_utilisateur`);

--
-- Contraintes pour la table `conducteur`
--
ALTER TABLE `conducteur`
  ADD CONSTRAINT `conducteur_ibfk_1` FOREIGN KEY (`Id_utilisateur`) REFERENCES `utilisateur` (`Id_utilisateur`);

--
-- Contraintes pour la table `contenant`
--
ALTER TABLE `contenant`
  ADD CONSTRAINT `contenant_ibfk_1` FOREIGN KEY (`Id_type_dechet`) REFERENCES `type_dechet` (`Id_type_dechet`),
  ADD CONSTRAINT `contenant_ibfk_2` FOREIGN KEY (`Id_emplacement`) REFERENCES `emplacement` (`Id_emplacement`);

--
-- Contraintes pour la table `lot`
--
ALTER TABLE `lot`
  ADD CONSTRAINT `lot_ibfk_1` FOREIGN KEY (`Id_contenant`) REFERENCES `contenant` (`Id_contenant`),
  ADD CONSTRAINT `lot_ibfk_2` FOREIGN KEY (`Id_transfert`) REFERENCES `transfert` (`Id_transfert`);

--
-- Contraintes pour la table `signalement`
--
ALTER TABLE `signalement`
  ADD CONSTRAINT `signalement_ibfk_1` FOREIGN KEY (`Id_utilisateur`) REFERENCES `admin` (`Id_utilisateur`),
  ADD CONSTRAINT `signalement_ibfk_2` FOREIGN KEY (`Id_emplacement`) REFERENCES `emplacement` (`Id_emplacement`),
  ADD CONSTRAINT `signalement_ibfk_3` FOREIGN KEY (`Id_utilisateur_1`) REFERENCES `utilisateur` (`Id_utilisateur`);

--
-- Contraintes pour la table `transfert`
--
ALTER TABLE `transfert`
  ADD CONSTRAINT `transfert_ibfk_1` FOREIGN KEY (`Id_utilisateur`) REFERENCES `conducteur` (`Id_utilisateur`),
  ADD CONSTRAINT `transfert_ibfk_2` FOREIGN KEY (`matricule`) REFERENCES `vehicule` (`matricule`),
  ADD CONSTRAINT `transfert_ibfk_3` FOREIGN KEY (`Id_centre`) REFERENCES `centre_traitement` (`Id_centre`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
