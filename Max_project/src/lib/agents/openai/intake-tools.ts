import "server-only";

import { tool, toolNamespace } from "@openai/agents";
import { z } from "zod";
import {
  buildIntakeSummary,
  intakeMissingRequirementsSchema,
  intakeSummarySchema,
  intakeValidationResultSchema,
  listMissingRequirements,
  validateIntakeSchema
} from "@/lib/agents/tools/intake";
import { getOnboardingAnswers, saveIntakeSummary } from "@/lib/agents/tools/intake-storage";

const runIdSchema = z.object({
  run_id: z.string().uuid()
});

const onboardingPayloadSchema = z.object({
  payload: z.record(z.string(), z.unknown())
});

const intakeSummarySaveSchema = z.object({
  run_id: z.string().uuid(),
  summary: intakeSummarySchema
});

export const getOnboardingAnswersTool = tool({
  name: "get_onboarding_answers",
  description: "Load the persisted onboarding answers for a specific LifeMax plan run.",
  parameters: runIdSchema,
  execute: async ({ run_id }) => getOnboardingAnswers(run_id)
});

export const validateIntakeSchemaTool = tool({
  name: "validate_intake_schema",
  description: "Validate onboarding answers against the canonical LifeMax intake schema.",
  parameters: onboardingPayloadSchema,
  execute: async ({ payload }) => intakeValidationResultSchema.parse(validateIntakeSchema(payload))
});

export const listMissingRequirementsTool = tool({
  name: "list_missing_requirements",
  description:
    "Identify missing required fields, missing optional fields, and obvious contradictions in an intake payload.",
  parameters: onboardingPayloadSchema,
  execute: async ({ payload }) =>
    intakeMissingRequirementsSchema.parse(listMissingRequirements(payload))
});

export const saveIntakeSummaryTool = tool({
  name: "save_intake_summary",
  description: "Persist the final Intake Agent summary for a specific run.",
  parameters: intakeSummarySaveSchema,
  execute: async ({ run_id, summary }) => saveIntakeSummary(run_id, summary)
});

export const buildIntakeSummaryTool = tool({
  name: "build_intake_summary",
  description:
    "Build a deterministic intake summary from onboarding answers when the agent needs a normalized result payload.",
  parameters: onboardingPayloadSchema,
  execute: async ({ payload }) => intakeSummarySchema.parse(buildIntakeSummary(payload))
});

export const intakeTools = toolNamespace({
  name: "intake",
  description: "LifeMax intake validation and persistence tools.",
  tools: [
    getOnboardingAnswersTool,
    validateIntakeSchemaTool,
    listMissingRequirementsTool,
    buildIntakeSummaryTool,
    saveIntakeSummaryTool
  ]
});
