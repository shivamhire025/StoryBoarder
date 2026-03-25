# StoryBoarder — AI-Powered Storyboarding Tool

> Turn ideas into visual storyboards in seconds — powered by the Gemini API with full character and theme consistency across frames.

**[Live Demo](https://storyboard-shivam.vercel.app)** · **[GitHub](https://github.com/shivamhire025/StoryBoarder)**

---

## What it does

StoryBoarder is a browser-based creative tool that lets users generate multi-frame storyboards from text prompts or image inputs. The Gemini API maintains character and visual consistency across every frame — so your story looks like it belongs together, not like random generations.

Designed for creators, writers, animators, and anyone who thinks visually.

---

## Features

- **Text-to-storyboard** — describe your scene or story in natural language and generate a complete storyboard
- **Image input support** — upload reference images to anchor the visual direction of your frames
- **Character consistency** — characters remain visually consistent across all generated frames
- **Theme consistency** — art style, tone, and palette stay coherent throughout the storyboard
- **Frame count control** — choose how many frames to generate per session, giving you direct control over API credit usage
- **User authentication** — secure login so your storyboards are private to your account
- **Drafts system** — save works-in-progress and pick up where you left off across sessions
- **Export storyboard** — download your completed storyboard for use outside the app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript |
| AI | Gemini API (Google AI Studio) |
| Data | JSON |
| Deployment | Vercel |
| Version control | GitHub |

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/shivamhire025/StoryBoarder
cd StoryBoarder

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start the development server
npm run dev
```

---

## How frame control works

API costs are a real product constraint in generative tools. StoryBoarder treats this as a first-class design decision — users explicitly choose how many frames to generate before each session. This keeps usage transparent, prevents runaway API calls, and puts creative control in the user's hands.

---

## Why I built this

Storyboarding is a bottleneck for solo creators — it's time-consuming, requires drawing skills, and breaks creative flow. This project explores how multimodal AI can remove that bottleneck while keeping the creator in control of the output, the style, and the cost.

---

## Roadmap

- [ ] Scene-level prompt editing per frame
- [ ] Style presets (cinematic, anime, sketch, etc.)
- [ ] Collaborative storyboards (shared sessions)
- [ ] Video export from frame sequence

---

Built by [Shivam Hire](https://github.com/shivamhire025) · Toronto, ON
