# Local development guide
To deploy this project locally for development purposes, follow the steps below.

## Downloads
To begin, first install and set up the following.

1. [Install PostgreSQL](https://www.postgresql.org/download/).
2. [Install NodeJS](https://nodejs.org/en/).
3. Clone this repository (e.g. enter `git clone https://github.com/DigiPie/DigiCourse.git` in your command-line terminal).
4. Change directory to the newly created _DigiCourse_ directory by entering `cd DigiCourse`.

## Database setup
Next, create the database and its tables by doing the following.

1. Log into **psql** by entering `psql -U username -d database`. Replace the fields accordingly (e.g. `psql -U postgres -d postgres`).
2. Execute _setup.sql_ by running the command `\i setup.sql`.
3. Exit **psql** by entering `\q`.

## NodeJS setup
After setting up the database, set up the NodeJS application by following the instructions below.

1. Change directory to the _src_ folder by entering the command `cd src`.
2. Install the required packages by entering `npm install`.
3. Create a file named _.env_ in the current directory _src_.
4. Open _.env_ and enter the following: 
```
DATABASE_URL=postgres://<username>:<password>@<hostname>:<port>/<database_name>
SECRET=h-B\p$]Z~@9Y-5T?
```
Replace the fields in `< >` accordingly.

- 5432 is the default port for PostgreSQL
- The `SECRET` is given out because this is a project intended for educational purposes, with dummy data generated and inserted into the database by `setup.sql` based on the `SECRET` provided (e.g. default password).

## Local server setup
Finally, you can execute the NodeJS app by going through the steps below.

1. Check that you are in the directory _src_.
2. Run this project on your local server by running `npm start`.
3. Open `localhost:3000` in your web browser. You should see a login page. Please see below for example accounts.
4. Stop the server by using `CTRL + C`.

## Example accounts
| Type | Username | Password |
|-----|:---:|----:|
|Professor|P0000007K|CS2102CS2102|
|Student|A0000274S|CS2102CS2102|
|Teaching Assistant|A0000161B|CS2102CS2102|