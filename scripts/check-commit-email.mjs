import { execFileSync } from "node:child_process";
const expected = "rayanakarthikeyan@gmail.com";
const commits = execFileSync("git", ["log", "--format=%H|%ae|%ce"], {
  encoding: "utf8",
})
  .trim()
  .split("\n");
// Existing collaborator commit preserved with the repository owner's explicit approval.
const preserved = new Map([
  ["0596173b66d6f479c124a5c5c312d7e2dfef0ada", "sravyakalluri26@gmail.com"],
]);
for (const line of commits) {
  const [sha, author, committer] = line.split("|");
  if (
    author !== (preserved.get(sha) || expected) ||
    committer !== (preserved.get(sha) || expected)
  )
    throw new Error(
      `Commit ${sha} does not use the required author and committer email.`,
    );
}
console.log(
  `Verified ${commits.length} commits: ${expected}, except the explicitly preserved collaborator commit.`,
);
