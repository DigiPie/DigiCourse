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
Each time a commit is made to the `master` branch, the project is automatically deployed to Heroku. The following occurs next:

1. Heroku detects the commit and starts building the project.
2. Heroku runs the first buildpack in the chain [psql-heroku-buildpack](https://github.com/DigiPie/psql-heroku-buildpack) which executes `setup.sql` to reset and repopulate the PostgreSQL database attached to this project's Herokuapp.
3. The second buildpack [subdir-heroku-buildpack](https://github.com/DigiPie/subdir-heroku-buildpack) is then executed. It sets 'src' as the project root.
4. Heroku then runs the third and final buildpack [heroku/nodejs](https://github.com/heroku/heroku-buildpack-nodejs) to build the NodeJS application.
5. The project is deployed to [digicourse.herokuapp.com](https://digicourse.herokuapp.com).

## Acknowledgements
* DigiCourse was developed for National University of Singapore's [CS2102: Database Systems](https://nusmods.com/modules/CS2102/database-systems) (Autumn 2019, taught by [Dr. Prabawa Adi Yoga Sidi](https://www.comp.nus.edu.sg/cs/bio/adi-yoga/)).
* This project was developed by [Evan Tay](https://github.com/DigiPie/), [Lee Tze Ting](https://github.com/halcyoneee), [Bryan Koh](https://github.com/awarenessxz) and [Jacqueline Cheong](https://github.com/Aquarinte/) from **September to November 2019**.
* This project is deployed to Herokuapp with the help of the Heroku buildpack [subdir-heroku-buildpack](https://github.com/DigiPie/subdir-heroku-buildpack) developed by [Alexey Timanovsky](https://github.com/timanovsky).
* This project used async/await codes for node-postgres developed by [Francesco Zerbinati](https://gist.github.com/zerbfra/70b155fa00b4e0d6fd1d4e090a039ad4).
* This project's web template was designed by [uxcandy.co](https://www.uxcandy.co/).
* This project's logo was designed by [freepik - www.freepik.com](https://www.freepik.com/free-photos-vectors/logo).