const {repository} = require('../package.json');
const types = {
  feat: 'Features', fix: 'Bug Fixes', perf: 'Performance Improvements',
  revert: 'Reverts', docs: 'Documentation', style: 'Styles',
  refactor: 'Code Refactoring', test: 'Tests', chore: 'Chores'
};

// Adapted from conventional-changelog-videojs 3.0.2 (ISC, Steve Mao).
// Keep the existing Video.js categories, links, ordering and templates.
module.exports = {
  parser: {
    headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
    headerCorrespondence: ['type', 'scope', 'subject'],
    noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
    revertPattern: /^revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
    revertCorrespondence: ['header', 'hash']
  },
  writer: {
    transform(commit) {
      if (!types[commit.type] && !commit.notes.length) {
        return null;
      }
      const issues = [];
      const issueUrl = repository.url.replace(/^git\+/, '').replace(/\.git$/, '') + '/issues/';
      const subject = typeof commit.subject === 'string' ? commit.subject
        .replace(/#([0-9]+)/g, (_, issue) => {
          issues.push(issue);
          return `[#${issue}](${issueUrl}${issue})`;
        })
        .replace(/@([a-zA-Z0-9_]+)/g, '[@$1](https://github.com/$1)') : commit.subject;

      // The current writer supplies immutable commits; return updated fields.
      return {
        type: types[commit.type] || commit.type,
        scope: commit.scope === '*' ? '' : commit.scope,
        hash: typeof commit.hash === 'string' ? commit.hash.slice(0, 7) : commit.hash,
        subject,
        notes: commit.notes.map(note => ({...note, title: 'BREAKING CHANGES'})),
        references: commit.references.filter(reference => !issues.includes(reference.issue))
      };
    },
    groupBy: 'type',
    commitGroupsSort(a, b) {
      for (const title of ['BREAKING CHANGES', 'Features', 'Bug Fixes']) {
        if (a.title === title) {
          return -1;
        }
        if (b.title === title) {
          return 1;
        }
      }
      if (a.title === b.title) {
        return 0;
      }
      return a.title < b.title ? -1 : 1;
    },
    commitsSort: ['scope', 'subject'],
    noteGroupsSort: 'title',
    notesSort(a, b) {
      if (a === b) {
        return 0;
      }
      return a < b ? -1 : 1;
    },
    template: require('./changelog/template')
  }
};
