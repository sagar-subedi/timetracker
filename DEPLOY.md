# Deployment Guide

This guide explains how to build and run the Time Tracker application in production mode locally.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB (running locally or accessible via connection string)

## Environment Setup

Ensure you have a `.env` file in the `backend` directory with the following variables:

```env
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="your-secret-key"
PORT=3001
NODE_ENV=production
```

## Build Instructions

1.  **Install Dependencies**
    Run this command from the root directory to install dependencies for both frontend and backend:
    ```bash
    npm install
    npm run install:all
    ```

2.  **Build Frontend**
    Navigate to the frontend directory and build the React application:
    ```bash
    cd frontend
    npm run build
    ```
    This will create a `dist` directory in `frontend/` containing the compiled static files.

3.  **Build Backend**
    Navigate to the backend directory and compile the TypeScript code:
    ```bash
    cd backend
    npm run build
    ```
    This will create a `dist` directory in `backend/` containing the compiled JavaScript files.

## Running in Production

To run the application in production mode:

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Start the server:
    ```bash
    npm start
    ```

The application will be available at `http://localhost:3001`. The backend will serve the frontend static files, so you can access the full application at this URL.

## Troubleshooting
## Process Management with PM2

For production, it is recommended to use PM2 to manage the application process.

1.  **Install PM2** (if not already installed globally):
    ```bash
    npm install pm2 -g
    # OR install locally in the project
    cd backend
    npm install pm2 --save-dev
    ```

2.  **Start with PM2**:
    Navigate to the backend directory and run:
    ```bash
    npx pm2 start ecosystem.config.cjs
    ```

3.  **Monitor**:
    ```bash
    npx pm2 monit
    ```

4.  **Logs**:
    ```bash
    npx pm2 logs
    ```

-   **Database Connection**: Ensure your MongoDB instance is running and the `DATABASE_URL` is correct.
-   **Static Files**: If the frontend doesn't load, check that `frontend/dist` exists and contains `index.html`.
-   **Ports**: Ensure port 3001 is not in use by another application.
