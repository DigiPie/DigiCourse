const sql = {}

sql.query = {
	// Login
	select_user: 'SELECT * FROM Accounts WHERE u_id=$1',
}

module.exports = sql