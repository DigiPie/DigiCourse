# DigiCourse
A course management platform where student-teacher interactions can take place seamlessly online.

# Local deployment
To deploy this project locally for development purposes, follow the steps below.
1. [Install PostgreSQL](https://www.postgresql.org/download/).
2. [Install NodeJS](https://nodejs.org/en/).
3. Clone this repository (e.g. enter `git clone https://github.com/DigiPie/DigiCourse.git` in your command-line terminal).
4. Change directory to the _src_ folder by entering the command `cd src`.
4. Install the required packages by entering `npm install`.
5. Create a file named _.env_ in the current directory (_src_).
6. Open _.env_ and type in the following: `DATABASE_URL=postgres://username:password@host_address:port/database_name`. Replace the fields accordingly.
6. Run this project on your local server by using `node bin\www` for Linux or `node bin/www` for Windows.
7. Open `localhost:3000` in your web browser and you should see the project's landing web page.
8. Stop the server by using `CTRL + C`.

# Acknowledgements
* DigiCourse was developed for National University of Singapore's [CS2102: Database Systems](https://nusmods.com/modules/CS2102/database-systems) (Autumn 2019, taught by [Dr. Prabawa Adi Yoga Sidi](https://www.comp.nus.edu.sg/cs/bio/adi-yoga/)).
* DigiCourse was developed by [Evan Tay](https://github.com/DigiPie/), [Lee Tze Ting](https://github.com/halcyoneee), [Bryan Koh](https://github.com/awarenessxz) and [Jacqueline Cheong](https://github.com/Aquarinte/) from September to November 2019.
