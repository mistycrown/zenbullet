# ZenBullet (禅意子弹笔记)

**ZenBullet** 是一款极简主义、AI 驱动的个人生产力应用，旨在将子弹笔记（Bullet Journaling）的清晰感带入数字时代。它基于 React 和 TypeScript 构建，专注于专注力、简洁性和智能组织。

它将传统的任务管理与现代功能相结合，如 AI 辅助调度、带有“幽灵（Ghost）”预测的重复任务引擎，以及全面的每周回顾系统——所有数据均完全本地存储在您的浏览器中，以最大程度地保护隐私。

## ✨ 功能特性

### 🎯 核心生产力
*   **每日日志 (Daily Log)**：一个专注的视图，用于记录当天的任务、日程和笔记。
*   **集合与标签 (Collections)**：将条目组织到自定义集合中（例如：工作、生活、灵感），支持自定义颜色和图标。
*   **项目管理 (Projects)**：创建具有嵌套功能的项目。通过可视化进度条跟踪进度，并支持批量编辑子任务。
*   **日历与周视图**：
    *   **周视图**：看板风格的周计划板。支持在不同日期之间拖拽任务。
    *   **日历视图**：月度概览，直观通过视图查看工作负载。
*   **重复任务**：强大的重复规则引擎（每天、每周、每月），并能“幽灵”显示未来的任务实例，而无需预先创建数据库条目。

### 🧠 AI 智能助手
*   **智能添加 (Smart Add)**：
    *   自然语言输入：*"每周一上午10点开团队会议 #工作 !紧急"*
    *   支持 **Google Gemini** 或任何 **OpenAI 兼容** 的服务提供商。
    *   自动从文本中解析日期、标签、优先级和重复规则。
    *   支持一次性批量创建多个条目。

### 📊 回顾与反思
*   **每周回顾**：专门的每周计划和回顾界面。支持 Markdown 格式的富文本总结。
*   **数据与隐私**：
    *   **100% 本地化**：所有数据存储在浏览器的 `localStorage` 中。无远程服务器，无追踪。
    *   **导入/导出**：完整的 JSON 导出功能，用于数据备份和迁移。

## 🛠️ 技术栈

*   **框架**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **语言**: [TypeScript](https://www.typescriptlang.org/)
*   **样式**: [Tailwind CSS](https://tailwindcss.com/)
*   **图标**: [Lucide React](https://lucide.dev/)
*   **拖拽库**: [dnd-kit](https://dndkit.com/)
*   **AI SDK**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/genai)

## 🚀 快速开始

### 前提条件
*   Node.js (v16 或更高版本)
*   npm 或 yarn

### 安装步骤

1.  克隆仓库：
    ```bash
    git clone https://github.com/yourusername/zenbullet.git
    cd zenbullet
    ```

2.  安装依赖：
    ```bash
    npm install
    # 注意：如果遇到 React 19 相关的依赖冲突，请确保 package.json 中 react-dom 版本锁定为 18.2.0
    ```

3.  启动开发服务器：
    ```bash
    npm run dev
    ```

4.  在浏览器中打开 `http://localhost:5173`。

## 🤖 配置 AI

要使用 **智能添加 (Smart Add)** 功能，您需要在应用设置中配置 AI 提供商：

1.  打开应用，进入 **设置** (齿轮图标) -> **AI API**。
2.  **Google Gemini** (推荐免费版用户):
    *   从 [Google AI Studio](https://aistudio.google.com/) 获取 API Key。
    *   选择提供商 "Google Gemini" 并粘贴您的密钥。
3.  **OpenAI / 自定义 LLM** (例如 DeepSeek, 本地模型):
    *   选择 "OpenAI Compatible"。
    *   输入 `Base URL` (例如 `https://api.deepseek.com/v1`)。
    *   输入 `API Key` 和 `Model Name` (例如 `deepseek-chat`)。

## 📅 使用技巧

*   **优先级切换**：点击任务旁的优先级感叹号，可循环切换 低(!)、中(!!)、高(!!!) 和 紧急(!!!!)。
*   **快速调度**：在列表视图中，点击日历图标可快速将任务推迟到明天或下周。
*   **批量编辑**：在项目详情页中，您可以直接粘贴多行文本，系统会自动将其转换为子任务列表。

## 🛡️ 许可证

本项目开源并遵循 [MIT License](LICENSE) 许可证。

---
*用 ❤️ 为生产力爱好者打造。*
