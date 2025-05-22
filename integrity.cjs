const linkToCode =
  'https://gist.githubusercontent.com/nosbog/8fa72c38ad4d542d8121a1e520eb8fe2/raw/rsschool-nodejs-task-graphql-check-integrity';

fetch(linkToCode)
  .then((r) => r.text())
  .then((t) => eval(t));
