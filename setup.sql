-- This file will be executed each time the project is deployed to Heroku
DROP TABLE IF EXISTS StudentGroups CASCADE;
DROP TABLE IF EXISTS CourseGroups CASCADE;
DROP TABLE IF EXISTS Manages CASCADE;
DROP TABLE IF EXISTS Enrollments CASCADE;
DROP TABLE IF EXISTS Courses CASCADE;
DROP TABLE IF EXISTS Students CASCADE;
DROP TABLE IF EXISTS Professors CASCADE;
DROP TABLE IF EXISTS Accounts CASCADE;
DROP TABLE IF EXISTS student_info CASCADE;

CREATE TABLE Accounts (
	u_id  		varchar(9) PRIMARY KEY,
	passwd   	varchar(64) NOT NULL
);

CREATE TABLE Professors (
	p_id  		varchar(9) PRIMARY KEY REFERENCES Accounts (u_id),
	p_name   	varchar(100) NOT NULL
);

CREATE TABLE Courses (
	c_id  		varchar(9) PRIMARY KEY,
	c_name    	varchar(200) NOT NULL,
	c_capacity  integer NOT NULL,
	c_desc    	varchar(2000) NOT NULL
);

CREATE TABLE Students (
	s_id  		varchar(9) PRIMARY KEY REFERENCES Accounts (u_id),
	s_name   	varchar(100) NOT NULL,
	yr_study 	integer NOT NULL,
	major		varchar(100) NOT NULL,
	is_ta		boolean DEFAULT FALSE
);

CREATE TABLE CourseGroups (
	c_id  		varchar(9),
	g_num  		integer,
	g_capacity 	integer NOT NULL,
	PRIMARY KEY (c_id, g_num),
	FOREIGN KEY (c_id) REFERENCES Courses (c_id) ON DELETE CASCADE
);

CREATE TABLE StudentGroups (
	c_id  		varchar(9) REFERENCES Courses (c_id),
	g_num  		integer,
	s_id  		varchar(9) REFERENCES Students (s_id),
	PRIMARY KEY (c_id, g_num, s_id)
);

CREATE TABLE Manages (
	p_id  		varchar(9) REFERENCES Professors (p_id),
	c_id  		varchar(9) REFERENCES Courses (c_id),
	PRIMARY KEY (p_id, c_id)
);


CREATE TABLE Enrollments (
	s_id		varchar(9) REFERENCES Students (s_id),
	c_id		varchar(9) REFERENCES Courses (c_id),
	req_type	integer NOT NULL,
	req_datetime timestamp NOT NULL,
	p_id		varchar(9) DEFAULT NULL,
	req_status	boolean DEFAULT FALSE,
	PRIMARY KEY (s_id, c_id, req_datetime),
	FOREIGN KEY (p_id) REFERENCES Professors (p_id)
);

CREATE OR REPLACE VIEW CourseEnrollments AS (
	SELECT c_id, s_id, s_name, req_type
	FROM Courses
	NATURAL JOIN Enrollments
	NATURAL JOIN Students
	WHERE req_status
); 

CREATE TABLE student_info (
	matric  varchar(9) PRIMARY KEY,
	name    varchar(255) NOT NULL,
	faculty varchar(3) NOT NULL
);

INSERT INTO Accounts VALUES ('A0000001A', 'A');
INSERT INTO Accounts VALUES ('A0000002B', 'B');
INSERT INTO Accounts VALUES ('A0000003C', 'C');
INSERT INTO Accounts VALUES ('A0000004D', 'D');
INSERT INTO Accounts VALUES ('A0000005E', 'E');
INSERT INTO Accounts VALUES ('P0000001A', 'A');
INSERT INTO Accounts VALUES ('P0000002B', 'B');

INSERT INTO Professors VALUES ('P0000001A', 'Adi');
INSERT INTO Professors VALUES ('P0000002B', 'John');

INSERT INTO Courses VALUES ('CS2102', 'Database Systems', 200, 'asdasdasd');
INSERT INTO Courses VALUES ('CS2100', 'Computer Organisation', 200, 'asdasd');
INSERT INTO Courses VALUES ('CS2030', 'Programming Methodology II', 200, 'asdasd');

INSERT INTO Manages VALUES ('P0000001A','CS2102');
INSERT INTO Manages VALUES ('P0000001A','CS2100');
INSERT INTO Manages VALUES ('P0000001A','CS2030');
INSERT INTO Manages VALUES ('P0000002B','CS2100');

INSERT INTO Students VALUES ('A0000001A', 'Leslie Cole', 1, 'SOC');
INSERT INTO Students VALUES ('A0000002B', 'Myra Morgan', 2, 'SOC');
INSERT INTO Students VALUES ('A0000003C', 'Raymond Benson', 2, 'SOC');
INSERT INTO Students VALUES ('A0000004D', 'Wendy Kelley', 3,'SOC');
INSERT INTO Students VALUES ('A0000005E', 'Patrick Bowers', 3,'FOE', TRUE);

INSERT INTO CourseGroups VAlUES ('CS2102', 1, 5);
INSERT INTO CourseGroups VAlUES ('CS2102', 2, 5);
INSERT INTO CourseGroups VAlUES ('CS2102', 3, 5);
INSERT INTO CourseGroups VAlUES ('CS2102', 4, 5);
INSERT INTO CourseGroups VAlUES ('CS2100', 1, 5);

INSERT INTO StudentGroups VAlUES ('CS2102', 4, 'A0000001A');

INSERT INTO Enrollments VALUES ('A0000001A', 'CS2102', 1, NOW());
INSERT INTO Enrollments VALUES ('A0000002B', 'CS2102', 1, NOW());
INSERT INTO Enrollments VALUES ('A0000003C', 'CS2102', 1, NOW());
INSERT INTO Enrollments VALUES ('A0000004D', 'CS2102', 0, NOW());
INSERT INTO Enrollments VALUES ('A0000001A', 'CS2100', 1, NOW());
INSERT INTO Enrollments VALUES ('A0000002B', 'CS2100', 1, NOW());
INSERT INTO Enrollments VALUES ('A0000003C', 'CS2030', 1, NOW());

INSERT INTO student_info (matric, name, faculty) VALUES ('A0000001A', 'Leslie Cole', 'SOC');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000002B', 'Myra Morgan', 'SOC');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000003C', 'Raymond Benson', 'SOC');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000004D', 'Wendy Kelley', 'SOC');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000005E', 'Patrick Bowers', 'FOE');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000006F', 'Ralph Hogan', 'FOE');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000007G', 'Cecil Rodriquez', 'SCI');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000008H', 'Delia Ferguson', 'SCI');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000009I', 'Frances Wright', 'SCI');
INSERT INTO student_info (matric, name, faculty) VALUES ('A0000010J', 'Alyssa Sims', 'SCI');

