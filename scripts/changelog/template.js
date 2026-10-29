// Video.js changelog layout, adapted from conventional-changelog-videojs 3.0.2.
// ISC license, Steve Mao. Uses the current writer's JavaScript template API.
const repoUrl = context => context.repository ?
  [context.host, context.owner, context.repository].filter(Boolean).join('/') : context.repoUrl;
const link = (label, url) => `[${label}](${url})`;

module.exports = context => {
  const {version, previousTag, currentTag, title, date, isPatch, linkCompare, linkReferences} = context;
  const repository = repoUrl(context);
  const heading = linkCompare ? link(version, `${repository}/compare/${previousTag}...${currentTag}`) : version;
  let output = `<a name="${version}"></a>\n${isPatch ? '##' : '#'} ${heading}`;

  output += `${title ? ` "${title}"` : ''}${date ? ` (${date})` : ''}\n`;
  for (const group of context.commitGroups) {
    output += `\n${group.title ? `### ${group.title}\n\n` : ''}`;
    for (const commit of group.commits) {
      const {scope, subject, header, hash, references} = commit;
      const hashLink = linkReferences ? `(${link(hash, `${repository}/${context.commit}/${hash}`)})` : hash;

      output += `*${scope ? ` **${scope}:**` : ''} ${subject || header} ${hashLink}`;
      if (references.length) {
        output += ', closes ' + references.map(reference => {
          const label = `${reference.owner ? `${reference.owner}/` : ''}${reference.repository || ''}#${reference.issue}`;
          const target = reference.repository && context.repository ?
            [context.host, reference.owner, reference.repository].filter(Boolean).join('/') : repository;

          return linkReferences ? link(label, `${target}/${context.issue}/${reference.issue}`) : label;
        }).join(' ');
      }
      output += '\n';
    }
  }
  for (const group of context.noteGroups) {
    output += `\n\n### ${group.title}\n\n`;
    for (const note of group.notes) {
      output += `* ${note.commit.scope ? `**${note.commit.scope}:** ` : ''}${note.text}\n`;
    }
  }
  return output;
};
