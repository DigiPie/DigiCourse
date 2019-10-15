const sql = {}

sql.query = {
	// Login
	select_user: 'SELECT u_id, u_name, passwd, CASE'
				+ ' WHEN (SELECT COUNT(*) FROM Students WHERE s_id = $1) = 1 THEN \'Student\''
				+ ' WHEN (SELECT COUNT(*) FROM Professors WHERE p_id = $1) = 1 THEN \'Professor\''
				+ ' ELSE \'null\''
				+ ' END AS u_type'
				+ ' FROM Accounts'
				+ ' WHERE u_id = $1'
}

module.exports = sql