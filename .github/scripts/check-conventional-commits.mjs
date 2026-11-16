import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const conventionalCommit = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9][a-z0-9._/-]*\))?!?: .+$/;

function validate(label, subject) {
  if (!conventionalCommit.test(subject)) {
    console.error(`${label} does not follow Conventional Commits: ${subject}`);
    return false;
  }
  console.log(`Valid: ${subject}`);
  return true;
}

function validatePullRequest(eventPath) {
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const pullRequest = event.pull_request;
  if (!pullRequest) {
    throw new Error('The commit convention check requires a pull_request event.');
  }

  const baseRef = pullRequest.base.ref;
  execFileSync('git', ['fetch', 'origin', `refs/heads/${baseRef}:refs/remotes/origin/${baseRef}`], {
    stdio: 'inherit',
  });

  const subjects = execFileSync(
    'git',
    ['log', '--no-merges', '--format=%s', `origin/${baseRef}..HEAD`],
    { encoding: 'utf8' },
  ).trim().split('\n').filter(Boolean);

  if (subjects.length === 0) {
    throw new Error('No non-merge commits were found in the pull request.');
  }

  let valid = validate('Pull request title', pullRequest.title);
  for (const [index, subject] of subjects.entries()) {
    valid = validate(`Commit ${index + 1}`, subject) && valid;
  }
  if (!valid) process.exitCode = 1;
}

const [mode, value] = process.argv.slice(2);
if (mode === '--message' && value) {
  if (!validate('Commit', value)) process.exitCode = 1;
} else if (mode === '--file' && value) {
  const subject = readFileSync(value, 'utf8').split(/\r?\n/, 1)[0];
  if (!validate('Commit', subject)) process.exitCode = 1;
} else if (process.env.GITHUB_EVENT_PATH) {
  validatePullRequest(process.env.GITHUB_EVENT_PATH);
} else {
  console.error('Usage: node check-conventional-commits.mjs --message "type(scope): subject"');
  process.exitCode = 2;
}
