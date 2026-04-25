# Assignment Tracker

A weekly assignment tracker for college students — built in one session using AI-assisted development.

## Features

- **Individual & group views** — toggle between personal assignments and shared group projects
- **Group creation & joining** — create a group and share a code for teammates to join
- **Subtasks per assignment** — break down each assignment into steps, assign them to specific people
- **Syllabus PDF import** — upload a PDF syllabus and AI extracts all assignments for the week automatically
- **Due times with alerts** — set exact due times; overdue and due-soon warnings appear automatically
- **Course color coding** — each course gets a unique color stripe and pill badge for quick scanning
- **Live stats bar** — total, done, in-progress, and due-today counts update in real time

## Tech stack

- Vanilla HTML, CSS, JavaScript — zero dependencies, zero build step
- Anthropic Claude API (`claude-sonnet-4-20250514`) for syllabus PDF parsing
- Google Fonts (DM Sans + DM Mono)

## Deploy in 5 minutes

### Option A — Netlify Drop (easiest)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `index.html` file onto the page
3. Your app is live instantly — copy the URL for your portfolio

### Option B — GitHub Pages
1. Create a new GitHub repo
2. Upload `index.html` to the repo root
3. Go to **Settings → Pages → Source → main branch**
4. Your site is live at `https://yourusername.github.io/repo-name`

### Option C — Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project folder
3. Follow the prompts — deployed in under a minute

## Syllabus import setup

The syllabus PDF import feature calls the Anthropic API directly from the browser.  
To use it, you need an Anthropic API key.

> **Note for production use**: Never expose API keys in client-side code for a public app.  
> For a class project demo this works fine, but for a real deployment you'd proxy requests  
> through a small backend (e.g. a Vercel serverless function).

The app works fully without an API key — syllabus import just won't function.

## Project structure

```
assignment-tracker/
└── index.html    # Everything — HTML, CSS, JS in one file
```

## Building this project

This project was built entirely through a conversational AI workflow.  
See the full AI transcript in the course submission for the complete build log,  
including all iterations, bug fixes, and feature additions.

## License

MIT
