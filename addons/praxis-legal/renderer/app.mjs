const question = document.querySelector("#question");
const submit = document.querySelector("#ask-praxis");
const checkConnection = document.querySelector("#check-connection");
const status = document.querySelector("#status");
const answer = document.querySelector("#answer");

function showStatus(message, error = false) {
  status.textContent = message;
  status.dataset.state = error ? "error" : "ready";
}

async function refreshConnection() {
  try {
    const servers = await window.addonAPI.mcp.listServers();
    const praxis = servers.find((server) => server.name === "praxis-legal" && server.connected);
    submit.disabled = !praxis;
    showStatus(praxis ? "Praxis is connected." : "Connect the Praxis Legal MCP server in Mosaic settings first.", !praxis);
  } catch {
    submit.disabled = true;
    showStatus("Could not check the Praxis connection.", true);
  }
}

try {
  await window.addonAPI.init();
  await refreshConnection();
} catch {
  submit.disabled = true;
  showStatus("Could not check the Praxis connection.", true);
}
checkConnection.addEventListener("click", refreshConnection);

submit.addEventListener("click", async () => {
  const text = question.value.trim();
  if (!text || text.length > 4_000) {
    showStatus("Enter a question of 1–4,000 characters.", true);
    return;
  }
  submit.disabled = true;
  answer.textContent = "";
  showStatus("Asking Praxis…");
  try {
    const result = await window.addonAPI.mcp.callTool("praxis-legal", "ask_praxis", { question: text });
    const response = result?.content?.filter((item) => item.type === "text").map((item) => item.text).join("\n\n");
    if (result?.isError || !response) throw new Error(response || "Praxis returned no answer.");
    answer.textContent = response;
    showStatus("Praxis answered.");
  } catch (error) {
    showStatus(error.message || "Praxis could not answer.", true);
  } finally {
    submit.disabled = false;
  }
});
