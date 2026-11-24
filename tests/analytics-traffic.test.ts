import { test } from "node:test";
import assert from "node:assert/strict";
import {
  automatedTraffic,
  internalTraffic,
} from "../supabase/functions/_shared/traffic";
import {
  ignoreBrowserTraffic,
  setExcludeThisBrowser,
} from "../src/lib/analytics-traffic";
const safari =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const chrome =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
test("Filtra robos, previews e monitores sem confundir navegadores reais", () => {
  for (const ua of [
    "Googlebot/2.1",
    "Mozilla/5.0 (compatible; GPTBot/1.0)",
    "ChatGPT-User/1.0",
    "Claude-User/1.0",
    "facebookexternalhit/1.1",
    "WhatsApp/2.0",
    "TelegramBot",
    "HeadlessChrome/142",
    "python-requests/2.32",
    "curl/8.1",
    "node",
    "undici",
    "UptimeRobot/2.0",
    "",
  ])
    assert.equal(automatedTraffic(ua), true, ua);
  for (const ua of [
    safari,
    chrome,
    chrome + " Edg/142.0",
    safari + " Instagram 350.0",
    safari + " GSA/350.0",
  ])
    assert.equal(automatedTraffic(ua), false, ua);
  assert.equal(
    internalTraffic(
      new Headers({ "user-agent": chrome, "x-ta-rolando-traffic": "internal" }),
    ),
    true,
  );
  assert.equal(internalTraffic(new Headers({ "user-agent": chrome })), false);
});
test("Exclusao explicita e automatizada no navegador preserva visitantes comuns", () => {
  const originals = ["window", "navigator", "location", "localStorage"].map(
    (k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)] as const,
  );
  const storage = new Map<string, string>();
  let location = { search: "", hash: "#/evento/teste" },
    navigator = { userAgent: safari, webdriver: false };
  try {
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: navigator,
      configurable: true,
    });
    Object.defineProperty(globalThis, "location", {
      value: location,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (k: string) => storage.get(k) || null,
        setItem: (k: string, v: string) => storage.set(k, v),
        removeItem: (k: string) => storage.delete(k),
      },
      configurable: true,
    });
    assert.equal(ignoreBrowserTraffic(), false);
    navigator.webdriver = true;
    assert.equal(ignoreBrowserTraffic(), true);
    navigator.webdriver = false;
    location.search = "?trafego=interno";
    assert.equal(ignoreBrowserTraffic(), true);
    location.search = "";
    location.hash = "#/evento/teste?trafego=interno";
    assert.equal(ignoreBrowserTraffic(), true);
    location.hash = "#/evento/teste";
    assert.equal(setExcludeThisBrowser(true), true);
    assert.equal(ignoreBrowserTraffic(), true);
    assert.equal(setExcludeThisBrowser(false), true);
    assert.equal(ignoreBrowserTraffic(), false);
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
