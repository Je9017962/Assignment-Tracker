# 📅 Assignment Tracker

**A weekly assignment tracker for college students — built in one session using AI-assisted development.**

🔗 [Live Demo](https://assignmenttrackerapp.netlify.app/) · 

---

## What it does

- **Individual & group views** — toggle between your own assignments and shared group projects
- **Group creation & joining** — create a group, get a shareable code, teammates join with that code
- **Subtasks per assignment** — break any assignment into steps and assign each one to a specific person
- **Syllabus PDF import** — upload a PDF syllabus and AI extracts all assignments and due dates for the week automatically
- **Due times with alerts** — set exact due times; assignments turn amber when due within 3 hours and red when overdue
- **Course color coding** — each course gets a persistent color stripe and pill badge so you can scan the week at a glance
- **Live stats bar** — total, done, in-progress, and due-today counts update in real time
- **Dark mode** — full dark/light theme toggle persisted across sessions
- **In-app notifications** — toast messages and a confirm dialog replace all native browser popups

---

## Tech stack

**Frontend:** HTML, CSS, Vanilla JavaScript — zero dependencies, zero build step

**AI:** Anthropic Claude API (`claude-sonnet-4-20250514`) for syllabus PDF parsing

**Fonts:** Google Fonts (DM Sans + DM Mono)

**Deployment:** Netlify

---

## What I'd do differently

Persist data in `localStorage` so assignments survive a page refresh. I'd also move the API key server-side so syllabus import is safe for public use, and build a proper mobile layout for phone use during class.

---

## Project structure

```
assignment-tracker/
├── index.html    # Markup and page structure
├── styles.css    # All styling, CSS variables, dark mode, animations
└── app.js        # State, logic, rendering, and API calls
```

The project started as a single `index.html` file and was refactored into three separated files for maintainability. HTML, CSS, and JS are fully decoupled.

---

## Running it locally

No build tools required. Open `index.html` in a browser, or serve it with any static file server:

```bash
# Python
python -m http.server 3000

# Node
npx serve .
```

---

## Building this project

Built entirely through a conversational AI workflow — planned, built, iterated, debugged, and refactored all within a single AI chat session. Key iterations:

- Weekly tracker with individual and group views
- Group creation, join-by-code, and subtasks per assignment
- Syllabus PDF upload with AI extraction, due-time alerts, and course color coding
- Bug review and fixes (date calculation, event propagation, stale selects)
- Refactored from a single file into `index.html` / `styles.css` / `app.js`
- Replaced all native `alert()`, `confirm()`, and `prompt()` calls with in-app toasts and a confirm dialog

The full AI transcript is included in the course submission.

---
