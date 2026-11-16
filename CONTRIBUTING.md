# Contributing

Thanks for helping improve The Adventurer's Hub. The project currently uses \`develop\` as its integration branch; pull requests should target \`develop\`. \`main\` is reserved for stable releases.

## Local setup

1. Install Python 3.12+, Node.js 20+, npm, and a local MongoDB instance.
2. Create and activate a Python virtual environment, then install backend dependencies:

   \`\`\`bash
   python -m venv .venv
   # Windows PowerShell: .\.venv\Scripts\Activate.ps1
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   \`\`\`

3. Copy \`.env.example\` to \`.env\` and set a new, private \`SECRET_KEY\`. Add provider keys only when using those integrations.
4. Install frontend dependencies and start the development server:

   \`\`\`bash
   cd frontend
   npm ci
   # Copy .env.example to .env if local URL overrides are needed.
   npm run dev
   \`\`\`

5. In a second terminal, start the backend with \`python app.py\`.

## Before opening a pull request

Run the checks that apply to your change:

\`\`\`bash
python -m py_compile app.py
cd frontend
npm run lint
npm run build
\`\`\`

The repository does not yet have an automated test suite. Do not describe a check as passing unless it was actually run. Never commit \`.env\` files, credentials, local databases, generated assets, or personal server addresses.

## Pull requests

- Create a focused branch from the latest \`develop\` (\`feat/\`, \`fix/\`, \`docs/\`, or \`chore/\`).
- Explain the user-visible or operational impact and list the checks you ran.
- Include screenshots for UI changes and update documentation when setup or behavior changes.
- Keep licensing and attribution details with any third-party rules, images, or other content you add.
