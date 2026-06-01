-- Alltrexx Live — database initialisatie
-- Wordt automatisch uitgevoerd bij eerste opstart van de MySQL container

CREATE DATABASE IF NOT EXISTS alltrexx
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE alltrexx;

-- Spring Boot / Hibernate maakt de tabellen zelf aan via ddl-auto=update
-- Dit script maakt alleen de database aan en voegt demo-data toe

-- Demo boten (worden aangemaakt bij eerste positie-opslag)
-- Voeg hier je eigen boten toe met hun MMSI nummer:
-- INSERT INTO trackers (naam, type, externe_id, omschrijving, actief, aangemaakt)
-- VALUES ('Mijn Boot', 'BOAT', '244123456', 'Zeiljacht', true, NOW());
