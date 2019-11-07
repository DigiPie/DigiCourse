'''
Simple Dummy Code generator script
'''
import os
import enum
import random
from datetime import datetime, timedelta

# global config
insert_filename = 'insert.sql'
num_of_prof = 10						# for generating professor account (there will be x prof account)
num_of_students = 300					# for generating student account (there will be x student account)
num_of_courses = 10						# for generating course (there will be x courses)
num_of_groups = 4						# for generating CourseGroup (each course will have x groups)
start_year = 2018						# for generating courseyearsme 
current_year = 2019						# for generating courseyearsme 
current_sem = 2							# for generating courseyearsme (either 1 or 2)
class_capacity = 80						# set upper limit for class sizes (each course will have 20 - x capacity)
max_prof_per_class = 2					# for generating Manages (each course will have 1-x prof)
num_of_rejected_students = 5			# for generating enrollment (each course will have 0-x rejected students)
num_of_pending_students = 10				# for generating enrollment (each course will have 0-x pending students)
num_of_approved_ta = 6					# for generating enrollment (each course will have 0-x approved ta)
num_of_rejected_ta = 4					# for generating enrollment (each course will have 0-x rejected ta)
num_of_pending_ta = 3					# for generating enrollment (each course will have 0-x pending ta)
num_of_forums = 3						# for generating forum (each course will have 0 - x forums)
num_of_entries = 20						# for generating forum entires (each forum will have 0 - x entries)

# global variables
alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
faculties = ['SOC', 'BIZ', 'SCI', 'SDE', 'ENGIN', 'FASS', 'LAW', 'MED']
prof_id_counter = 1						# current max is 8 character (9999999A)
stud_id_counter = 1						# current max is 8 character (9999999A)
course_code_counter = 1					# current max is 4 digits (9999)

class AccountType(enum.Enum): 
    Professor = 0
    Student = 1
    TA = 3

# Generate random uid for accounts
def generate_userid(account_type):
	uid = ""
	uid_length = 7
	if (account_type is AccountType.Professor):
		global prof_id_counter
		uid = "P" + str(prof_id_counter).zfill(uid_length) + alphabet[random.randint(0, 25)].upper()
		prof_id_counter += 1
	else:
		global stud_id_counter
		uid = "A" + str(stud_id_counter).zfill(uid_length) + alphabet[random.randint(0, 25)].upper()
		stud_id_counter += 1
	return uid

'''
	Randomly generate acccounts for professors / students / ta
'''
def insert_user_accounts(num_of_prof, num_of_students):
	# load the first name and last name
	firstnames = []
	lastnames = []
	with open("data_firstname.txt", "r") as f:
		lines = f.readlines()
		for line in lines:
			firstnames.append(line.strip())
	with open("data_lastname.txt", "r") as f:
		lines = f.readlines()
		for line in lines:
			lastnames.append(line.strip())

	stud_ids = {}
	prof_ids = {}

	# Generate random accounts
	with open(insert_filename, "a+") as f:
		print("Generating random user acconuts")

		# Generating insert into Accounts Table statements
		f.write("\n-- Inserting into Accounts" + "\n")
		# Insert Professors
		for i in range(num_of_prof):
			# generate random data
			name = firstnames[random.randint(0, len(firstnames)-1)] + " " + lastnames[random.randint(0, len(lastnames)-1)]
			uid = generate_userid(AccountType.Professor)
			# write into file
			f.write("INSERT INTO Accounts VALUES('" + uid + "', '" + name  + "', '$2b$10$PZtiJLgnJSdPU.RiraxSFulahGSVuTSShcSAqAQLbjiZivhwqzxHm');" + "\n")
			# save into dictionary
			prof_ids[uid] = name
		# Insert Students
		for i in range(num_of_students):
			# generate random data
			name = firstnames[random.randint(0, len(firstnames)-1)] + " " + lastnames[random.randint(0, len(lastnames)-1)]
			uid = generate_userid(AccountType.Student)
			# write into file
			f.write("INSERT INTO Accounts VALUES('" + uid + "', '" + name  + "', '$2b$10$vS4KkX8uenTCNooir9vyUuAuX5gUhSGVql8yQdsDDD4TG8bSUjkt.');" + "\n")
			# save into dictionary
			stud_ids[uid] = name

		# Generating insert into Professor Table statements
		f.write("\n-- Inserting into Professors" + "\n")
		for key, value in prof_ids.items():
			f.write("INSERT INTO Professors VALUES ('" + key + "');" + "\n")

		# Generating insert into Student Table statements
		f.write("\n-- Inserting into Students" + "\n")
		for key, value in stud_ids.items():
			year = random.randint(1, 4)
			faculty = faculties[random.randint(0, len(faculties)-1)]
			f.write("INSERT INTO Students VALUES ('" + key + "', " + str(year) +", '" + faculty + "');" + "\n")

	return (stud_ids, prof_ids)

# Randomly Generate Course code
def generate_coursecode():
	global course_code_counter
	code_length = 4
	code = alphabet[random.randint(0, 25)].upper() + alphabet[random.randint(0, 25)].upper() + str(course_code_counter).zfill(code_length)
	course_code_counter += 1
	return code

'''
	Randomly generate courses managed by 1 professor or multiple professors
	@Param
		num_of_courses = number of courses
		prof_ids = dictionary of professor ids
'''
def insert_courses(num_of_courses, prof_ids):
	# load the list of random names and descriptions
	rand_names = []
	rand_descs = []
	with open("data_coursename.txt", "r") as f:
		lines = f.readlines()
		for line in lines:
			rand_names.append(line.strip())
	with open("data_coursedescription.txt", "r") as f:
		lines = f.readlines()
		for line in lines:
			rand_descs.append(line.strip())

	courses = {}
	allCourses = []

	# Generate random courses
	with open(insert_filename, "a+") as f:
		print("Generating random courses")

		# Generating insert into Courses Table statements
		f.write("\n-- Inserting into Courses" + "\n")
		for i in range(num_of_courses):
			# generate random data
			code = generate_coursecode()
			coursename = rand_names[random.randint(0, len(rand_names)-1)]
			desc = rand_descs[random.randint(0, len(rand_descs)-1)]
			# write into file
			f.write("INSERT INTO CourseDetails VALUES ('" + code + "', '" + coursename + "', '" + desc + "');" + "\n")
			# save into dictionary
			courses[code] = coursename

		# Generating insert into CourseYearSem Table statements
		f.write("\n-- Inserting into CourseYearSem" + "\n")
		for key, value in courses.items():
			year = start_year
			# generate random data (for courses before current year)
			num_of_sem = random.randint(1, 2)
			while (year < current_year):
				# generate random data
				capacity = random.randint(20, class_capacity)
				# offer semester randomly
				if num_of_sem == 1:
					sem_offered = random.randint(1, 2)
					# write into file
					f.write("INSERT INTO CourseYearSem VALUES('" + key + "', " + str(year) + ", " + str(sem_offered) + ", " + str(capacity) + ");" + "\n")
					# save to list
					allCourses.append([key, year, sem_offered, capacity])
				else:
					# write into file
					for sem in range(num_of_sem):
						f.write("INSERT INTO CourseYearSem VALUES('" + key + "', " + str(year) + ", " + str(sem+1) + ", " + str(capacity) + ");" + "\n")
						# save to list
						allCourses.append([key, year, sem+1, capacity])
				year += 1
			# generate random data (for courses in current year)
			num_of_sem = random.randint(1, 2)
			capacity = random.randint(20, class_capacity)
			if num_of_sem == 1:
				# Write into file (Based on current sem indicated above)
				f.write("INSERT INTO CourseYearSem VALUES('" + key + "', " + str(year) + ", " + str(current_sem) + ", " + str(capacity) + ");" + "\n")
				# save to list
				allCourses.append([key, year, current_sem, capacity])
			else:
				for sem in range(num_of_sem):
					# write into file
					f.write("INSERT INTO CourseYearSem VALUES('" + key + "', " + str(year) + ", " + str(sem+1) + ", " + str(capacity) + ");" + "\n")
					# save to list
					allCourses.append([key, year, sem+1, capacity])


		updatedAllCourses = []
		# ---------------------------------------------------- Future improvements: Add Professor to Manages same course from different year/sem
		# Generating insert into Manages Table statements
		f.write("\n-- Inserting into Manages" + "\n")
		for course in allCourses:
			# extract professors to manage class
			pids = []
			num = random.randint(0, len(list(prof_ids.keys()))-max_prof_per_class-1)
			for i in range(max_prof_per_class):
				pids.append(list(prof_ids.keys())[num + i])
			# Write to file
			for pid in pids:
				f.write("INSERT INTO Manages VALUES ('" + pid + "', '" + course[0] + "', " + str(course[1]) + ", " + str(course[2]) + ");" + "\n")
			# save to list
			course.append(pids)
			updatedAllCourses.append(course)

		allCourses = updatedAllCourses

		# Generating insert Into CourseGroups Table statements
		f.write("\n-- Inserting into CourseGroups" + "\n")
		for course in allCourses:
			# generate random data
			capacity = course[3]
			group_size = int((capacity / num_of_groups) + 1)		# capacity / num of group
			# write to file
			for g_num in range(num_of_groups):
				f.write("INSERT INTO CourseGroups VALUES ('" + course[0] + "', " + str(course[1]) + ", " + str(course[2]) + ", " + str(g_num+1) + ", " + str(group_size) + ");" + "\n")

	return allCourses

# select student for enrollment
def select_student(studentCourses, requestList, stud_ids, ccode, c_year, c_sem):
	# Select student 
	indexes = list(range(0, len(stud_ids)))
	stud_id_keys = list(stud_ids.keys())			
	random.shuffle(indexes)	
	stud_id = None
	for index in indexes:
		stud_id = stud_id_keys[index]
		# check if student is requested
		if stud_id in requestList:
			stud_id = None
			continue											# student have been rejected / pending / approved
		# check if student have enrolled before
		if stud_id in studentCourses:
			enrolledCourses = studentCourses[stud_id]
			if ccode in enrolledCourses:
				# check if current year / sem is greater
				stud_year, stud_sem = enrolledCourses[ccode]
				if stud_year < c_year:							# student have enrolled before, ignore
					stud_id = None
					continue
				elif stud_year == c_year:
					if stud_sem < c_sem:						# student have enrolled before, ignore
						stud_id = None
						continue

		requestList[stud_id] = 1
		break													# student have not enrolled / rejected / pending
	return stud_id

# select student for ta
def select_ta(studentCourses, requestStudList, requestTAlist, stud_ids, ccode, c_year, c_sem):
	# select student
	indexes = list(range(0, len(stud_ids)))
	stud_id_keys = list(stud_ids.keys())
	random.shuffle(indexes)
	stud_id = None
	for index in indexes:
		stud_id = stud_id_keys[index]
		# check if student has requested for TA
		if stud_id in requestTAlist:
			stud_id = None
			continue											# student have been rejected/pending/approved as TA, ignore
		# check if student has requested for Course
		if stud_id in requestStudList:
			stud_id = None
			continue											# student have been rejected/pending/approved for courses, ignore
		# check if student is enrolled
		if stud_id in studentCourses:
			enrolledCourses = studentCourses[stud_id]

			if ccode in enrolledCourses:
				# check if current year / sem is greater
				stud_year, stud_sem = enrolledCourses[ccode]
				if stud_year < c_year:							# student year is less than course year, can apply as TA
					requestTAlist[stud_id] = 1
					break
				elif stud_year == c_year:
					if stud_sem < c_sem:
						requestTAlist[stud_id] = 1				# student sem is 1 < 2
						break

		stud_id = None
		#continue												# student is not enrolled, ignore
	return stud_id
'''
	randomly generate enrollments
	@Param
		allcourses = list of [code, year, sem, capacity, all_prof_ids_managing_course]
		stud_ids = dictionary of students id
'''
def insert_enrollments(allCourses, stud_ids):
	studentCourses = {}						# dictionary of students and their courses {stud_id: {code: year sem}}
	courseStudents = {}						# dictionary of courses and their students {codeyearsem: {stud_ids: 1}}
	
	# Generate course application
	with open(insert_filename, "a+") as f:
		print("Generating enrollments")

		# Insert students into Course
		f.write("\n-- Inserting into Enrollments (Applying Courses)" + "\n")
		updatedAllCourses = []
		for course in allCourses:
			ccode = course[0]
			year = course[1]
			sem = course[2]
			capacity = course[3] - random.randint(0, 5)		# class will not always be completely filled
			pids = course[4]
			approver_pid = pids[random.randint(0, len(pids)-1)]
			requestList = {}

			courseYearSem = ccode + str(year) + str(sem)

			# Insert rejected students
			for i in range(random.randint(0, num_of_rejected_students)):
				# Select student
				stud_id = select_student(studentCourses, requestList, stud_ids, ccode, year, sem)
				# Check if any student found
				if stud_id == None:
					break
				else:
					# Write into file
					f.write("INSERT INTO Enrollments VALUES('" + stud_id + "', '" + ccode + "', " + str(year) +  ", " + str(sem) + ", 1, NOW(), '" + approver_pid + "', FALSE);" + "\n")

			# Insert students who are successfully enrolled AKA student of the course
			for slot in range(min(capacity, num_of_students)):
				# Select student
				stud_id = select_student(studentCourses, requestList, stud_ids, ccode, year, sem)
				# Check if any student found
				if stud_id == None:
					break					# no more students eligible to take class
				else:
					# Add Course to Student
					if stud_id in studentCourses:
						if ccode in studentCourses[stud_id]:
							# Take the latest year / sem
							stored_year, stored_sem = studentCourses[stud_id][ccode]
							# compare year
							if stored_year < year:
								studentCourses[stud_id][ccode] = (year, sem)
							elif stored_year == year:
								# compare semester
								if stored_sem < sem:
									studentCourses[stud_id][ccode] = (year, sem)
						else:
							studentCourses[stud_id][ccode] = (year, sem)
					else:
						studentCourses[stud_id] = {}
						studentCourses[stud_id][ccode] = (year, sem)		# put the latest year/sem 

					# Add Student to Course
					if courseYearSem in courseStudents:
						courseStudents[courseYearSem][stud_id] = 1
					else:
						courseStudents[courseYearSem] = {}
						courseStudents[courseYearSem][stud_id] = 1

					# Write into file
					f.write("INSERT INTO Enrollments VALUES('" + stud_id + "', '" + ccode + "', " + str(year) +  ", " + str(sem) + ", 1, NOW(), '" + approver_pid + "', TRUE);" + "\n")

			# Insert students who are trying to apply to the course
			for i in range(random.randint(0, num_of_pending_students)):
				# Select student 
				stud_id = select_student(studentCourses, requestList, stud_ids, ccode, year, sem)
				# Check if any student found
				if stud_id == None:
					break
				else:
					# Write into file
					f.write("INSERT INTO Enrollments VALUES('" + stud_id + "', '" + ccode + "', " + str(year) +  ", " + str(sem) + ", 1, NOW());" + "\n")

			# save to list
			course.append(requestList)
			updatedAllCourses.append(course)

		# replace back
		allCourses = updatedAllCourses

		# Insert students into Course
		f.write("\n-- Inserting into Enrollments (Applying to be Teaching Assistant)" + "\n")
		for course in allCourses:
			ccode = course[0]
			year = course[1]
			sem = course[2]
			pids = course[4]
			approver_pid = pids[random.randint(0, len(pids)-1)]
			requestStudList = course[5] 
			requestTAlist = {}

			courseYearSem = ccode + str(year) + str(sem)
			
			# Insert students who are rejected as TA
			for i in range(random.randint(0, num_of_rejected_ta)):
				# Select student 
				stud_id = select_ta(studentCourses, requestStudList, requestTAlist, stud_ids, ccode, year, sem)
				# Check if any student found
				if stud_id == None:
					break
				else:
					# Write into file
					f.write("INSERT INTO Enrollments VALUES('" + stud_id + "', '" + ccode + "', " + str(year) +  ", " + str(sem) + ", 0, NOW(), '" + approver_pid + "', FALSE);" + "\n")

			# Insert students who are successfully TA
			for i in range(random.randint(0, num_of_approved_ta)):
				# Select Student
				stud_id = select_ta(studentCourses, requestStudList, requestTAlist, stud_ids, ccode, year, sem)
				# check if any student is found
				if stud_id == None:
					break
				else:
					# Write into file
					f.write("INSERT INTO Enrollments VALUES('" + stud_id + "', '" + ccode + "', " + str(year) +  ", " + str(sem) + ", 0, NOW(), '" + approver_pid + "', TRUE);" + "\n")
		
			# Insert students who are trying to apply to be ta for the course
			for i in range(random.randint(0, num_of_pending_ta)):
				# Select student 
				stud_id = select_ta(studentCourses, requestStudList, requestTAlist, stud_ids, ccode, year, sem)
				# Check if any student found
				if stud_id == None:
					break
				else:
					# Write into file
					f.write("INSERT INTO Enrollments VALUES('" + stud_id + "', '" + ccode + "', " + str(year) +  ", " + str(sem) + ", 0, NOW());" + "\n")	

	return studentCourses, courseStudents

'''
	randomly assign students to groups
	@Param: 
		allcourses = list of [code, year, sem, capacity, all_prof_ids_managing_course]
		courseStudents = dictionary of courses where each course has a dictionary of students
'''
def assign_students_to_groups(courseStudents, allCourses):		
	courseGroups = {}											# dictionary of courses and their student in group 
	with open(insert_filename, "a+") as f:
		print("Assigning random Student Groups")
		f.write("\n-- Inserting into StudentGroups" + "\n")
		for course in allCourses:
			ccode = course[0]
			year = course[1]
			sem = course[2]
			capacity = course[3]
			pids = course[4]
			approver_pid = pids[random.randint(0, len(pids)-1)]

			# Get Students in Course
			courseStudentsKey = ccode + str(year) + str(sem)
			if courseStudentsKey in courseStudents:
				# Save to Dictionary
				courseGroups[courseStudentsKey] = []
				for i in range(num_of_groups):
					courseGroups[courseStudentsKey].append([])
				# Insert Students into groups
				g_num = 1
				for student in courseStudents[courseStudentsKey]:
					# Write to file
					f.write("INSERT INTO StudentGroups VALUES ('" + ccode + "', " + str(year) + ", " + str(sem) + ", " + str(g_num) + ", '" + student + "');" + "\n")
					# Save to List
					courseGroups[courseStudentsKey][g_num-1].append(student)
					# Check Group Num
					g_num += 1
					if g_num > num_of_groups:
						g_num = 1

	return courseGroups				

# Get random datetime
def gen_datetime(min_year=start_year, max_year=datetime.now().year):
    # generate a datetime in format yyyy-mm-dd hh:mm:ss.000000
    start = datetime(min_year, 1, 1, 00, 00, 00)
    years = max_year - min_year + 1
    end = start + timedelta(days=365 * years)
    rand_time = start + (end - start) * random.random()
    return rand_time.strftime("%Y-%m-%d %H:%M:%S")

'''
	randomly assign generate fourms
	@Param: 
		courseGroups = dictionary of courses where each course has a list of groups where each group has a list of student
		allcourses = list of [code, year, sem, capacity, all_prof_ids_managing_course]
'''
def setup_forums(courseGroups, allCourses):
	forums = []									# list of [courseYearSemGroup, g_num, ccode, year, sem, dt, approver_pid]

	# extract list of data
	topics = []
	reviews = []
	with open("data_topic.txt", "r") as f:
		lines = f.readlines()
		for line in lines:
			topics.append(line.strip())
	with open("data_foodreview.txt", "r") as f:
		lines = f.readlines()
		for line in lines:
			reviews.append(line.strip())

	with open(insert_filename, "a+") as f:
		print("Generating random forums")

		# Generating insert into Forum Table statements
		f.write("\n-- Inserting into Forums" + "\n")
		for course in allCourses:
			ccode = course[0]
			year = course[1]
			sem = course[2]
			capacity = course[3]
			pids = course[4]
			creator_pid = pids[random.randint(0, len(pids)-1)]
			courseYearSem = ccode + str(year) + str(sem)

			# Create Forums
			if courseYearSem in courseGroups:
				groups = courseGroups[courseYearSem]
				# Create Annoucement for each course (randomly)
				if random.randint(0, 1) == 1:
					dt = gen_datetime()	
					f.write("INSERT INTO Forums VALUES('" + creator_pid + "', '" + ccode + "', " + str(year) + ", " + str(sem) + ", '" + dt + "', 'Annoucement');" + "\n")
					# Assign to all groups
					for g_num in range(len(groups)):
						forums.append([courseYearSem, ccode, year, sem, creator_pid, dt, g_num+1])
				# Create Random Forum
				for i in range(random.randint(1, num_of_forums)):
					dt = gen_datetime()
					topic = topics[random.randint(0, len(topics)-1)]
					f.write("INSERT INTO Forums VALUES('" + creator_pid + "', '" + ccode + "', " + str(year) + ", " + str(sem) + ", '" + dt + "', '" + topic + "');" + "\n")
					# Assign to random groups
					indexes = list(range(0, len(groups)))
					random.shuffle(indexes)
					# select only a few group
					for i in range(random.randint(1, len(groups))):
						g_num = indexes[i]
						forums.append([courseYearSem, ccode, year, sem, creator_pid, dt, g_num+1])

		# Generating insert into ForumGroups Table statements
		f.write("\n-- Inserting into ForumsGroups" + "\n")
		for forum in forums:
			f.write("INSERT INTO ForumsGroups VALUES('" + forum[1] + "', " + str(forum[2]) + ", " + str(forum[3]) + ", '" + forum[4] + "', '" + forum[5] + "', " + str(forum[6]) + ");" + "\n")

		# Generating insert into ForumEntries Table statements
		f.write("\n-- Inserting into ForumsGroups" + "\n")
		for forum in forums:
			courseYearSem = forum[0]
			ccode = forum[1]
			year = forum[2]
			sem = forum[3]
			creator_pid = forum[4]
			create_dt = forum[5]
			g_num = forum[6]

			# extract list of students
			if courseYearSem in courseGroups:
				students = courseGroups[courseYearSem][g_num-1]
				# Check if there are any students in the group
				if students:
					# for each forum, generate x entries
					for i in range(0, random.randint(0, num_of_entries)):
						# Generate data
						student = students[random.randint(0, len(students)-1)]
						message = reviews[random.randint(0, len(reviews)-1)]
						dt = gen_datetime()
						# Write to file
						f.write("INSERT INTO ForumEntries VALUES('" + ccode + "', " + str(year) + ", " + str(sem) + ", '" + creator_pid + "', '" + create_dt + "', '" + student + "', '" + dt + "', '" + message + "');" + "\n")


'''
	Output list of students that are taking courses in current year
'''
def print_current_students(studentCourses):
	print("\nList of students taking the following courses in " + str(current_year) + " S" + str(current_sem) + ":")
	print("*" * 50)
	for student in studentCourses:						# for each student
		outputstr = student + " : "
		for course in studentCourses[student]:			# for each course taken by student
			year, sem = studentCourses[student][course]
			if year == current_year and sem == current_sem:
				outputstr += course + " "
		print(outputstr)

# Main Function
if __name__ == "__main__":
	# Remove insert file if exists
	if os.path.exists(insert_filename):
		os.remove(insert_filename)
	# randomly generate a list of accounts for professors / students
	stud_ids, prof_ids = insert_user_accounts(num_of_prof, num_of_students)	
	# randomly generate a list of courses
	allCourses = insert_courses(num_of_courses, prof_ids)						# allcourses = list of [code, year, sem, capacity, all_prof_ids_managing_course]
	# randomly generate enrollments
	studentCourses, courseStudents = insert_enrollments(allCourses, stud_ids)	# studentCourses = dictionary of students where each student has a dictionary of courses.  
	# randomly assign students to groups 										# courseStudents = dictionary of courses where each course has a dictionary of students
	courseGroups = assign_students_to_groups(courseStudents, allCourses)		# courseGroups = dictionary of courses where each course has a list of groups where each group has a list of student
	# randomly create forum for course groups
	setup_forums(courseGroups, allCourses)
	# Output list of students that are taking current year/sem courses
	# print_current_students(studentCourses)

	# -- improve on: 
	# -- the random date generator and insertion, the date order is not in order now
	# -- the data for forum entries should change to a better one. Some entries are not inserted because the length exceeded













