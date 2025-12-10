-- Seed: Données de test pour l'application Maintenance

-- Fonction pour générer des UUIDs (si nécessaire)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MONTEURS
INSERT INTO monteurs (id, nom, prenom, telephone, email, adresse, "dateEmbauche", "numeroIdentification", actif, "createdAt", "updatedAt") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Dupont', 'Jean', '06 12 34 56 78', 'jean.dupont@maintenance.com', '123 Rue de la Paix, 75001 Paris', '2023-01-15', 'MON-001', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440002', 'Martin', 'Sophie', '06 23 45 67 89', 'sophie.martin@maintenance.com', '456 Avenue des Champs, 75008 Paris', '2023-03-20', 'MON-002', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. USERS
-- Mots de passe hashés avec bcrypt (10 rounds):
-- Admin123! => $2a$10$ALfBlnmNdLbxDB4H3Wp4qOSt3IK0DgyG8SpVSZttbjyMjBSuiD8hq
-- Superviseur123! => $2a$10$NKP/vuO7AeGbIiikc3Qceej5l4SGVJuRFdhoykVv5Kbssmywcb/Hu
-- Monteur123! => $2a$10$oJlzxEbks9i/JDDd0mT2C.tAyfpSD0NoRjAJFYLDGswoUx3iJ8Ajm

INSERT INTO users (id, email, password, role, "monteurId", "createdAt", "updatedAt") VALUES
('650e8400-e29b-41d4-a716-446655440001', 'admin@maintenance.com', '$2a$10$ALfBlnmNdLbxDB4H3Wp4qOSt3IK0DgyG8SpVSZttbjyMjBSuiD8hq', 'ADMIN', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('650e8400-e29b-41d4-a716-446655440002', 'superviseur@maintenance.com', '$2a$10$NKP/vuO7AeGbIiikc3Qceej5l4SGVJuRFdhoykVv5Kbssmywcb/Hu', 'SUPERVISEUR', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('650e8400-e29b-41d4-a716-446655440003', 'jean.dupont@maintenance.com', '$2a$10$oJlzxEbks9i/JDDd0mT2C.tAyfpSD0NoRjAJFYLDGswoUx3iJ8Ajm', 'MONTEUR', '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('650e8400-e29b-41d4-a716-446655440004', 'sophie.martin@maintenance.com', '$2a$10$oJlzxEbks9i/JDDd0mT2C.tAyfpSD0NoRjAJFYLDGswoUx3iJ8Ajm', 'MONTEUR', '550e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. CHANTIERS
INSERT INTO chantiers (id, nom, adresse, client, reference, "dateDebut", "dateFin", description, actif, "createdAt", "updatedAt") VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Rénovation Centre Commercial', '789 Boulevard du Commerce, 92100 Boulogne', 'Société Immobilière ABC', 'CHANT-2024-001', '2024-01-10', '2024-06-30', 'Rénovation complète du système électrique et de climatisation', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('750e8400-e29b-41d4-a716-446655440002', 'Installation Usine Lyon', '321 Zone Industrielle, 69007 Lyon', 'Industrie XYZ', 'CHANT-2024-002', '2024-02-01', NULL, 'Installation de nouvelles lignes de production', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('750e8400-e29b-41d4-a716-446655440003', 'Maintenance Hôtel Paris', '555 Rue de Rivoli, 75001 Paris', 'Hôtels Prestige', 'CHANT-2024-003', '2024-03-15', NULL, 'Maintenance préventive annuelle des équipements', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. FEUILLES DE TRAVAIL
INSERT INTO feuilles_travail (id, "monteurId", "chantierId", "dateTravail", "dateSaisie", "heureDebut", "heureFin", "heuresTotales", "descriptionTravail", statut, "valideParId", "createdAt", "updatedAt") VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '2024-03-01', CURRENT_TIMESTAMP, '08:00', '17:00', 9, 'Installation des câblages électriques au 2ème étage. Travaux conformes aux normes.', 'VALIDE', '650e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '2024-03-05', CURRENT_TIMESTAMP, '07:30', '16:30', 9, 'Mise en place des systèmes de ventilation et tests de fonctionnement.', 'SOUMIS', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', '2024-03-10', CURRENT_TIMESTAMP, '09:00', '18:00', 9, 'Maintenance des équipements de climatisation et remplacement des filtres.', 'BROUILLON', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. FRAIS
INSERT INTO frais (id, "feuilleId", "typeFrais", montant, description, "fichierProuve", "createdAt") VALUES
('950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'TRANSPORT', 25.50, 'Déplacement Paris - Boulogne (A/R)', NULL, CURRENT_TIMESTAMP),
('950e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', 'REPAS', 15.00, 'Déjeuner sur site', NULL, CURRENT_TIMESTAMP),
('950e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440002', 'TRANSPORT', 120.00, 'Déplacement Paris - Lyon (train)', NULL, CURRENT_TIMESTAMP),
('950e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440002', 'MATERIEL', 85.50, 'Achat de connecteurs spéciaux', NULL, CURRENT_TIMESTAMP),
('950e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440002', 'REPAS', 18.50, 'Déjeuner', NULL, CURRENT_TIMESTAMP),
('950e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440003', 'TRANSPORT', 12.00, 'Métro', NULL, CURRENT_TIMESTAMP);

-- IMPORTANT: Les mots de passe ci-dessus sont des placeholders.
-- Vous devez les remplacer par des vrais hashes bcrypt.
-- Pour générer un hash bcrypt en Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('Admin123!', 10);
