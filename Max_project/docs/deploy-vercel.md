# Deploy LifeMax To Vercel

This is the fastest path to a public URL for the school deadline.

## 1. Push the repo

1. Commit your changes locally.
2. Push the repo to GitHub.

## 2. Import into Vercel

1. Go to Vercel.
2. Click `Add New -> Project`.
3. Import the GitHub repository.
4. Keep the project root as the repo root.

## 3. Configure environment variables

Set at minimum:

- `OPENAI_API_KEY`
- `LIFEMAX_AGENT_BACKEND=legacy`

Optional if you want persistence:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional if you want Clerk:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Optional if you want Inngest:

- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

## 4. First deploy

1. Click `Deploy`.
2. Wait for the build to finish.
3. Open the production URL.

## 5. Smoke test the public site

Verify:

- `/`
- `/onboarding/welcome`
- complete the onboarding flow
- `/app/profile`
- `/app/plan`
- `/app/settings`
- `/app/agent-runs`

## 6. When the Builder workflow is ready

1. Paste the exported workflow code into `src/lib/agents/openai/builder-workflow.ts`.
2. Change `LIFEMAX_AGENT_BACKEND=builder` in Vercel env vars.
3. Redeploy.
4. Re-run the same smoke test.

## 7. Deadline-safe fallback

If the Builder workflow is not ready in time:

- leave `LIFEMAX_AGENT_BACKEND=legacy`
- ship the improved deterministic planner
- explain in your final submission that the published Builder workflow is the next backend swap because the integration seam already exists
