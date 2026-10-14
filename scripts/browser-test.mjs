import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(
  isAbsolute(playwrightModule)
    ? pathToFileURL(playwrightModule).href
    : playwrightModule
);
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("tmp/browser", { recursive: true });
try {
  const created = await page.request.post(
    "http://127.0.0.1:8000/api/learners",
    { data: { name: "Browser verification profile" } },
  );
  const learner = await created.json();
  await page.addInitScript(
    (id) => localStorage.setItem("learnproof-learner", id),
    learner.id,
  );
  await page.goto(process.env.TEST_BASE_URL || "http://127.0.0.1:5173");
  await page
    .getByRole("heading", { name: "Build understanding. Keep the proof." })
    .waitFor();
  await page.screenshot({
    path: "tmp/browser/overview-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Evidence tutor", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Ask the evidence tutor" })
    .fill("How does linked-list traversal work?");
  await page
    .getByRole("button", { name: "Send question", exact: true })
    .click();
  await page
    .getByText("These are exact source excerpts, selected locally.", {
      exact: false,
    })
    .last()
    .waitFor();
  await page.locator(".citations button").first().click();
  await page.getByRole("dialog", { name: "Source evidence viewer" }).waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector(".source-preview img");
    return image && image.complete && image.naturalWidth > 0;
  });
  assert.equal(
    await page
      .locator(".source-preview img")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
    true,
  );
  await page.screenshot({
    path: "tmp/browser/source-viewer.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Close source viewer" }).click();
  await page
    .getByRole("button", { name: "Practice & repair", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Practice topic" })
    .selectOption("stacks");
  await page.getByRole("button", { name: "Find my next question" }).click();
  await page.getByRole("radio", { name: /C/ }).last().check();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await page
    .getByRole("heading", { name: "A little more understanding." })
    .waitFor();
  await page
    .getByRole("combobox", { name: "Practice topic" })
    .selectOption("complexity");
  await page
    .getByRole("checkbox", { name: /Review weak prerequisites/ })
    .uncheck();
  await page.getByRole("button", { name: "Find my next question" }).click();
  await page
    .getByRole("radio", {
      name: "A Yes, all insertion work is O(1)",
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await page
    .getByRole("button", { name: "Try a diagnostic follow-up" })
    .click();
  await page
    .getByRole("heading", {
      name: "What is the worst-case cost of searching a singly linked list?",
    })
    .waitFor();
  await page.reload();
  await page
    .getByRole("heading", {
      name: "What is the worst-case cost of searching a singly linked list?",
    })
    .waitFor();
  await page.getByRole("radio", { name: "B O(n)", exact: true }).check();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await page
    .getByRole("button", { name: "Check transfer on the original topic" })
    .click();
  await page
    .getByRole("heading", {
      name: "A reference to the insertion node is already provided. What is the rewiring cost?",
    })
    .waitFor();
  await page.getByRole("radio", { name: "A O(1)", exact: true }).check();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await page
    .getByRole("button", { name: "Finish this repair session" })
    .click();
  await page
    .getByText("The unseen transfer check was answered correctly.", {
      exact: false,
    })
    .waitFor();
  await page.getByRole("button", { name: "Mock exams", exact: true }).click();
  await page
    .getByRole("button", { name: "Create mock exam", exact: true })
    .click();
  const expected = [
    ["What does a pointer store?", "A reference/address"],
    ["What does a null next reference indicate?", "The end of the list"],
    ["Can two references point to the same node?", "Yes"],
    [
      "Which reference do you repeatedly follow to traverse a singly linked list?",
      "next",
    ],
    [
      "How many next links must be followed to move from the first to the sixth node?",
      "5",
    ],
    [
      "A value is absent from a 12-node list. How many nodes must a worst-case search inspect?",
      "12",
    ],
    [
      "When inserting X after A, which update must happen first?",
      "X.next = A.next",
    ],
    [
      "After setting X.next = A.next, what reference update completes insertion after A?",
      "A.next = X",
    ],
    [
      "How many next-reference updates insert X after an already known node A?",
      "2",
    ],
  ];
  for (let i = 0; i < 6; i++) {
    await page
      .getByRole("button", { name: "Submit and continue", exact: true })
      .waitFor();
    const prompt = await page.locator(".question-panel > h2").innerText();
    const answer = expected.find(([q]) => q === prompt)?.[1];
    assert.ok(answer, `Unexpected fixture question: ${prompt}`);
    const radio = page
      .locator(".answer-option")
      .filter({ hasText: answer })
      .getByRole("radio");
    if (await radio.count()) await radio.first().check();
    else
      await page
        .getByRole("textbox", { name: "Exam answer", exact: true })
        .fill(answer);
    await page
      .getByRole("button", { name: "Submit and continue", exact: true })
      .click();
  }
  await page.getByRole("heading", { name: "6 correct / 6 scored" }).waitFor();
  await page
    .getByRole("button", { name: "My understanding", exact: true })
    .click();
  await page.getByText("Correct response · Multiple choice").first().waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "My understanding", exact: true })
    .click();
  await page.getByText("Correct response · Multiple choice").first().waitFor();
  await page.getByRole("button", { name: "Evaluation", exact: true }).click();
  await page
    .getByRole("heading", { name: "The benchmark hasn’t run yet." })
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: "tmp/browser/overview-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "Mobile content must not overflow horizontally",
  );
  await page
    .getByRole("button", { name: "Course library", exact: true })
    .click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "Library must fit mobile width",
  );
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(
    "Browser checks passed: tutor, source preview, repair/probe/transfer across reload, six-item mock exam, persisted results, unmeasured benchmark, desktop/mobile layout.",
  );
} finally {
  await browser.close();
}
