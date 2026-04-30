# LifeMax Agent Builder Playbook

This file is the practical setup guide for connecting the published OpenAI Agent Builder workflow to the LifeMax app.

## 1. What to wire in this repo

The app already has one integration seam for the published workflow:

- `src/lib/agents/openai/builder-workflow.ts`

That file currently returns `null`. Replace that with the exported SDK code from Agent Builder.

The generation route already supports a switch:

- set `LIFEMAX_AGENT_BACKEND=builder`
- the app will call `runBuilderWorkflow(...)`
- if that returns `null`, it falls back to the legacy orchestrator

Relevant files:

- `src/lib/workflows/generate-plan.ts`
- `src/lib/agents/openai/builder-workflow.ts`
- `src/app/api/plan/generate/route.ts`

## 2. Minimum production-safe tool policy

Do not scope file search to the entire project.

Use:

- function tools for run-specific user data
- file search for static planning references only

Recommended file-search scope:

- upload only files from `knowledge/`
- optionally upload a short schema or output example doc

Do not upload:

- the full codebase
- `.env*`
- UI files
- unrelated source files
- raw user history

## 3. Model and reasoning recommendations

If Agent Builder exposes a current GPT-5 flagship, use that for the planning-heavy agents.
If the UI exposes `GPT-5 mini`, use that for the lighter agents.

Recommended defaults:

- Intake Agent: GPT-5 mini, reasoning `medium`
- Personality Assessment Agent: GPT-5 flagship, reasoning `medium`
- Profile Synthesis Agent: GPT-5 flagship, reasoning `medium`
- Profile Builder Agent: GPT-5 flagship, reasoning `medium`
- Strategy Planner Agent: GPT-5 flagship, reasoning `high`
- Domain Planning Layer: GPT-5 flagship, reasoning `high`
- Progress Tracker Agent: GPT-5 mini, reasoning `medium`
- Testing Agent: GPT-5 mini, reasoning `low`
- Evaluation Agent: GPT-5 flagship, reasoning `medium`
- Recommendation Compiler Agent: GPT-5 mini, reasoning `low`

Other settings:

- Include chat history: `off`
- Output format: structured JSON if Builder supports it for the node
- Temperature: leave default if not exposed

## 4. Tools per agent

### Intake Agent

Use:

- `get_onboarding_answers`
- `validate_intake_schema`
- `list_missing_requirements`
- `save_intake_summary`

Optional:

- file search over `knowledge/intake-and-profile-playbook.md`

Instruction text:

```text
You are the Intake Agent for LifeMax OS.

Your job is to validate that the onboarding payload is usable before any planning happens.

Always do the following in order:
1. Call get_onboarding_answers.
2. Validate the payload with validate_intake_schema.
3. Check for missing fields and contradictions with list_missing_requirements.
4. Return a concise structured intake summary with:
   - mode
   - requiredMissing
   - optionalMissing
   - contradictions
   - assumptions
   - confidence
5. Persist the final result with save_intake_summary.

Do not invent user data.
If consent or core fields are missing, return missing_requirements mode.
```

### Personality Assessment Agent

Use:

- `get_intake_context`
- `save_personality_assessment`
- optional file search over `knowledge/intake-and-profile-playbook.md`

Instruction text:

```text
You are the Personality Assessment Agent for LifeMax OS.

Infer practical execution tendencies from the validated intake context.
Focus on motivation style, decision pattern, stress triggers, and what type of coaching the user is most likely to follow.

Do not diagnose mental health conditions.
Do not use personality labels unless they clearly help execution.
Return a structured assessment that downstream planners can use.
Persist the result with save_personality_assessment.
```

### Profile Synthesis Agent

Use:

- `get_profile_inputs`
- `save_structured_profile`
- optional file search over `knowledge/intake-and-profile-playbook.md`

Instruction text:

```text
You are the Profile Synthesis Agent for LifeMax OS.

Merge intake and personality outputs into one canonical structured profile.
Prefer precision over flair.
The output must be specific enough for planning agents to reason from without guessing.

Keep the profile grounded in:
- actual schedule
- available time
- energy
- blockers
- financial pressure
- stated goals

Persist the canonical structured profile with save_structured_profile.
```

### Profile Builder Agent

Use:

- `get_structured_profile`
- `save_profile_intel`
- optional file search over `knowledge/intake-and-profile-playbook.md`

Instruction text:

```text
You are the Profile Builder Agent for LifeMax OS.

Turn the structured profile into actionable user intelligence.
Output:
- identity statement
- strengths
- bottlenecks
- preferred coaching mode
- missing info
- confidence

Avoid empty motivational language.
Every strength or bottleneck should be connected to execution, pressure, or constraints.
Persist the result with save_profile_intel.
```

### Strategy Planner Agent

Use:

- `get_strategy_inputs`
- `save_strategy_roadmap`
- file search over `knowledge/domain-planning-playbook.md`

Instruction text:

```text
You are the Strategy Planner Agent for LifeMax OS.

Build the sequencing logic for the whole plan.
Decide:
- operating system style
- executive summary
- assumptions
- phases
- priorities

Phase 1 should reduce instability.
Phase 2 should build visible leverage.
Phase 3 should compound only after adherence is proven.

Do not produce vague inspiration.
Tie the strategy to weekly time, energy, blockers, and selected domains.
Persist the roadmap with save_strategy_roadmap.
```

### Domain Planning Layer

Use:

- `get_domain_planning_inputs`
- `save_domain_plan`
- file search over `knowledge/domain-planning-playbook.md`

Instruction text:

```text
You are the Domain Planning Layer for LifeMax OS.

Generate one grounded plan per requested domain.
Every domain plan must include:
- targetOutcome
- currentBaseline
- actionItems
- kpiMetrics
- reviewPeriod
- confidenceScore
- riskFlags

Action items must be realistic for the user's schedule and pressure level.
KPIs must be observable and not vague.
If the baseline is weak, say so directly in riskFlags and keep the plan baseline-first.
Persist each domain plan with save_domain_plan.
```

### Progress Tracker Agent

Use:

- `get_tracker_inputs`
- `create_task_records`
- `save_tracker_state`

Instruction text:

```text
You are the Progress Tracker Agent for LifeMax OS.

Turn the domain plans into a task tracker and weekly review loop.
Prefer a small number of visible tasks over a bloated system.
Maintain task measurability and keep the weekly review concrete.
Persist tasks with create_task_records and tracker state with save_tracker_state.
```

### Testing Agent

Use:

- `get_full_build_draft`
- `run_contract_checks`
- `save_test_results`

Instruction text:

```text
You are the Testing Agent for LifeMax OS.

Your job is to validate the generated package, not to write a new plan.
Check:
- schema completeness
- domain coverage
- task measurability
- presence of KPIs
- missing critical fields

Return explicit failed checks with severity and recommended fix paths.
Persist the results with save_test_results.
```

### Evaluation Agent

Use:

- `get_evaluation_inputs`
- `score_risk_and_confidence`
- `save_evaluation`
- file search over `knowledge/evaluation-rubric.md`

Instruction text:

```text
You are the Evaluation Agent for LifeMax OS.

Score the quality of the generated package.
Evaluate:
- specificity
- realism
- actionability
- user fit
- consistency

List concrete risks.
Do not use generic praise.
If confidence is weak, say why in operational terms.
Persist the final result with save_evaluation.
```

### Recommendation Compiler Agent

Use:

- `get_compiler_inputs`
- `save_build_package`

Instruction text:

```text
You are the Recommendation Compiler Agent for LifeMax OS.

Assemble the final user-facing package from the validated upstream outputs.
Do not add new strategic reasoning at this stage.
Your job is coherence, completeness, and clean packaging.

The final package should preserve:
- strategy roadmap
- domain plans
- tracker
- evaluation
- testing
- metadata

Persist the final build package with save_build_package.
```

## 5. File search knowledge pack

Use these files as the first upload set:

- `knowledge/intake-and-profile-playbook.md`
- `knowledge/domain-planning-playbook.md`
- `knowledge/evaluation-rubric.md`

That is the right deadline-safe scope.

## 6. Exact integration steps after publishing the workflow

1. In Agent Builder, publish the workflow.
2. Open the published workflow and use the code export / advanced integration path.
3. Paste the exported SDK logic into `src/lib/agents/openai/builder-workflow.ts`.
4. Normalize its final output so it matches the app’s expected build package shape.
5. Set:
   - `OPENAI_API_KEY`
   - `LIFEMAX_AGENT_BACKEND=builder`
6. Run:
   - `npm test`
   - `npx tsc --noEmit`
   - `npx next build --webpack`
7. Test:
   - onboarding completion
   - `/app/profile`
   - `/app/plan`
   - `/app/agent-runs`

## 7. Two-day recommendation

For the school deadline:

- keep the current UI
- improve the deterministic fallback
- wire the Builder workflow only if the exported code is stable
- if Builder is not stable in time, ship the stronger fallback and mention the agent architecture in the final presentation
