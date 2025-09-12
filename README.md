# Hamme - MERN Stack Dating App

## Project Structure

```
hamme/
├── client/          # React frontend with Vite + TypeScript + Tailwind CSS
├── server/          # Express.js backend with TypeScript + MongoDB
├── package.json     # Root package with scripts to run both
└── README.md
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` files in both client and server folders
   - Rename them to `.env` and fill in your values

3. Start development servers:
   ```bash
   npm run dev
   ```

This will run both the React frontend (port 5173) and Express backend (port 5000) concurrently.

## Tech Stack

### Frontend (Client)
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API calls

### Backend (Server)
- Express.js with TypeScript
- MongoDB with Mongoose
- CORS enabled
- Environment configuration

## Environment Variables

### Client (.env)
- `VITE_API_URL` - Backend API URL

### Server (.env)
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port
- `JWT_SECRET` - JWT secret for authentication
- `NODE_ENV` - Environment (development/production)# hamme
