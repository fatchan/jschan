# Contributing

Thanks for considering contributing.

Some links:
  * [Kanban board](https://gitgud.io/fatchan/jschan/-/boards/4780) already has issues in swim lanes.
  * IRC: [irc.fatpeople.lol #general](ircs://irc.fatpeople.lol:6697/general) OR: [webchat](https://irc-web.fatpeople.lol/#general)

## LICENSE?

See [LICENSE](https://gitgud.io/fatchan/jschan/-/blob/master/LICENSE)

## Making changes

  * Bug? Open an issue.
  * Request? Open an issue and ask. Saves wasting your time making changes that will be denied for being bad or unwanted.

When contributing, make a merge request with a clear list of what you've done.

Write clear commit messages. One line is fine for smaller changes, or multiple lines for bigger changes. Be clear and concise.

    $ git commit -m "A brief summary of the commit
    > 
    > A paragraph describing what changed and its impact."

## Coding style

  - Tab indentation
    - Switch cases indented 1 level
    - Member expressions indented 1 level
    - Comment indentation ignored
  - Unix linebreaks
  - Single quotes
  - Always include semicolon

ESLint will enforce this (and pick up some other minor code issues). Run ESLint:

```bash
#whole project
eslint ./

#specific directory/file
eslint /path/to/whatever
```

## Running tests

Make sure these still pass after your changes, or adjust them to meet the new expected results.

There is a "jschan-test" service in the `docker-compose.yml` file that will run all the tests in a jschan instance using the docker instance. See the advanced section of installation for some instruction on how to use this.

You can also Run them locally if you have an instance setup (or for quickly running unit tests):

```bash
#unit tests
npm run test
# OR npm run test:unit

#integration tests
TEST_ADMIN_PASSWORD=<password from jschan-reset docker> npm run test:integration

#all tests
npm run test:all

#specific test(s)
npm run test:all <filename|regex>
```

Linting, code coverage and test results are reported in merge requests. Improvements to add tests and/or improve test coverage are welcomed.

Thanks,
Tom
