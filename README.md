# ZenBullet

**ZenBullet** is a minimalist, AI-powered personal productivity application designed to bring the clarity of Bullet Journaling to the digital age. Built with React and TypeScript, it focuses on focus, simplicity, and intelligent organization.

It combines traditional task management with modern features like AI-assisted scheduling, recurring tasks with "ghost" predictions, and a comprehensive weekly review system—all stored locally in your browser for maximum privacy.

## ✨ Features

### 🎯 Core Productivity
*   **Daily Log**: A focused view for your daily tasks, events, and notes.
*   **Collections & Tags**: Organize entries into custom collections (e.g., Work, Life, Ideas) with custom colors and icons.
*   **Projects**: Create projects with nesting capabilities. Track progress with visual progress bars and batch-edit subtasks.
*   **Calendar & Weekly Views**: 
    *   **Weekly View**: Kanban-style board to plan your week. Drag and drop tasks between days.
    *   **Calendar View**: Month-level overview to visualize your workload.
*   **Recurring Tasks**: Powerful recurrence engine (Daily, Weekly, Monthly) that displays future "ghost" instances before they are even created.

### 🧠 AI Intelligence
*   **Smart Add (Magic Input)**: 
    *   Type naturally: *"Weekly team meeting every Monday at 10am #Work !urgent"*
    *   Connects to **Google Gemini** or any **OpenAI-compatible** provider.
    *   Automatically parses dates, tags, priorities, and recurrence rules from your text.
    *   Batch create multiple entries at once.

### 📊 Review & Reflect
*   **Weekly Reviews**: Dedicated interface for weekly planning and retrospectives. Supports Markdown for rich text summaries.
*   **Data & Privacy**: 
    *   **100% Local**: All data is stored in your browser's `localStorage`. No remote servers, no tracking.
    *   **Import/Export**: Full JSON export capability for backups and data migration.

## 🛠️ Tech Stack

*   **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Drag & Drop**: [dnd-kit](https://dndkit.com/)
*   **AI SDK**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/genai)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16 or higher)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/zenbullet.git
    cd zenbullet
    ```

2.  Install dependencies:
    ```bash
    npm install
    # Note: If you encounter dependency conflicts with React 19, use legacy peer deps or ensure react-dom is set to 18.2.0
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173`.

## 🤖 Configuring AI

To enable the **Smart Add** feature, you need to configure an AI provider in the app settings:

1.  Open the app and go to **Settings** (Gear icon) -> **AI API**.
2.  **Google Gemini** (Recommended for free tier):
    *   Get an API Key from [Google AI Studio](https://aistudio.google.com/).
    *   Select provider "Google Gemini" and paste your key.
3.  **OpenAI / Custom LLM** (e.g., DeepSeek, Local LLMs):
    *   Select "OpenAI Compatible".
    *   Enter your `Base URL` (e.g., `https://api.deepseek.com/v1`).
    *   Enter your `API Key` and `Model Name` (e.g., `deepseek-chat`).

## 📅 Keyboard Shortcuts / Tips

*   **Priority**: Click the priority indicator to cycle through Low (!), Normal (!!), High (!!!), and Critical (!!!!).
*   **Quick Schedule**: In the list view, use the calendar icon to quickly move tasks to tomorrow or next week.
*   **Batch Edit**: In Project Details, you can paste a list of text lines to instantly convert them into subtasks.

## 🛡️ License

This project is open source and available under the [MIT License](LICENSE).

---
*Built with ❤️ for productivity enthusiasts.*
