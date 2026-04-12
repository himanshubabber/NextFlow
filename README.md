# 🌌 NextFlow v1.0 

A high-performance, node-based visual workflow engine designed for multi-modal AI orchestration. Built with the **MERN Stack**, **React Flow**, and **Gemini 3 Flash**, NextFlow allows users to build, execute, and persist complex AI logic through a professional drag-and-drop interface.

## 🔗 Project Links & Contact
* **Live Demo:** [https://next-flow-8u66.vercel.app/](https://next-flow-8u66.vercel.app/)
* **Developer:** Himanshu (Final Year CSE, DTU)
* **Contact Email:** [himanshusingh2087@gmail.com](mailto:himanshusingh2087@gmail.com)

---

## 🚀 Key Features

* **Visual Workflow Builder:** Intuitive drag-and-drop canvas powered by React Flow for rapid AI prototyping.
* **Multi-Modal Intelligence:** Integrated Gemini 3 Flash API for advanced text and visual data analysis.
* **Precision Processing:** Specialized nodes for Interactive Image Cropping (Canvas API) and Video Frame Extraction.
* **Professional Persistence:** * **Cloud Sync:** Instant state persistence with Neon (PostgreSQL) and Prisma ORM.
    * **Blueprint Portability:** Export/Import entire workflows as local `.json` files for offline backup and sharing.
* **Execution Monitoring:** Real-time visual status tracking with glow animations and a detailed Run History sidebar.

---

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **State Management** | Zustand (Global Flow State Management) |
| **Workflow Engine** | React Flow |
| **Intelligence** | Gemini 3 Flash API |
| **Backend/DB** | Neon Cloud (PostgreSQL), Prisma ORM |
| **Auth** | Clerk |
| **Jobs/Workers** | Trigger.dev |

---

## 🏗️ Architecture & Logic

### 1. The Serialization Engine
NextFlow utilizes a custom sanitization layer before persisting data to the cloud. High-bandwidth assets like base64 strings and redundant preview URLs are stripped during the save process to minimize database footprint, while the structural logic, node connectivity, and metadata are preserved for frame-perfect restoration.

### 2. Smart Node Registry
The system is built on a modular node registry, allowing specialized components to interact seamlessly:
* **`textNode`**: Handles system prompts and high-context user inputs.
* **`processNode`**: Implements interactive image cropping with real-time coordinate tracking.
* **`llmNode`**: The central processing "Brain" featuring built-in execution state management and visual feedback.
* **`frameExtractNode`**: Acts as a logical bridge, converting video frames into AI-ready assets.

---

## 👨‍💻 About the Author

**Himanshu** Final Year Computer Science Engineering student at **Delhi Technological University (DTU)**. 
* **LinkedIn:** [Himanshu Singh](https://www.linkedin.com/in/himanshu-singh-94802b257/)
* **Knight-ranked** Competitive Programmer on LeetCode.
* Full-Stack Specialist with deep expertise in AI-integrated system design.
