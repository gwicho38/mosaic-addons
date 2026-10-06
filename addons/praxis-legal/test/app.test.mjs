import assert from "node:assert/strict";
import test from "node:test";

function element() {
  const handlers = new Map();
  return {
    value: "", textContent: "", dataset: {}, disabled: false,
    addEventListener(name, handler) { handlers.set(name, handler); },
    async trigger(name) { await handlers.get(name)?.(); },
  };
}

async function loadApp(connected = true) {
  const elements = new Map([["#question", element()], ["#ask-praxis", element()], ["#check-connection", element()], ["#status", element()], ["#answer", element()]]);
  const calls = [];
  let serverConnected = connected;
  globalThis.document = { querySelector: (selector) => elements.get(selector) };
  globalThis.window = { addonAPI: {
    init: async () => ({}),
    mcp: {
      listServers: async () => [{ name: "praxis-legal", connected: serverConnected }],
      callTool: async (...args) => { calls.push(args); return { content: [{ type: "text", text: "Praxis answer" }] }; },
    },
  } };
  await import(`../renderer/app.mjs?case=${Math.random()}`);
  return { elements, calls, connect: () => { serverConnected = true; } };
}

test("sends the question through the MCP tool and shows the answer", async () => {
  const { elements, calls } = await loadApp();
  assert.equal(elements.get("#ask-praxis").disabled, false);
  elements.get("#question").value = "What is the rule?";
  await elements.get("#ask-praxis").trigger("click");
  assert.deepEqual(calls, [["praxis-legal", "ask_praxis", { question: "What is the rule?" }]]);
  assert.equal(elements.get("#answer").textContent, "Praxis answer");
});

test("disables the call when the MCP server is disconnected", async () => {
  const { elements } = await loadApp(false);
  assert.equal(elements.get("#ask-praxis").disabled, true);
});

test("enables the call after a server is connected later", async () => {
  const { elements, connect } = await loadApp(false);
  connect();
  await elements.get("#check-connection").trigger("click");
  assert.equal(elements.get("#ask-praxis").disabled, false);
  assert.equal(elements.get("#status").textContent, "Praxis is connected.");
});
