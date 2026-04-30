import type { AuthMode } from "@/lib/auth/types";
import { z } from "zod";
import { onboardingAnswerSchema } from "@/lib/schemas/onboarding";
import { interactiveAgentKeys } from "@/lib/agents/openai/agent-chat";

const authModeSchema: z.ZodType<AuthMode> = z.enum(["demo", "clerk", "supabase"]);

export const onboardingDraftRequestSchema = z.object({
  ownerKey: z.string().min(1),
  authMode: authModeSchema,
  lastStep: z.string().optional(),
  answers: onboardingAnswerSchema.partial()
});

export const planGenerateRequestSchema = z.object({
  ownerKey: z.string().min(1),
  authMode: authModeSchema,
  previousState: z.unknown().optional().nullable(),
  answers: onboardingAnswerSchema,
  planningMode: z.enum(["stable", "ai"]).optional()
});

export const agentConversationRequestSchema = z.object({
  agentKey: z.enum(interactiveAgentKeys),
  message: z.string().min(1).max(2_000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4_000)
      })
  )
    .max(12)
    .default([]),
  buildPackage: z.unknown()
});

const workspaceStateSchema = z.object({
  browserId: z.string().optional().default(""),
  onboardingAnswers: z.record(z.string(), z.unknown()).default({}),
  buildPackage: z.unknown().nullable().optional().default(null),
  latestRun: z.unknown().nullable().optional().default(null),
  history: z
    .array(
      z.object({
        id: z.string().min(1),
        createdAt: z.string().min(1),
        workflowStatus: z.string().min(1),
        confidence: z.number(),
        title: z.string().min(1)
      })
    )
    .default([]),
  contactMessages: z.array(z.record(z.string(), z.string())).default([]),
  checkIns: z
    .array(
      z.object({
        id: z.string().min(1),
        createdAt: z.string().min(1),
        kind: z.enum(["daily", "weekly"]).optional(),
        energy: z.string().min(1),
        adherence: z.string().min(1),
        clarity: z.string().min(1),
        focus: z.string().default(""),
        focusAreas: z.array(z.string()).optional(),
        win: z.string().default(""),
        blocker: z.string().default(""),
        note: z.string().default(""),
        reflections: z
          .array(
            z.object({
              category: z.string().min(1),
              answers: z.record(z.string(), z.string()),
              blocker: z.string().optional(),
              completionRating: z.string().optional()
            })
          )
          .optional(),
        summary: z
          .object({
            completedActions: z.array(z.string()).default([]),
            skippedAreas: z.array(z.string()).default([]),
            blockers: z.array(z.string()).default([]),
            nextRecommendedActions: z.array(z.string()).default([]),
            impactedDomains: z.array(z.string()).default([])
          })
          .optional()
      })
    )
    .default([]),
  domainUpdates: z
    .array(
      z.object({
        id: z.string().min(1),
        domain: z.string().min(1),
        createdAt: z.string().min(1),
        kind: z.enum(["proof", "standard", "review"]),
        note: z.string().default("")
      })
    )
    .default([]),
  preferences: z.object({
    appearance: z.enum(["sunrise", "ember", "midnight"]).default("midnight"),
    appearanceSelection: z.enum(["default", "user"]).optional(),
    planningMode: z.enum(["stable", "ai"]).optional().default("stable")
  }),
  session: z
    .object({
      authenticated: z.boolean().default(false),
      user: z
        .object({
          id: z.string().min(1),
          name: z.string().min(1),
          email: z.string().min(1),
          mode: authModeSchema
        })
        .nullable()
        .optional()
    })
    .optional()
});

export const workspaceStateRequestSchema = z.object({
  state: workspaceStateSchema
});

export const workspaceDeleteRequestSchema = z.object({
  target: z.enum(["profile", "account"])
});
