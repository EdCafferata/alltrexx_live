DROP TABLE IF EXISTS SCHIP;
CREATE TABLE SCHIP (aisnummer INT, klasse VARCHAR,  naamschip VARCHAR, naamschipper VARCHAR, scheepstype VARCHAR, swrating VARCHAR);
INSERT INTO SCHIP VALUES ('244620218', 'Toerklasse', 'Piper Rising', 'Ed Cafferata',  'One Off Oyster', '85');
INSERT INTO SCHIP VALUES ('244620217', 'Toerklasse', 'Van Lint', 'Marc Van Lint', 'Dehler 34 NEW', '75');
INSERT INTO SCHIP VALUES ('244620215', 'Toerklasse', 'Piper 3', 'Ed',  'Swift', '85');
INSERT INTO SCHIP VALUES ('244620214', 'ORC', 'Van Lint  4', 'Marc', 'is Echt', '75');
INSERT INTO SCHIP VALUES ('244620213', 'Toerklasse', '44 Piper Rising', 'John',  'Veel', '95');
INSERT INTO SCHIP VALUES ('244620212', 'ORC', 'Van Lint 6', 'Doe', 'Leuker', '75');
INSERT INTO SCHIP VALUES ('244620211', 'Toerklasse', 'Piper 1 Rising', 'Iets',  'iOS', '85');
INSERT INTO SCHIP VALUES ('244620210', 'Two handed', '9 Van Lint', 'Anders', 'ook', '75');
INSERT INTO SCHIP VALUES ('244620209', 'Toerklasse', 'Piper Rising 44', 'Met Je',  'trouwens :-)', '55');
INSERT INTO SCHIP VALUES ('244620208', 'Wedstrijdklasse', 'Van Lint 44', 'Tijd', 'laatste...', '35');

DROP TABLE IF EXISTS AISDATA;
CREATE TABLE AISDATA (aisnummer INT, course INT, heading INT, invoerder VARCHAR, lat DOUBLE PRECISION, lon DOUBLE PRECISION,  schipid VARCHAR, speed INT, status INT, timestamp VARCHAR);
INSERT INTO AISDATA VALUES ('244620218', '133', '146', 'Ed', '52.458826', '4.561208', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620217', '133', '146', 'Ed', '52.490902', '4.547640', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620216', '133', '146', 'Ed', '52.517025', '4.559288', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620215', '133', '146', 'Ed', '52.908654', '4.660611', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620214', '133', '146', 'Ed', '53.045919', '5.099955', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620213', '133', '146', 'Ed', '53.029404', '5.327883', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620212', '133', '146', 'Ed', '52.785904', '5.154919', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620211', '133', '146', 'Ed', '52.739368', '5.528301', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620210', '133', '146', 'Ed', '52.564602', '5.476516', '123', '6', '0', '20200615 23:59.59');
INSERT INTO AISDATA VALUES ('244620209', '133', '146', 'Ed', '52.537104', '5.437029', '123', '6', '0', '20200615 23:59.59');

DROP TABLE IF EXISTS roles;
CREATE TABLE roles (id INT, name VARCHAR(20));
INSERT INTO roles(id,name) VALUES('1','ROLE_USER');
INSERT INTO roles(id,name) VALUES('2','ROLE_SCHIPPER');
INSERT INTO roles(id,name) VALUES('3','ROLE_ADMIN');

DROP TABLE IF EXISTS users;

CREATE TABLE users (created_at VARCHAR, updated_at VARCHAR, email VARCHAR(50), password VARCHAR(125), username VARCHAR(25));
INSERT INTO users(created_at, updated_at, email, password, username) VALUES ('2020-07-08 00:00:00', '2020-07-09 00:00:00', 'user@rondeomnoordholland.nl', '$2a$10$GckdgpfIJ.NhceNRgh6Aue4AX9fcrmA6mbRRU824UYl8tYAXd3GvG', 'user');
INSERT INTO users(created_at, updated_at, email, password, username) VALUES ('2020-07-08 00:00:00', '2020-07-09 00:00:00', 'schipper@rondeomnoordholland.nl', '$2a$10$ozJqsGBy.S9uBPuPIFTYP.qzbbUiF5HPggzZXr/tpwehGuIZuVLae', 'schipper');
INSERT INTO users(created_at, updated_at, email, password, username) VALUES ('2020-07-08 00:00:00', '2020-07-09 00:00:00', 'admin@rondeomnoordholland.nl', '$2a$10$CzuliGNQSRoi8IDMe/RUreQWpbmViC.E5qaZjhpAjypgfsOF9afyG', 'admin');

DROP TABLE IF EXISTS user_roles;
CREATE TABLE user_roles (user_id INT, role_id VARCHAR(20));
INSERT INTO user_roles(user_id, role_id) VALUES ('1', '1');
INSERT INTO user_roles(user_id, role_id) VALUES ('2', '1');
INSERT INTO user_roles(user_id, role_id) VALUES ('2', '2');
INSERT INTO user_roles(user_id, role_id) VALUES ('3', '1');
INSERT INTO user_roles(user_id, role_id) VALUES ('3', '2');
INSERT INTO user_roles(user_id, role_id) VALUES ('3', '3');
