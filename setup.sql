-- This file will be executed each time the project is deployed to Heroku
DROP TABLE IF EXISTS StudentGroups CASCADE;
DROP TABLE IF EXISTS CourseGroups CASCADE;
DROP TABLE IF EXISTS CourseManages CASCADE;
DROP TABLE IF EXISTS Manages CASCADE;
DROP TABLE IF EXISTS Enrollments CASCADE;
DROP TABLE IF EXISTS CourseEnrollments CASCADE;
DROP TABLE IF EXISTS CourseYearSem CASCADE;
DROP TABLE IF EXISTS CourseDetails CASCADE;
DROP TABLE IF EXISTS Students CASCADE;
DROP TABLE IF EXISTS Professors CASCADE;
DROP TABLE IF EXISTS Accounts CASCADE;
DROP TABLE IF EXISTS student_info CASCADE;
DROP TABLE IF EXISTS Forums CASCADE;
DROP TABLE IF EXISTS ForumEntries CASCADE;
DROP TABLE IF EXISTS ForumEntriesLog CASCADE;
DROP TABLE IF EXISTS ForumsGroups CASCADE;

CREATE TABLE Accounts (
	u_username  		varchar(9) PRIMARY KEY,
	u_name 		varchar(100) NOT NULL,
	passwd   	varchar(64) NOT NULL
);

CREATE TABLE Professors (
	p_id  		varchar(9) PRIMARY KEY REFERENCES Accounts (u_username)
);

CREATE TABLE CourseDetails (
	c_code		varchar(9) PRIMARY KEY,
	c_name    	varchar(200) NOT NULL,
	c_desc    	varchar(2000) NOT NULL
);

CREATE TABLE CourseYearSem (
	c_code  		varchar(9) REFERENCES CourseDetails (c_code),
	c_year		smallint,
	c_sem		smallint,
	c_capacity  smallint NOT NULL,
	PRIMARY KEY (c_code, c_year, c_sem),
	CHECK (c_year > 1905),
	CHECK (c_sem > 0 AND c_sem < 5),
	CHECK (c_capacity > 0)
);

CREATE TABLE Students (
	s_id  		varchar(9) PRIMARY KEY REFERENCES Accounts (u_username),
	yr_study 	integer NOT NULL,
	major		varchar(100) NOT NULL,
	CHECK (yr_study > 0 AND yr_study < 10)
);

CREATE TABLE CourseGroups (
	c_code  		varchar(9),
	c_year		smallint,
	c_sem		smallint,
	g_num  		smallint,
	g_capacity 	smallint NOT NULL,
	PRIMARY KEY (c_code, c_year, c_sem, g_num),
	FOREIGN KEY (c_code, c_year, c_sem) REFERENCES CourseYearSem (c_code, c_year, c_sem) ON DELETE CASCADE,
	CHECK (g_num > 0),
	CHECK (g_capacity > 0)
);

CREATE TABLE StudentGroups (
	c_code  		varchar(9),
	c_year		smallint,
	c_sem		smallint,
	g_num  		smallint,
	s_id  		varchar(9) REFERENCES Students (s_id),
	PRIMARY KEY (c_code, c_year, c_sem, s_id),
	FOREIGN KEY (c_code, c_year, c_sem) REFERENCES CourseYearSem (c_code, c_year, c_sem) ON DELETE CASCADE,
	CHECK (g_num > 0)
);

-- Check if the professor accepting is managing this course
CREATE OR REPLACE FUNCTION f_is_student_enrolled() RETURNS TRIGGER AS $$ 
	BEGIN
		IF NEW.s_id = (SELECT s_id FROM CourseEnrollments
			WHERE s_id = NEW.s_id
			AND c_code = NEW.c_code
			AND c_year = NEW.c_year
			AND c_sem = NEW.c_sem) THEN
				RETURN NEW;
		END IF;
		
		RAISE NOTICE 'Trigger student is not enrolled in this course';
		RETURN NULL;
	END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER is_student_enrolled
BEFORE INSERT OR UPDATE ON StudentGroups
FOR EACH ROW EXECUTE PROCEDURE f_is_student_enrolled();

CREATE TABLE Manages (
	p_id  		varchar(9) REFERENCES Professors (p_id),
	c_code  		varchar(9),
	c_year		smallint,
	c_sem		smallint,
	PRIMARY KEY (p_id, c_code, c_year, c_sem),
	FOREIGN KEY (c_code, c_year, c_sem) REFERENCES CourseYearSem (c_code, c_year, c_sem) ON DELETE CASCADE
);

CREATE TABLE Enrollments (
	s_id		varchar(9) REFERENCES Students (s_id),
	c_code		varchar(9),
	c_year		smallint,
	c_sem		smallint,
	req_type	integer NOT NULL,
	req_datetime timestamp NOT NULL,
	p_id		varchar(9) DEFAULT NULL,
	req_status	boolean DEFAULT FALSE,
	PRIMARY KEY (s_id, c_code, c_year, c_sem),
	FOREIGN KEY (p_id) REFERENCES Professors (p_id),
	FOREIGN KEY (c_code, c_year, c_sem) REFERENCES CourseYearSem (c_code, c_year, c_sem) ON DELETE CASCADE,
	CHECK (req_type = 1 OR req_type = 0)
);

-- Check if the professor accepting is managing this course
CREATE OR REPLACE FUNCTION f_check_prof() RETURNS TRIGGER AS $$ 
	BEGIN
		IF NEW.p_id IS NULL THEN 
			RETURN NEW;
		ELSIF NEW.p_id = (SELECT p_id FROM Manages
			WHERE p_id = NEW.p_id
			AND c_code = NEW.c_code
			AND c_year = NEW.c_year
			AND c_sem = NEW.c_sem) THEN
				RETURN NEW;
		END IF;
		
		RAISE NOTICE 'Trigger professor does not manages this course';
		RETURN NULL;
	END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_prof
BEFORE INSERT OR UPDATE ON Enrollments
FOR EACH ROW EXECUTE PROCEDURE f_check_prof();

CREATE TABLE CourseEnrollments (
	c_code		varchar(9),
	c_year		smallint,
	c_sem		smallint,
	c_name    	varchar(200),
	s_id		varchar(9) REFERENCES Students (s_id),
	u_name 		varchar(100) NOT NULL,
	req_type	integer NOT NULL,
	FOREIGN KEY (c_code, c_year, c_sem) REFERENCES CourseYearSem (c_code, c_year, c_sem) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION f_insert_course_enrollments() RETURNS TRIGGER AS $$ 
	DECLARE 
		course_name	varchar(200);
		user_name	varchar(100);
	BEGIN
		SELECT c_name INTO course_name
		FROM CourseDetails
		WHERE c_code = NEW.c_code;

		SELECT u_name INTO user_name
		FROM Accounts
		WHERE u_username = NEW.s_id;

		INSERT INTO CourseEnrollments
		VALUES (NEW.c_code, NEW.c_year, NEW.c_sem, course_name, NEW.s_id, user_name, NEW.req_type);
		
		RETURN NEW;
	END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_course_enrollments
BEFORE INSERT OR UPDATE ON Enrollments
FOR EACH ROW  
WHEN (NEW.req_status) 
EXECUTE PROCEDURE f_insert_course_enrollments();

CREATE TABLE CourseManages (
	c_code  		varchar(9),
	c_name		varchar(200),
	c_year		smallint,
	c_sem		smallint,
	p_id		varchar(9) REFERENCES Accounts (u_username),
	u_name		varchar(100),
	PRIMARY KEY (c_code, c_year, c_sem, p_id),
	FOREIGN KEY (c_code, c_year, c_sem) REFERENCES CourseYearSem (c_code, c_year, c_sem) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION f_insert_course_manages() RETURNS TRIGGER AS $$ 
	DECLARE 
		course_name	varchar(200);
		user_name	varchar(100);
	BEGIN
		SELECT c_name INTO course_name
		FROM CourseDetails
		WHERE c_code = NEW.c_code;

		SELECT u_name INTO user_name
		FROM Accounts
		WHERE u_username = NEW.p_id;

		INSERT INTO CourseManages
		VALUES (NEW.c_code, course_name, NEW.c_year, NEW.c_sem, NEW.p_id, user_name);
		
		RETURN NEW;
	END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_course_manages
BEFORE INSERT OR UPDATE ON Manages
FOR EACH ROW EXECUTE PROCEDURE f_insert_course_manages();

CREATE OR REPLACE VIEW CourseTeachingStaff AS (
	SELECT c_code, c_name, p_id as t_id, u_name as name, 'Professor' as role FROM CourseManages
	UNION
	SELECT c_code, c_name, s_id as t_id, u_name as name, 'Teaching Assistant' as role FROM CourseEnrollments 
	WHERE req_type = 0
); 

CREATE TABLE student_info (
	matric  varchar(9) PRIMARY KEY,
	name    varchar(255) NOT NULL,
	faculty varchar(3) NOT NULL
);

CREATE TABLE Forums (
	p_id			varchar(9) REFERENCES Professors (p_id),
	c_code			varchar(9),
	c_year			smallint,
	c_sem			smallint,
	f_datetime		timestamp NOT NULL,
	f_topic			varchar(100) NOT NULL,
	PRIMARY KEY (c_code, c_year, c_sem, f_datetime),
	FOREIGN KEY (c_code, c_year, c_sem) REFERENCES CourseYearSem (c_code, c_year, c_sem) ON DELETE CASCADE

	/* Primary key rationale:
	c_code, c_year, c_sem (to identify the course).
	f_datetime (to identify a forum).
	
	1) Professors may create many forums with the same f_topic (e.g. to be assigned to different groups).
	2) Highly unlikely for more than 1 forum to be created at the same time in a course.
	Hence f_datetime is chosen as part of the primary key, and not f_topic.
	*/
);

CREATE TABLE ForumEntries (
	c_code			varchar(9) NOT NULL,
	c_year			smallint,
	c_sem			smallint,
	f_datetime		timestamp NOT NULL,
	u_username			varchar(9) REFERENCES Accounts (u_username),
	e_datetime		timestamp NOT NULL,
	e_content		varchar(1000) NOT NULL,
	e_deleted_by	varchar(9) DEFAULT NULL,
	PRIMARY KEY (c_code, c_year, c_sem, f_datetime, u_username, e_datetime),
	FOREIGN KEY (e_deleted_by) REFERENCES Accounts (u_username),
	FOREIGN KEY (c_code, c_year, c_sem, f_datetime) REFERENCES Forums(c_code, c_year, c_sem, f_datetime) ON DELETE CASCADE
	
	/* Primary key rationale:
	c_code, c_year, c_sem, f_datetime (to identify the forum).
	u_username and e_datetime (to identify an entry).
	
	1) Multiple entries can be posted at the same time by different users.
	2) The same user can post multiple entries within a forum.
	3) A normal user cannot possibly post multiple entries at the same time within a forum.
	Hence both u_username and e_datetime have to be used to identify an entry within a forum.
	*/
);

CREATE TABLE ForumsGroups (
	c_code			varchar(9),
	c_year			smallint,
	c_sem			smallint,
	f_datetime		timestamp NOT NULL,
	g_num			integer,
	PRIMARY KEY (c_code, f_datetime, g_num),
	FOREIGN KEY (c_code, c_year, c_sem, g_num) REFERENCES CourseGroups (c_code, c_year, c_sem, g_num) ON DELETE CASCADE,
	FOREIGN KEY (c_code, c_year, c_sem, f_datetime) REFERENCES Forums (c_code, c_year, c_sem, f_datetime) ON DELETE CASCADE
);

CREATE TABLE ForumEntriesLog (
	c_code				varchar(9) NOT NULL,
	c_year				smallint,
	c_sem				smallint,
	f_datetime			timestamp NOT NULL,
	f_topic				varchar(100) NOT NULL,
	e_author_id			varchar(9) NOT NULL,
	e_author_name		varchar(100) NOT NULL,
	e_datetime			timestamp NOT NULL,
	e_content			varchar(1000) NOT NULL,
	e_delete_id			varchar(9) NOT NULL,
	e_delete_name		varchar(100) NOT NULL,
	e_delete_datetime	timestamp NOT NULL,
	PRIMARY KEY (c_code, c_year, c_sem, f_datetime, e_author_id, e_datetime)
);

-- Replace the formatted f_datetime with the actual f_datetime timestamp in Forums table
CREATE OR REPLACE FUNCTION replace_f_datetime()
RETURNS trigger AS $$ 
BEGIN
	NEW.f_datetime :=(SELECT f_datetime FROM Forums WHERE TO_CHAR(f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') = TO_CHAR(NEW.f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') AND c_code = NEW.c_code AND c_year = NEW.c_year AND c_sem = NEW.c_sem);
RETURN NEW;
END; $$ LANGUAGE 'plpgsql';

CREATE TRIGGER insert_entry
BEFORE INSERT
ON ForumEntries
FOR EACH ROW
EXECUTE PROCEDURE replace_f_datetime();

CREATE TRIGGER insert_forum_group
BEFORE INSERT
ON ForumsGroups
FOR EACH ROW
EXECUTE PROCEDURE replace_f_datetime();

-- Establish audit trail for deleted forum entries by using triggers to insert into 'ForumEntriesLog' table
CREATE OR REPLACE FUNCTION bef_delete_forum()
RETURNS trigger AS $$ 
BEGIN
	DELETE FROM ForumEntries
	WHERE c_code = OLD.c_code
	AND c_year = OLD.c_year
	AND c_sem = OLD.c_sem
	AND f_datetime = OLD.f_datetime;
RETURN OLD;
END; $$ LANGUAGE 'plpgsql';

CREATE TRIGGER delete_forum
BEFORE DELETE
ON Forums
FOR EACH ROW
EXECUTE PROCEDURE bef_delete_forum();

CREATE OR REPLACE FUNCTION bef_delete_entries()
RETURNS trigger AS $$ 
DECLARE
	author_name		varchar(100);
	delete_name		varchar(100);
	forum_topic		varchar(100);
BEGIN
	SELECT f_topic INTO forum_topic
	FROM Forums
	WHERE f_datetime = OLD.f_datetime
	AND c_code = OLD.c_code
	AND c_year = OLD.c_year
	AND c_sem = OLD.c_sem;

	SELECT u_name INTO author_name
	FROM Accounts
	WHERE u_username = OLD.u_username;

	SELECT u_name INTO delete_name
	FROM Accounts
	WHERE u_username = OLD.e_deleted_by;

	INSERT into ForumEntriesLog 
	VALUES (OLD.c_code, OLD.c_year, OLD.c_sem, OLD.f_datetime, forum_topic, OLD.u_username, author_name, OLD.e_datetime, OLD.e_content, OLD.e_deleted_by, delete_name, NOW());
RETURN OLD;
END; $$ LANGUAGE 'plpgsql';

CREATE TRIGGER delete_entries
BEFORE DELETE
ON ForumEntries
FOR EACH ROW
EXECUTE PROCEDURE bef_delete_entries();

-- Accounts(u_username, passwd) -> u_username
INSERT INTO Accounts VALUES ('A0000001A', 'Leslie Cole', '$2b$10$vS4KkX8uenTCNooir9vyUuAuX5gUhSGVql8yQdsDDD4TG8bSUjkt.');
INSERT INTO Accounts VALUES ('A0000002B', 'Myra Morgan', 'B');
INSERT INTO Accounts VALUES ('A0000003C', 'Raymond Benson', 'C');
INSERT INTO Accounts VALUES ('A0000004D', 'Wendy Kelley', '$2b$10$vS4KkX8uenTCNooir9vyUuAuX5gUhSGVql8yQdsDDD4TG8bSUjkt.');
INSERT INTO Accounts VALUES ('A0000005E', 'Patrick Bowers', 'E');
INSERT INTO Accounts VALUES ('A0000006F', 'Brooklyn DontShow', 'F');
INSERT INTO Accounts VALUES ('P0000001A', 'Adi', '$2b$10$vS4KkX8uenTCNooir9vyUuAuX5gUhSGVql8yQdsDDD4TG8bSUjkt.');
INSERT INTO Accounts VALUES ('P0000002B', 'John', 'B');

-- Professors(p_id) -> p_id
INSERT INTO Professors VALUES ('P0000001A');
INSERT INTO Professors VALUES ('P0000002B');

-- CourseDetails(c_code, c_name, c_desc) -> c_code
INSERT INTO CourseDetails VALUES ('CS2102', 'Database Systems I', 'The aim of this module is to introduce the fundamental concepts and techniques necessary for the understanding and practice of design and implementation of database applications and of the management of data with relational database management systems. The module covers practical and theoretical aspects of design with entity-relationship model, theory of functional dependencies and normalisation by decomposition in second, third and Boyce-Codd normal forms. The module covers practical and theoretical aspects of programming with SQL data definition and manipulation sublanguages, relational tuple calculus, relational domain calculus and relational algebra.');
INSERT INTO CourseDetails VALUES ('CS3102', 'Database Systems II', 'This module provides an in-depth study of the concepts and implementation issues related to database management systems. It first covers the physical implementation of relational data model, which includes storage management, access methods, query processing, and optimisation. Then it covers issues and techniques dealing with multi-user application environments, namely, transactions, concurrency control and recovery. The third part covers object-database systems that are useful extension of relational databases to deal with complex data types. The last part covers database technologies required for modern decision support systems, including data warehousing, data mining and knowledge discovery and on-line analytical processing.');
INSERT INTO CourseDetails VALUES ('CS4102', 'Database Systems III', 'This module studies the management of data in a distributed environment. It covers the fundamental principles of distributed data management and includes distribution design, data integration, distributed query processing and optimization, distributed transaction management, and replication. It will also look at how these techniques can be adapted to support database management in emerging technologies (e.g., parallel systems, peer-to-peer systems, cloud computing).');
INSERT INTO CourseDetails VALUES ('CS5102', 'Database Systems IV', 'Database security has a great impact on the design of today information systems. This course will provide an overview of database security concepts and techniques and discuss new directions of database security in the context of Internet information management. Topics covered include: Access control models for DBMSs, Inference controls, XML database security, Encrypted databases, Digital credentials and PKIs, Trust in open systems, and Peer-to-peer system security.');
INSERT INTO CourseDetails VALUES ('CS2105', 'Introduction to Computer Networks', 'This module aims to provide a broad introduction to computer networks and network application programming. It covers the main concepts, the fundamental principles, and the high-level workings of important protocols in each of the Internet protocol layer. Topics include the Web and Web applications, DNS services, socket programming, reliable protocols, transport and network layer protocols, secure communication, LAN, and data communication. Practical assignments and handson exercises expose students to network application programming and various networking tools and utilities.');
INSERT INTO CourseDetails VALUES ('CS3103', 'Computer Network Practises', 'This module aims to provide an opportunity for the students to learn commonly-used network protocols in greater technical depth with their implementation details than a basic networking course. Students will perform hands-on experiments in configuring and interconnecting LANs using networking devices/technologies (e.g., routers, switches, SDN switches, and hubs), networking protocols (e.g., DHCP, DNS, RIP, OSPF, ICMP, TCP, UDP, wireless LAN, VLAN protocols, SIP, SSL, IPSec-VPN) and networking tools (e.g, tcpdump, netstat, ping, traceroute). Students will learn higher-layer network protocols and develop network applications (client/server, P2P) via socket programming.');
INSERT INTO CourseDetails VALUES ('CS4226', 'Wireless Networking', 'This module aims to provide solid foundation for students in the area of wireless networks and introduces students to the emerging area of cyber-physical-system/Internet-of-Things. The module will cover wireless networking across all layers of the networking stack including physical, link, MAC, routing and application layers. Different network technologies with different characteristic will also be covered, including cellular networks, Wi-Fi, Bluetooth and ZigBee. Some key concepts that cut across all layers and network types are mobility management, energy efficiency, and integration of sensing and communications. The module emphasizes on exposing students to practical network system issues through building software prototypes.');
INSERT INTO CourseDetails VALUES ('BM5125', 'Managing Business Network', '	This is an MBA elective course in the management of networks. It will utilize articles in the business press, case studies, discussion, exercises, and guest speakers in examining a variety of networks that managers and entrepreneurs must design, access, mobilize, and otherwise lead. These include entrepreneurial networks of resource providers and alliance partners; networks of communication and coordination within established organizations; supply chain and marketing channel networks; informal networks in and outside organizations that confer influence and advance careers; cross-border networks for doing business globally. The management of networks requires a distinct and critical set of capabilities, among them: powers of persuasion and trust-building; charisma and vision; spontaneity and flexibility; and tolerance for change and uncertainty.');
INSERT INTO CourseDetails VALUES ('CS5104', 'Network Security', 'The objective of this module is to introduce students to the various issues that arise in securing the networks, and study the state-of-the-art techniques for addressing these challenges. A number of most damaging attacks on computer systems involve the exploitation of network infrastructure. This module provides an in-depth study of network attack techniques and methods to defend against them. Topics include basic concepts in network security; firewalls and virtual private networks; network intrusion detection; denial of service (DoS); traffic analysis; secure routing protocols; protocol scrubbing; and advanced topics such as wireless network security.');
INSERT INTO CourseDetails VALUES ('CS1010', 'Programming Methodology I', 'This module introduces the fundamental concepts of problem solving by computing and programming using an imperative programming language. It is the first and foremost introductory course to computing. Topics covered include computational thinking and computational problem solving, designing and specifying an algorithm, basic problem formulation and problem solving approaches, program development, coding, testing and debugging, fundamental programming constructs (variables, types, expressions, assignments, functions, control structures, etc.), fundamental data structures (arrays, strings, composite data types), basic sorting, and recursion.');
INSERT INTO CourseDetails VALUES ('CS2030', 'Programming Methodology II', 'This module is a follow up to CS1010. It explores two modern programming paradigms, object-oriented programming and functional programming. Through a series of integrated assignments, students will learn to develop medium-scale software programs in the order of thousands of lines of code and tens of classes using objectoriented design principles and advanced programming constructs available in the two paradigms. Topics include objects and classes, composition, association, inheritance, interface, polymorphism, abstract classes, dynamic binding, lambda expression, effect-free programming, first class functions, closures, continuations, monad, etc.');
INSERT INTO CourseDetails VALUES ('CS4215', 'Programming Language implementation', 'This module provides the students with theoretical knowledge and practical skill in the implementation of programming languages. It discusses implementation aspects of fundamental programming paradigms (imperative, functional and object-oriented), and of basic programming language concepts such as binding, scope, parameter-passing mechanisms and types. It introduces the language processing techniques of interpretation and compilation and virtual machines. The lectures are accompanied by lab sessions which will focus on language processing tools, and take the student through a sequence of programming language implementations. This modules also covers automatic memory management, dynamic linking and just-in-time compilation, as features of modern execution systems.');
INSERT INTO CourseDetails VALUES ('CS2100', 'Computer Organizations', 'The objective of this module is to familiarise students with the fundamentals of computing devices. Through this module students will understand the basics of data representation, and how the various parts of a computer work, separately and with each other. This allows students to understand the issues in computing devices, and how these issues affect the implementation of solutions. Topics covered include data representation systems, combinational and sequential circuit design techniques, assembly language, processor execution cycles, pipelining, memory hierarchy and input/output systems.');

-- CourseYearSem(c_code, c_year, c_sem, c_capacity) -> c_code, c_year, c_sem
INSERT INTO CourseYearSem VALUES ('CS2102', 2018, 1, 100);
INSERT INTO CourseYearSem VALUES ('CS2102', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS3102', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS4102', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS5102', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS2105', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS3103', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS4226', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('BM5125', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS5104', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS1010', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS2030', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS4215', 2019, 1, 200);
INSERT INTO CourseYearSem VALUES ('CS2100', 2019, 1, 200);

-- Manages(p_id, c_code) -> p_id, c_code
INSERT INTO Manages VALUES ('P0000001A','CS2102', 2018, 1);
INSERT INTO Manages VALUES ('P0000001A','CS2102', 2019, 1);
INSERT INTO Manages VALUES ('P0000001A','CS2100', 2019, 1);
INSERT INTO Manages VALUES ('P0000001A','CS2030', 2019, 1);
INSERT INTO Manages VALUES ('P0000001A','CS4102', 2019, 1);
INSERT INTO Manages VALUES ('P0000001A','CS4215', 2019, 1);
INSERT INTO Manages VALUES ('P0000002B','BM5125', 2019, 1);

-- Students(s_id, s_name, yr_study, major) -> s_id
INSERT INTO Students VALUES ('A0000001A', 1, 'SOC');
INSERT INTO Students VALUES ('A0000002B', 2, 'SOC');
INSERT INTO Students VALUES ('A0000003C', 2, 'SOC');
INSERT INTO Students VALUES ('A0000004D', 3,'SOC');
INSERT INTO Students VALUES ('A0000005E', 3,'FOE');
INSERT INTO Students VALUES ('A0000006F', 4,'SOC');

-- CourseGroups (c_code, c_year, c_sem, g_num, g_capacity) --> c_code, c_year, c_sem, g_num
INSERT INTO CourseGroups VAlUES ('CS2102', 2018, 1, 999, 999);
INSERT INTO CourseGroups VAlUES ('CS2102', 2019, 1, 1, 5);
INSERT INTO CourseGroups VAlUES ('CS2102', 2019, 1, 2, 5);
INSERT INTO CourseGroups VAlUES ('CS2102', 2019, 1, 3, 5);
INSERT INTO CourseGroups VAlUES ('CS2102', 2019, 1, 4, 5);
INSERT INTO CourseGroups VAlUES ('CS2100', 2019, 1, 1, 5);

-- Enrollments (s_id, c_code, c_year, c_sem, req_type, req_datetime, p_id, req_status) --> s_id, c_code, c_year, c_sem, req_datetime
INSERT INTO Enrollments VALUES ('A0000001A', 'CS2102', 2018, 1, 1, NOW() - interval '1 year', 'P0000001A', FALSE); 
INSERT INTO Enrollments VALUES ('A0000002B', 'CS2102', 2018, 1, 1, NOW() - interval '1 year', 'P0000001A', TRUE); 
INSERT INTO Enrollments VALUES ('A0000006F', 'CS2102', 2018, 1, 1, NOW() - interval '1 year', 'P0000001A', TRUE); 
INSERT INTO Enrollments VALUES ('A0000001A', 'CS2102', 2019, 1, 1, NOW()); 
INSERT INTO Enrollments VALUES ('A0000002B', 'CS2102', 2019, 1, 1, NOW()); 
INSERT INTO Enrollments VALUES ('A0000003C', 'CS2102', 2019, 1, 1, NOW()); 
INSERT INTO Enrollments VALUES ('A0000004D', 'CS2102', 2019, 1, 0, NOW()); 
INSERT INTO Enrollments VALUES ('A0000001A', 'CS2100', 2019, 1, 1, NOW()); 
INSERT INTO Enrollments VALUES ('A0000002B', 'CS2100', 2019, 1, 1, NOW()); 
INSERT INTO Enrollments VALUES ('A0000003C', 'CS2030', 2019, 1, 1, NOW()); 
INSERT INTO Enrollments VALUES ('A0000001A', 'CS4102', 2019, 1, 1, NOW(), 'P0000001A', TRUE); 
INSERT INTO Enrollments VALUES ('A0000001A', 'CS4215', 2019, 1, 1, NOW(), 'P0000001A', TRUE); 
INSERT INTO Enrollments VALUES ('A0000001A', 'CS2030', 2019, 1, 0, NOW(), 'P0000001A', FALSE); 
INSERT INTO Enrollments VALUES ('A0000001A', 'BM5125', 2019, 1, 0, NOW(), NULL, FALSE); 
INSERT INTO Enrollments VALUES ('A0000004D', 'CS4215', 2019, 1, 0, NOW(), 'P0000001A', TRUE); 

-- StudentGroups (c_code, c_year, c_sem, g_num, s_id) --> c_code, c_year, c_sem, g_num, s_id
INSERT INTO StudentGroups VAlUES ('CS2102', 2018, 1, 999, 'A0000006F');
INSERT INTO StudentGroups VAlUES ('CS2102', 2019, 1, 4, 'A0000001A');
INSERT INTO StudentGroups VAlUES ('CS2100', 2019, 1, 2, 'A0000001A');

INSERT INTO Forums VALUES ('P0000001A', 'CS2102', 2018, 1, '2018-08-23 16:30:00', 'Assignment 0');
INSERT INTO Forums VALUES ('P0000001A', 'CS2102', 2018, 1, '2018-09-01 13:30:30', 'Form project groups');
INSERT INTO Forums VALUES ('P0000001A', 'CS2102', 2018, 1, '2018-10-13 21:30:30', 'Lecture Queries');
INSERT INTO Forums VALUES ('P0000001A', 'CS2102', 2018, 1, '2018-10-13 22:30:30', 'Assignment 2');
INSERT INTO Forums VALUES ('P0000001A', 'CS2102', 2019, 1, NOW(), 'Project Queries');
INSERT INTO Forums VALUES ('P0000001A', 'CS2102', 2019, 1, NOW() - INTERVAL '10 min', 'Consultation');

INSERT INTO ForumEntries VALUES ('CS2102', 2018, 1, '2018-10-13 21:30:30', 'A0000001A', NOW(), 'Can you provide more examples on the usage of triggers?');
INSERT INTO ForumEntries VALUES ('CS2102', 2018, 1, '2018-10-13 21:30:30', 'A0000002B', NOW(), 'Will we be tested on all topics for finals?');
INSERT INTO ForumEntries VALUES ('CS2102', 2018, 1, '2018-10-13 22:30:30', 'A0000002B', NOW(), 'When will the marks be released?');

INSERT INTO ForumsGroups VAlUES ('CS2102', 2018, 1, '2018-08-23 16:30:00', 999);
INSERT INTO ForumsGroups VAlUES ('CS2102', 2018, 1, '2018-10-13 21:30:30', 999);