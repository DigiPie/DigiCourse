# Local development guide

## Downloads

1. [Install PostgreSQL](https://www.postgresql.org/download/).
2. [Install NodeJS](https://nodejs.org/en/).
3. Clone this repository (e.g. enter `git clone https://github.com/DigiPie/DigiCourse.git` in your command-line terminal).
4. Change directory to the newly created _DigiCourse_ directory by entering `cd DigiCourse`.

## Database setup

1. Log into **psql** by entering `psql -U username -d database`. Replace the fields accordingly (e.g. `psql -U postgres -d postgres`).
2. Execute _setup.sql_ by running the command `\i setup.sql`.
7. Exit **psql** by entering `\q`.

## NodeJS setup

1. Change directory to the _src_ folder by entering the command `cd src`.
2. Install the required packages by entering `npm install`.
3. Create a file named _.env_ in the current directory (_src_).
4. Open _.env_ and type in the following: `DATABASE_URL=postgres://username:password@localhost:5432/database_name` (e.g. `DATABASE_URL=postgres://postgres:password@localhost:5432/postgres`). Replace the fields accordingly (5432 is the default port for Postgres).

## Local server setup

1. Run this project on your local server by using `node bin\www` for Linux or `node bin/www` for Windows.
2. Open `localhost:3000/insert` in your web browser and you should see a form submission web page.
3. Stop the server by using `CTRL + C`.