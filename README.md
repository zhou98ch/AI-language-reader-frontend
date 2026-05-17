# German Context Reader
__!!Note!!__: This Frontend APP is almost 95% AI generated, for for quickly prototyping.

A simple German reading app for saving texts and generating context-aware word explanations with AI.
## Backend
check another repo: https://github.com/zhou98ch/AI-language-reader-backend

## Features

- Upload and save German text documents
- View saved texts
- Click words in a text to generate short inline explanations
- Ask custom prompts for selected words
- Save explanation history
- Edit saved explanations
- Cache repeated explanations using document position, provider, explanation type, and prompt hash
- Gemini API integration through an AI provider registry

## Tech Stack

### Frontend
- React
- TypeScript
- Vite

## Frontend Setup
```
cd frontend
npm install
npm run dev
```
configure:

VITE_API_BASE_URL=https://your-backend-domain/api