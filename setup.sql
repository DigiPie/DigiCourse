-- This file will be executed each time the project is deployed to Heroku
DROP TABLE IF EXISTS student_info;
DROP TABLE IF EXISTS courses;

-- Student Table
CREATE TABLE student_info (
	matric  varchar(9) PRIMARY KEY,
	name    varchar(255) NOT NULL,
	faculty varchar(3) NOT NULL
);

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000001A', 'Jing Koo', 'SOC');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000002B', 'Myra Morgan', 'SOC');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000003C', 'Raymond Benson', 'SOC');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000004D', 'Wendy Kelley', 'SOC');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000005E', 'Patrick Bowers', 'FOE');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000006F', 'Ralph Hogan', 'FOE');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000007G', 'Cecil Rodriquez', 'SCI');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000008H', 'Delia Ferguson', 'SCI');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000009I', 'Frances Wright', 'SCI');

INSERT INTO student_info (matric, name, faculty)
VALUES ('A0000010J', 'Alyssa Sims', 'SCI');

-- Course Table
CREATE TABLE courses (
	code varchar(10) PRIMARY KEY,
	name varchar(20) NOT NULL,
	capacity integer NOT NULL
);

INSERT INTO courses 
VALUES ('CS2102', 'Database', 40), ('CS3103', 'Networking', 40);

