# MyFunds Portfolio Tracker

![Project Status: MVP-1 Planning](https://img.shields.io/badge/status-MVP--1%20Planning-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

A web application for tracking your diversified financial portfolio, providing a consolidated view of your assets, sector allocation, and market performance in one place.

## 📖 Table of Contents

- [Project Description](#-project-description)
- [✨ Key Features (MVP)](#-key-features-mvp)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Getting Started Locally](#-getting-started-locally)
- [📜 Available Scripts](#-available-scripts)
- [🗺️ Project Scope (MVP-1)](#-project-scope-mvp-1)
- [⚖️ License](#-license)

##  descriptions Project Description

MyFunds solves the problem of tracking a diversified investment portfolio spread across multiple asset classes (stocks, crypto, etc.) and currencies. It allows users to manually input their holdings and provides a single, unified dashboard to:

* View the total portfolio value in a single currency (USD or PLN).
* Analyze the portfolio's allocation across different sectors.
* Monitor a custom watchlist of assets on a single page.

This project is the **MVP-1** build, focusing on core aggregation and visualization features.

## ✨ Key Features (MVP)

* **Portfolio CRUD:** Manually add, edit, and delete your asset holdings (e.g., "10 AAPL", "1.5 BTC").
* **Currency Conversion:** View your total portfolio value in either **USD** (default) or **PLN**, with automatic conversion based on cached exchange rates.
* **Sector Management:** Create custom sectors (e.g., "Technology," "Crypto") and assign your assets to them to see your allocation.
* **Watchlist Grid:** A dedicated page with a 4x4 grid (up to 16 assets) displaying price charts for assets you want to follow.
* **Drag & Drop:** Reorganize your watchlist grid using drag-and-drop functionality.
* **User Authentication:** Secure user accounts (registration, login) provided by Supabase.

## 🛠️ Tech Stack

This project uses a modern, performant, and scalable tech stack.

| Category | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | [Astro](https://astro.build/) | `v5.x` | Core framework for building the fast, content-focused site. |
| **UI Library** | [React](https://react.dev/) | `v19.x` | Used for interactive "UI islands" (e.g., the portfolio dashboard, chart grid). |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `v5.x` | For strong typing and developer productivity. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `v4.x` | A utility-first CSS framework for rapid styling. |
| **UI Components** | [Shadcn/ui](https://ui.shadcn.com/) | - | A library of accessible, unstyled components. |
| **Backend (BaaS)** | [Supabase](https://supabase.com/) | - | Provides PostgreSQL database, authentication, and instant APIs. |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | - | For automating build, test, and deployment pipelines. |
| **Hosting** | [DigitalOcean](https://www.digitalocean.com/) | - | Target platform for hosting the production Docker image. |

## 🚀 Getting Started Locally

To run a local instance of MyFunds, you will need Node.js (v18+), npm, and the [Supabase CLI](https://supabase.com/docs/guides/cli) installed.

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```md
.
├── src/
│   ├── layouts/    # Astro layouts
│   ├── pages/      # Astro pages
│   │   └── api/    # API endpoints
│   ├── components/ # UI components (Astro & React)
│   └── assets/     # Static assets
├── public/         # Public assets
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
