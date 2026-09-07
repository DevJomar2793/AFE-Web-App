Developer Profile

I am a Junior Full Stack Developer and I am still learning programming fundamentals.

My goal is to build real-world applications while understanding the code that I write.

Please write code that is:

Simple
Readable
Maintainable
Beginner-friendly
Practical
Easy to debug

Most important rule:

Choose the simplest correct solution.

Do not over-engineer the application.

My Technology Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Backend
Python
FastAPI
Database
PostgreSQL
Mobile
React Native
General Coding Rules

1. Keep Code Simple

Prefer straightforward code over clever code.

Avoid unnecessary:

Abstractions
Design patterns
Custom frameworks
Utility functions
Generic types
Hooks
Classes
Layers
Dependencies

If a simple function can solve the problem, use a simple function.

2. Do Not Over-Engineer

Do not build an architecture for problems that do not exist yet.

For example, do not create:

Controller
Service
Repository
Factory
Adapter
Strategy
Manager
Helper

unless there is a real reason to use them.

Start simple.

We can refactor later when the project actually needs it.

3. Use Existing Technologies

Prefer my existing stack:

Next.js
React
TypeScript
Tailwind CSS
React Native
FastAPI
PostgreSQL

Do not introduce a new framework or library unless it provides a clear benefit.

Before adding a significant dependency, explain:

Why it is needed
What problem it solves
Whether the existing stack can solve the problem
TypeScript Rules

Use TypeScript properly, but keep the types easy to understand.

Prefer:

interface User {
id: number;
name: string;
email: string;
}

over unnecessarily complicated generic types.

Avoid:

<T extends Record<string, unknown>>

or other advanced TypeScript patterns unless they are actually necessary.

Avoid any

Do not use:

const data: any

unless there is no reasonable alternative.

Prefer proper types.

React Rules

Use functional components.

Prefer simple components:

function UserCard({ user }: UserCardProps) {
return (
<div>
<h2>{user.name}</h2>
<p>{user.email}</p>
</div>
);
}

Avoid unnecessary:

Custom hooks
Context providers
State management libraries
Component abstractions

Do not create a custom hook for a small piece of logic that is only used once.

Next.js Rules

Follow the existing Next.js project structure.

Do not change the project architecture unless necessary.

Use Server Components and Client Components appropriately.

Use "use client" only when needed.

For example, use "use client" when the component needs:

useState
useEffect
Browser APIs
Event-driven client-side behavior

Do not automatically make every component a Client Component.

Keep pages and components simple.

Tailwind CSS Rules

Use Tailwind CSS for styling.

Prefer readable class names.

Example:

<button
className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"

> Save
> </button>

Avoid creating complicated styling systems for simple components.

Do not introduce another CSS framework unless specifically requested.

FastAPI Rules

Keep FastAPI endpoints easy to understand.

Prefer straightforward routes:

@router.get("/users")
async def get_users():
users = await get_users_from_database()
return users

Use Pydantic models for request and response validation.

Example:

class UserCreate(BaseModel):
name: str
email: str

Keep API responsibilities clear.

Avoid unnecessary layers unless the project requires them.

Python Rules

Use simple and readable Python.

Prefer:

if user is None:
raise HTTPException(
status_code=404,
detail="User not found"
)

instead of clever one-line solutions that are harder for a beginner to understand.

Use clear variable names.

Prefer:

user_id
user_name
created_user

instead of:

uid
un
cu

unless the shorter name is a common convention.

PostgreSQL Rules

Use PostgreSQL as the primary database.

Database design should be simple and normalized.

Use clear table and column names.

Example:

users
products
orders
order_items

Prefer clear relationships:

users
↓
orders
↓
order_items
↓
products

Do not create unnecessary tables or relationships.

Always consider:

Primary keys
Foreign keys
Required fields
Nullable fields
Appropriate data types
Unique constraints
Database Changes

When modifying the database:

Explain what is changing.
Explain why it is needed.
Update the model.
Create/update the migration if the project uses migrations.
Keep existing data in mind.

Do not casually delete or recreate tables.

Never drop production data unless explicitly instructed.

API Design

Use simple REST-style endpoints.

Example:

GET /users
GET /users/{id}
POST /users
PUT /users/{id}
DELETE /users/{id}

Keep endpoint names predictable.

Use appropriate HTTP status codes.

Example:

200 OK
201 Created
400 Bad Request
404 Not Found
500 Internal Server Error
Frontend ↔ Backend

Keep the data flow easy to understand:

Next.js / React
↓
API Request
↓
FastAPI
↓
Business Logic
↓
PostgreSQL

When creating an API integration, clearly define:

Request data
API endpoint
Response data
Error handling

Do not hide important API behavior behind excessive abstractions.

Error Handling

Handle errors clearly.

Frontend should show useful messages to users.

Backend should return meaningful HTTP errors.

Example:

raise HTTPException(
status_code=404,
detail="Product not found"
)

Avoid exposing sensitive information in API errors.

Do not silently ignore errors.

Authentication

When implementing authentication:

Keep the implementation understandable.
Do not create unnecessary authentication layers.
Never hardcode passwords, tokens, or secrets.
Use environment variables for sensitive configuration.

Example:

DATABASE_URL=...
SECRET_KEY=...

Never commit .env files containing real secrets.

Environment Variables

Use .env for local configuration.

Example:

DATABASE_URL=postgresql://...
API_URL=http://localhost:8000
SECRET_KEY=...

Provide .env.example when appropriate.

Example:

DATABASE_URL=
API_URL=
SECRET_KEY=

Never expose real credentials in source code.

File Organization

Keep the folder structure simple.

A reasonable full-stack structure is:

project/
│
├── frontend/
│ ├── app/
│ ├── components/
│ ├── lib/
│ └── types/
│
├── backend/
│ ├── app/
│ │ ├── api/
│ │ ├── models/
│ │ ├── schemas/
│ │ └── main.py
│ │
│ └── migrations/
│
├── AGENTS.md
├── .env.example
└── README.md

Do not create folders just for the sake of having a "clean architecture."

Debugging Rules

When I report an error, do NOT immediately rewrite large parts of the application.

Follow this process:

Step 1 — Identify the Error

Explain what the error means in simple terms.

Step 2 — Find the Cause

Identify the most likely cause.

Step 3 — Locate the Problem

Tell me:

File:
Function:
Line/area:

when possible.

Step 4 — Apply the Smallest Fix

Change only what is necessary.

Step 5 — Explain the Fix

Briefly explain why the fix works.

When Modifying Existing Code

Before changing code:

Read the relevant files.
Understand the existing implementation.
Reuse existing patterns.
Make the smallest reasonable change.

Do not rewrite unrelated code.

Do not rename variables, files, APIs, or components unless necessary.

Do not change the architecture without a good reason.

Learning Mode

I am using Codex not only to build applications but also to learn programming.

When introducing an unfamiliar concept, briefly explain it.

For example:

This uses async/await because the API call is asynchronous.

async allows the function to perform asynchronous work.

await waits for the result without blocking the application.

Keep explanations simple.

Do not give extremely advanced explanations unless I ask for them.

Explain Advanced Code

If advanced code is necessary, explain why it is being used.

For example:

I am using a dependency here because FastAPI
can use it to share authentication logic between routes.

Do not introduce advanced patterns without explanation.

Code Comments

Do not add comments to every line.

Only add comments when they explain something that is not obvious.

Bad:

# Get user

user = get_user()

Good:

# We need the current user before checking ownership.

user = get_user()
Testing

When adding an important feature, suggest simple tests or verification steps.

For example:

1. Start the backend.
2. Start the frontend.
3. Open the login page.
4. Enter valid credentials.
5. Verify the API response.
6. Verify the user is redirected.

Do not create an extremely complicated testing architecture unless requested.

Git Rules

Do not modify Git history unless explicitly requested.

Do not run destructive commands such as:

git reset --hard
git clean -fd

without explicit permission.

Do not delete uncommitted work.

When appropriate, suggest a commit message.

Example:

feat: add user login
fix: resolve product API error
refactor: simplify user service
Security Rules

Never hardcode:

Passwords
API keys
Database credentials
Secret keys
Access tokens

Do not expose secrets in frontend code.

Do not log sensitive information.

Validate user input.

Use parameterized queries or the project's ORM/database layer.

Before Installing Dependencies

Do not install a package automatically just because it makes the implementation easier.

First check whether the current stack can solve the problem.

If a package is genuinely useful, explain:

Package:
Why we need it:
What problem it solves:
Alternative:

Then install it if appropriate.

Before Making Major Changes

If a change affects:

Database architecture
Authentication
API architecture
Folder structure
Major dependencies
Deployment
Existing features

First explain the proposed change and its impact.

Avoid making large architectural changes without justification.

Communication Style

When working with me, keep explanations:

Simple
Direct
Practical
Beginner-friendly

Use examples when helpful.

Avoid unnecessary technical jargon.

If you use a technical term that I may not know, explain it briefly.

Priority Order

When making technical decisions, prioritize:

Correctness
Simplicity
Readability
Maintainability
Security
Performance
Scalability

Do not sacrifice simplicity for hypothetical future scalability.

Final Rule

I am a Junior Full Stack Developer.

Do not write code as if you are working with a Senior Developer.

Write code that I can:

Read
Understand
Debug
Modify
Maintain
Learn from

Choose the simplest correct solution first.

If a more advanced solution is genuinely necessary, explain why before implementing it.
