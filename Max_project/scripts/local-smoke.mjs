import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debuggingPort = 9222;
const appOrigin = "http://127.0.0.1:3000";

function createDeferred() {
  let resolve;
  const promise = new Promise((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    this.loadEvent = createDeferred();

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && this.pending.has(payload.id)) {
        const { resolve, reject } = this.pending.get(payload.id);
        this.pending.delete(payload.id);
        if (payload.error) {
          reject(new Error(payload.error.message));
        } else {
          resolve(payload.result);
        }
        return;
      }

      if (payload.method === "Page.loadEventFired") {
        this.loadEvent.resolve();
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    const message = { id, method, params };
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.socket.send(JSON.stringify(message));
    return promise;
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });

    return result.result?.value;
  }

  async navigate(url) {
    this.loadEvent = createDeferred();
    await this.send("Page.navigate", { url });
    await this.loadEvent.promise;
  }

  async waitFor(expression, timeoutMs = 10000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const value = await this.evaluate(expression);
      if (value) {
        return value;
      }
      await delay(100);
    }

    throw new Error(`Timed out waiting for expression: ${expression}`);
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

async function connectToChrome() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${debuggingPort}/json/list`);
      const pageTarget = targets.find((target) => target.type === "page");
      if (pageTarget?.webSocketDebuggerUrl) {
        return pageTarget.webSocketDebuggerUrl;
      }
    } catch {
      await delay(100);
    }
  }

  throw new Error("Chrome debugging endpoint did not become ready.");
}

async function runSmokeTest() {
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${debuggingPort}`,
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=/tmp/lifemax-headless-profile",
      "about:blank"
    ],
    { stdio: "ignore" }
  );

  try {
    const websocketUrl = await connectToChrome();
    const socket = new WebSocket(websocketUrl);

    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });

    const client = new CdpClient(socket);
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    await client.navigate(appOrigin);
    await client.evaluate(`window.localStorage.removeItem("lifemax-os-v2")`);

    await client.navigate(`${appOrigin}/onboarding/focus`);
    const initialDisabled = await client.waitFor(
      `(() => Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Continue" && button.disabled))()`
    );
    if (!initialDisabled) {
      throw new Error("Expected the first-step continue button to be disabled before consent.");
    }

    await client.evaluate(`
      (() => {
        const consent = document.querySelector('.checkbox-pill');
        if (!consent) return false;
        consent.click();
        return true;
      })()
    `);

    await client.waitFor(
      `(() => Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Continue" && !button.disabled))()`
    );
    await client.evaluate(`
      (() => {
        const continueButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Continue");
        continueButton?.click();
        return Boolean(continueButton);
      })()
    `);

    await client.waitFor(`window.location.pathname === "/onboarding/baseline"`);
    await client.evaluate(`
      (() => {
        const group = Array.from(document.querySelectorAll(".field-group")).find((node) => node.querySelector("label")?.textContent?.trim() === "Specific role");
        const input = group?.querySelector("input");
        if (!input) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        setter?.call(input, "Engineer");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        return true;
      })()
    `);
    await client.waitFor(
      `(() => Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Continue" && !button.disabled))()`
    );
    await client.evaluate(`
      (() => {
        const continueButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Continue");
        continueButton?.click();
        return Boolean(continueButton);
      })()
    `);

    for (const pathname of ["/onboarding/habits", "/onboarding/constraints", "/onboarding/review"]) {
      await client.waitFor(`window.location.pathname === "${pathname}"`);
      await client.evaluate(`
        (() => {
          const continueButton = Array.from(document.querySelectorAll("button")).find((button) =>
            ["Continue", "Create my plan"].includes(button.textContent?.trim() || "")
          );
          continueButton?.click();
          return Boolean(continueButton);
        })()
      `);
    }

    await client.waitFor(`window.location.pathname === "/onboarding/processing"`);
    try {
      await client.waitFor(`window.location.pathname === "/onboarding/complete"`, 120000);
    } catch (error) {
      const processingText = await client.evaluate(`(() => document.body.textContent)()`);
      throw new Error(`Processing did not complete. Page text: ${processingText}`);
    }

    const completeHeading = await client.evaluate(`
      (() => document.querySelector("h1")?.textContent?.trim())()
    `);

    if (completeHeading !== "Your first workspace is ready.") {
      throw new Error(`Unexpected completion heading: ${completeHeading}`);
    }

    await client.evaluate(`
      (() => {
        const link = Array.from(document.querySelectorAll("a")).find((node) => node.textContent?.trim() === "View plan");
        link?.click();
        return Boolean(link);
      })()
    `);
    await client.waitFor(`window.location.pathname === "/app/plan"`);

    const pageContainsPlan = await client.evaluate(`
      (() => {
        const text = document.body.textContent || "";
        return (
          text.includes("Roadmap") ||
          text.includes("Domain plan") ||
          text.includes("Open current plan") ||
          text.includes("No active workspace")
        );
      })()
    `);

    if (!pageContainsPlan) {
      throw new Error("Plan page did not render expected content after onboarding.");
    }

    await client.evaluate(`
      (() => {
        const raw = window.localStorage.getItem("lifemax-os-v2");
        if (!raw) return false;
        const state = JSON.parse(raw);
        if (!state.buildPackage) return false;
        state.buildPackage = { ...state.buildPackage };
        delete state.buildPackage.workflowMeta;
        window.localStorage.setItem("lifemax-os-v2", JSON.stringify(state));
        return true;
      })()
    `);

    await client.navigate(`${appOrigin}/app/profile`);
    await client.waitFor(`
      (() => {
        const text = document.body.textContent || "";
        return text.includes("Profile intelligence") || text.includes("This run is missing a synthesized evaluation summary.");
      })()
    `);

    const profilePageText = await client.evaluate(`(() => document.body.textContent || "")()`);
    if (profilePageText.includes("undefined is not an object") || profilePageText.includes("Cannot read properties of undefined")) {
      throw new Error("Profile page still crashes when workflowMeta.agentAssessment is missing.");
    }

    if (!profilePageText.includes("This run is missing a synthesized evaluation summary.")) {
      throw new Error(`Profile page did not render the missing-evaluation fallback summary. Page text: ${profilePageText}`);
    }

    await client.navigate(`${appOrigin}/app`);
    await delay(300);
    const appPageText = await client.evaluate(`(() => document.body.textContent || "")()`);
    if (appPageText.includes("Hydration failed because the server rendered text didn't match the client")) {
      throw new Error("App shell still shows a hydration mismatch after loading persisted demo state.");
    }

    socket.close();
    console.log("Smoke test passed.");
  } finally {
    chrome.kill("SIGKILL");
  }
}

runSmokeTest().catch((error) => {
  console.error(error);
  process.exit(1);
});
