# DigiCourse
A course management platform where student-teacher interactions can take place seamlessly online.

## Tech stack
This project was built using the following technologies:
- Back-end: NodeJS, ExpressJS, PostgreSQL
- Front-end: JQuery, Bootstrap
- Continuous Deployment: Herokuapp

## Local deployment
To deploy this project locally for development purposes, follow the steps in the [local development guide](DEVELOP.md).

## Contribution
To contribute to this project:

1. Fork this repo.
2. Create a new branch (e.g. `feature-1`) and do your development on this branch.
3. After completing a feature, make a pull request to merge your branch to the `dev` branch on this repo.

The `dev` branch will be merged to the `master` branch at appropriate development stages.

## Continuous deployment
Each time a commit is made to the `master` branch, the project is automatically deployed to Heroku. The following occurs:

1. A commit is made to the `master` branch, the project build begins on Heroku.
2. Heroku runs the first buildpack in the chain [subdir-psql-heroku](https://github.com/DigiPie/subdir-psql-heroku), with `PROJECT_PATH` set to 'src' and `SETUP_SQL` set to 'setup.sql'. This buildpack executes _setup.sql_ to perform the initial set up for the PostgreSQL database on Heroku. It then sets 'src' as the project root.
3. Heroku then runs the second buildpack [heroku/nodejs](https://github.com/heroku/heroku-buildpack-nodejs) to build the NodeJS application.

## Acknowledgements
* DigiCourse was developed for National University of Singapore's [CS2102: Database Systems](https://nusmods.com/modules/CS2102/database-systems) (Autumn 2019, taught by [Dr. Prabawa Adi Yoga Sidi](https://www.comp.nus.edu.sg/cs/bio/adi-yoga/)).
* This project was developed by [Evan Tay](https://github.com/DigiPie/), [Lee Tze Ting](https://github.com/halcyoneee), [Bryan Koh](https://github.com/awarenessxz) and [Jacqueline Cheong](https://github.com/Aquarinte/) from September to November 2019.
* This project is deployed to Heroku with the help of the Heroku buildpack [subdir-psql-heroku](https://github.com/DigiPie/subdir-psql-heroku) which was written by [Alexey Timanovsky](https://github.com/timanovsky) and Evan Tay.