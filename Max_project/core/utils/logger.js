export function createLog(agentName, inputSummary, outputSummary, startedAt, successFlag = true, extras = {}) {
  return {
    id: `${agentName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agentName,
    inputSummary,
    outputSummary,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - new Date(startedAt).getTime(),
    successFlag,
    ...extras
  };
}
