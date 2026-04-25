# Agri-AI Advisory System 🌾

## Overview
An intelligent agricultural advisory platform built with React and Node.js that connects farmers with agricultural experts and provides AI-powered crop recommendations, pest detection, and market insights.

## Features
- **Smart Advisory**: AI-powered crop recommendations based on soil type, climate, and crop history.
- **Pest & Disease Detection**: Upload images to identify pests and get treatment suggestions.
- **Community Forum**: Ask questions and share knowledge with other farmers and experts.
- **Expert Connect**: Find and consult with verified agricultural experts.
- **Marketplace**: Check real-time market prices and connect with buyers.
- **Accessibility**: Multi-language support (English, Hindi, Telugu) and customizable font size.

## Tech Stack
### Frontend
- React
- React Router
- Google Translate API

### Backend
- Node.js
- Express
- Google Gemini API (for AI recommendations)

## Prerequisites
- Node.js (v18 or higher)
- npm
- A Google Gemini API key

## Setup

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with your API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   ```
4. Start the server:
   ```bash
   npm start
   ```
   The server will start on `http://localhost:5000`.

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Usage
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Register and login as either a **Farmer** or an **Expert**.
3. Use the navigation bar to access different features:
   - **Smart Advisor**: Get AI crop recommendations.
   - **Pest Detection**: Upload images for pest analysis.
   - **Community**: Engage in discussions.
   - **Experts**: Find and contact agricultural experts.
   - **Market**: Check market prices.
   - **Profile**: Manage your profile and certifications.

## Folder Structure
```
agri-ai-advisory-system/
├── backend/           # Node.js backend
│   ├── routes/        # API routes
│   ├── utils/         # Utility functions (e.g., AI integration)
│   └── .env           # Environment variables (not in git)
│
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/     # Page components
│   │   ├── api/       # API service functions
│   │   └── assets/    # Images, styles
│   └── .env           # Environment variables
│
├── README.md          # Project documentation
└── package.json       # Project dependencies
```