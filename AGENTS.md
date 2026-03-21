# Project Context: Cloud Hub
*(Context file for AI Agents)*

## Environment & Tech Stack
- **Core Framework**: Laravel 13 (Backend) + React 19 (Frontend)
- **Bridging**: Inertia.js 2.0
- **Languages**: PHP 8.3, TypeScript 5.7
- **Styling & UI**: Tailwind CSS 4.0, shadcn/ui (Radix UI)
- **Build Tooling**: Vite 8.0
- **Testing**: Pest PHP
- **Code Quality Tools**: ESLint v9, Prettier, Laravel Pint

## Architectural Overview
- Full-stack application utilizing Inertia.js to seamlessly connect Laravel server-side routing/controllers with React client-side pages.
- UI components are built using modern React principles (Hooks, Server-side rendering ready) and styled via Tailwind CSS.

## Business Context & Scope
- **Main Language**: English (UI and Code)
- **Core Purpose**: Allow users to connect and manage multiple cloud storage services in a single unified interface (Google Drive, OneDrive, Dropbox, AWS S3, FTP/SFTP).
- **Users & Roles**: Single user mode (No strict role-based access control or active permissions required).

## Key Features
- 📁 View files from multiple clouds in one UI
- 🔄 Copy / Move files seamlessly between different clouds
- ⬆ Upload / Download capabilities
- 🔍 Global search across all connected clouds
- 📊 Storage capacity monitoring
- 👥 Multiple cloud account management
