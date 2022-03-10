import childProcess from "child_process";
import path from "path";
import util from "util";
import { pathToFileURL } from "url";
import semver from "semver";
import stripAnsi from "strip-ansi";
import fse from "fs-extra";

import { createApp } from "..";

const DEFAULT_APP_NAME = "my-remix-app";

const execFile = util.promisify(childProcess.execFile);
const spawn = childProcess.spawn;

const keys = {
  up: "\x1B\x5B\x41",
  down: "\x1B\x5B\x42",
  enter: "\x0D",
  space: "\x20",
};

const createRemix = path.resolve(
  __dirname,
  "../../../build/node_modules/create-remix/cli.js"
);

const remixDev = path.resolve(
  __dirname,
  "../../../build/node_modules/@remix-run/dev/cli.js"
);

describe("create-remix cli", () => {
  describe("creates a new app from a template", () => {
    let projectDir: string;

    beforeEach(() => {
      projectDir = path.join(
        process.cwd(),
        ".tmp",
        Math.random().toString(32).slice(2)
      );
    });

    // this also tests sub directories
    it("works for examples in the remix repo", async () => {
      await expect(
        createApp({
          from: "basic",
          install: false,
          lang: "ts",
          projectDir,
          quiet: true,
          githubPAT: process.env.GITHUB_TOKEN,
        })
      ).resolves.toBeUndefined();
    });

    // TODO: enable once this is live
    it.skip("works for templates in the remix org", async () => {
      await expect(
        createApp({
          from: "arc-stack",
          install: false,
          lang: "ts",
          projectDir,
          quiet: true,
          githubPAT: process.env.GITHUB_TOKEN,
        })
      ).resolves.toBeUndefined();
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for GitHub username/repo combo", async () => {
      await expect(
        createApp({
          from: "mcansh/snkrs",
          install: false,
          lang: "ts",
          projectDir,
          quiet: true,
          githubPAT: process.env.GITHUB_TOKEN,
        })
      ).resolves.toBeUndefined();
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for remote tarballs", async () => {
      await expect(
        createApp({
          from: "https://github.com/remix-run/remix/blob/6ae8676dfeb6a79c7d30c925408d1b043623f307/packages/create-remix/__tests__/arc.tar.gz?raw=true",
          install: false,
          lang: "js",
          projectDir,
          quiet: true,
        })
      ).resolves.toBeUndefined();
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.jsx"))
      ).toBeTruthy();
    });

    it("works for a path to a tarball on disk", async () => {
      await expect(
        createApp({
          from: path.join(__dirname, "arc.tar.gz"),
          install: false,
          lang: "js",
          projectDir,
          quiet: true,
        })
      ).resolves.toBeUndefined();
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.jsx"))
      ).toBeTruthy();
    });

    it("works for a file URL to a tarball on disk", async () => {
      await expect(
        createApp({
          from: pathToFileURL(path.join(__dirname, "arc.tar.gz")).toString(),
          install: false,
          lang: "js",
          projectDir,
          quiet: true,
        })
      ).resolves.toBeUndefined();
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.jsx"))
      ).toBeTruthy();
    });

    it("works for a file path to a directory on disk", async () => {
      await expect(
        createApp({
          from: path.join(process.cwd(), "examples/basic"),
          install: false,
          lang: "ts",
          projectDir,
          quiet: true,
        })
      ).resolves.toBeUndefined();
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for a file URL to a directory on disk", async () => {
      await expect(
        createApp({
          from: pathToFileURL(
            path.join(process.cwd(), "examples/basic")
          ).toString(),
          install: false,
          lang: "ts",
          projectDir,
          quiet: true,
        })
      ).resolves.toBeUndefined();
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("throws an error when invalid remix.init.js", async () => {
      await expect(
        createApp({
          from: "arc-stack",
          install: true,
          lang: "ts",
          projectDir,
          quiet: true,
          githubPAT: process.env.GITHUB_TOKEN,
        })
      ).rejects.toThrowError("🚨 Error running `remix.init`");
    });

    // TODO: enable once this is live
    // fails due to `remix init` not being in the released compiler
    it.skip("runs remix.init.js when installing dependencies", async () => {
      await expect(
        createApp({
          from: path.join(__dirname, "remix-init.tar.gz"),
          install: true,
          lang: "ts",
          projectDir,
          quiet: true,
          githubPAT: process.env.GITHUB_TOKEN,
        })
      ).resolves.toBeUndefined();

      expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
    }, 60_000);

    it("runs remix.init.js when using `remix init`", async () => {
      await expect(
        createApp({
          from: path.join(__dirname, "remix-init.tar.gz"),
          install: false,
          lang: "ts",
          projectDir,
          quiet: true,
          githubPAT: process.env.GITHUB_TOKEN,
        })
      ).resolves.toBeUndefined();

      let { stdout, stderr } = await execFile("node", [remixDev, "init"], {
        cwd: projectDir,
      });

      expect(stdout.trim()).toBe("");
      expect(stderr.trim()).toBe("");

      expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
    }, 60_000);
  });

  // TODO: Rewrite this test
  it.skip("guides the user through the process", async (done) => {
    let cli = spawn("node", [createRemix], {});
    let promptCount = 0;
    let previousPrompt: string;

    cli.stdout.on("data", async (data) => {
      let prompt = cleanPrompt(data);
      if (
        !prompt ||
        prompt === "R E M I X" ||
        isSamePrompt(prompt, previousPrompt)
      ) {
        return;
      }

      promptCount++;

      /* eslint-disable jest/no-conditional-expect */
      switch (promptCount) {
        case 1:
          expect(prompt).toEqual(
            "💿 Welcome to Remix! Let's get you set up with a new project."
          );
          break;
        case 2:
          expect(prompt).toEqual(
            `? Where would you like to create your app? (./${DEFAULT_APP_NAME})`
          );
          cli.stdin.write(keys.enter);
          break;

        case 3:
          // Where do you want to deploy? Choose Remix if you're unsure, it's
          // easy to change deployment targets.
          expect(getPromptChoices(prompt)).toEqual([
            "Remix App Server",
            "Express Server",
            "Architect (AWS Lambda)",
            "Fly.io",
            "Netlify",
            "Vercel",
            "Cloudflare Workers",
            "Cloudflare Pages",
          ]);
          cli.stdin.write(keys.enter);
          break;

        case 4:
          // TypeScript or JavaScript?
          expect(getPromptChoices(prompt)).toEqual([
            "TypeScript",
            "JavaScript",
          ]);
          cli.stdin.write(keys.enter);
          break;

        case 5:
          expect(prompt).toEqual(
            "? Do you want me to run `npm install`? (Y/n)"
          );
          cli.stdin.write("n");

          // At this point the CLI will create directories and all that fun stuff
          // TODO: We should actually test this stuff too, kinda a big deal
          cli.kill("SIGINT");
          break;
      }
      /* eslint-enable jest/no-conditional-expect */

      previousPrompt = prompt;
    });

    cli.on("exit", () => {
      done();
    });
  });

  describe("the --version flag", () => {
    it("prints the current version", async () => {
      let { stdout } = await execFile("node", [createRemix, "--version"]);
      expect(!!semver.valid(stdout.trim())).toBe(true);
    });
  });

  describe("the -v flag", () => {
    it("prints the current version", async () => {
      let { stdout } = await execFile("node", [createRemix, "-v"]);
      expect(!!semver.valid(stdout.trim())).toBe(true);
    });
  });

  describe("the --help flag", () => {
    it("prints help info", async () => {
      let { stdout } = await execFile("node", [createRemix, "--help"]);

      expect(stdout).toMatchInlineSnapshot(`
        "
          Create a new Remix app

          Usage:
            $ npx create-remix [flags...] [<dir>]

          If <dir> is not provided up front you will be prompted for it.

          Flags:
            --help, -h          Show this help message
            --version, -v       Show the version of this script
            --template, -t      The template to use for the app

          Examples:
            $ npx create-remix
            $ npx create-remix --template express-template
            $ npx create-remix --template :username/:repo
            $ npx create-remix --template https://github.com/:username/:repo
            $ npx create-remix --template https://github.com/:username/:repo/tree/:branch
            $ npx create-remix --template https://github.com/:username/:repo/archive/refs/tags/:tag.tar.gz
            $ npx create-remix --template https://example.com/remix-stack.tar.gz
            $ npx create-remix --template /my/remix-stack
            $ npx create-remix --template /my/remix-stack.tar.gz
            $ npx create-remix --template file:///Users/michael/michael-stackson.tar.gz

        "
      `);
    });
  });

  describe("the -h flag", () => {
    it("prints help info", async () => {
      let { stdout } = await execFile("node", [createRemix, "-h"]);
      expect(stdout).toMatchInlineSnapshot(`
        "
          Create a new Remix app

          Usage:
            $ npx create-remix [flags...] [<dir>]

          If <dir> is not provided up front you will be prompted for it.

          Flags:
            --help, -h          Show this help message
            --version, -v       Show the version of this script
            --template, -t      The template to use for the app

          Examples:
            $ npx create-remix
            $ npx create-remix --template express-template
            $ npx create-remix --template :username/:repo
            $ npx create-remix --template https://github.com/:username/:repo
            $ npx create-remix --template https://github.com/:username/:repo/tree/:branch
            $ npx create-remix --template https://github.com/:username/:repo/archive/refs/tags/:tag.tar.gz
            $ npx create-remix --template https://example.com/remix-stack.tar.gz
            $ npx create-remix --template /my/remix-stack
            $ npx create-remix --template /my/remix-stack.tar.gz
            $ npx create-remix --template file:///Users/michael/michael-stackson.tar.gz

        "
      `);
    });
  });
});

// These utils are a bit gnarly but they help me deal with the weirdness of node
// process stdout data formatting and inquirer. They're gross but make the tests
// easier to read than inlining everything IMO. Would be thrilled to delete them tho.
function cleanPrompt<T extends { toString(): string }>(data: T): string {
  return stripAnsi(data.toString())
    .trim()
    .split("\n")
    .map((s) => s.replace(/\s+$/, ""))
    .join("\n");
}

function getPromptChoices(prompt: string) {
  return prompt
    .slice(prompt.indexOf("❯") + 2)
    .split("\n")
    .map((s) => s.trim());
}

function isSamePrompt(
  currentPrompt: string,
  previousPrompt: string | undefined
) {
  if (previousPrompt === undefined) {
    return false;
  }

  let promptStart = previousPrompt.split("\n")[0];
  promptStart = promptStart.slice(0, promptStart.lastIndexOf("("));

  return currentPrompt.startsWith(promptStart);
}
