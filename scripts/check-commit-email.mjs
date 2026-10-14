import { execFileSync } from "node:child_process";
const expected = "rayanakarthikeyan@gmail.com";
const commits = execFileSync("git", ["log", "--format=%H|%ae|%ce"], {
  encoding: "utf8",
})
  .trim()
  .split("\n");
for (const line of commits) {
  const [sha, author, committer] = line.split("|");
  if (author !== expected || committer !== expected)
    throw new Error(
      `Commit ${sha} does not use the required author and committer email.`,
    );
}
console.log(
  `Verified ${commits.length} commits: author and committer both ${expected}.`,
);
