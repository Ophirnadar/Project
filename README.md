# Intucate Diagnostic Agent Admin Console

This web application serves as an admin console for the Intucate Diagnostic Agent. It allows authorized users to input a diagnostic prompt and student attempt data to compute a Student Quality Index (SQI). The results provide a detailed breakdown of the student's performance and generate a JSON payload for use in subsequent processing systems.

## Features

-   **Secure Login**: Access is restricted to users with an `@intucate.com` email address.
-   **Prompt Management**: Save and reuse the diagnostic agent prompt, which is persisted in the browser's local storage.
-   **Flexible Data Input**: Upload student data as a JSON/CSV file or paste it directly as raw JSON text.
-   **Automated Analysis**: Performs a deep analysis of the provided data to generate a structured SQI report.
-   **Detailed Results**: Displays an overall SQI score and a comprehensive breakdown of performance by topic and concept, including scores, weights, and explanations.
-   **Data Portability**: Easily copy the generated JSON payload to the clipboard or download it as a file for seamless integration with other systems.
-   **User-Friendly Interface**: A clean, responsive, and intuitive UI with loading states, error messages, and toast notifications for a smooth user experience.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **Styling**: Modern CSS with custom properties

## Prerequisites

-   **API Key**: Before running this application, you must have a valid API key for the backend analysis service.
-   **Node.js and npm**: Ensure you have Node.js (v18 or later) and npm installed on your machine. You can download them from [nodejs.org](https://nodejs.org/).

## Getting Started: Development Mode

This is the recommended approach for local development and testing.

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

Install the necessary npm packages as defined in `package.json`:

```bash
npm install
```

### 3. Configure Environment Variables

The application requires an API key to function. For local development with Vite, you must create a file named `.env.local` in the project root.

Inside this file, add your key. **It is crucial that the variable name starts with `VITE_`**.

```
# .env.local
VITE_API_KEY=your_api_key_here
```

### 4. Run the Development Server

Start the Vite development server:

```bash
npm run dev
```

The application should now be running. Open your web browser and navigate to the local URL provided in your terminal (usually `http://localhost:5173`). The server will automatically reload when you make changes to the source code.

## Alternative: Running the Production Build Locally

This method is useful for running the optimized, final version of the application without the development server.

### 1. Build the Application

First, create a production build of the project:

```bash
npm run build
```

This command will compile and bundle the application into a `dist` directory in your project root.

### 2. Serve the `dist` Directory

You can use any static file server to serve the contents of the `dist` folder. A simple option is the `serve` package, which you can run with `npx`.

```bash
npx serve dist
```

This will start a local server. Open your browser and navigate to the URL it provides (e.g., `http://localhost:3000`).

## How to Use the Application

1.  **Login**: You will be greeted with a login screen. Enter an email ending in `@intucate.com` and a password of at least 8 characters to proceed.
2.  **Enter Diagnostic Prompt**: In the "Diagnostic Agent Prompt" card, paste the prompt you want the system to use for its analysis. You can click "Save Prompt" to store it for future sessions.
3.  **Provide Student Data**:
    -   **Upload**: Click the "Upload Data" tab, then click the upload area to select a JSON or CSV file from your computer.
    -   **Paste**: Click the "Paste JSON" tab and paste the student's attempt data directly into the text area.
4.  **Compute SQI**: Once both the prompt and student data are provided, the "Compute SQI" button will become active. Click it to start the analysis. A spinner will indicate that the request is in progress.
5.  **Review Results**: After the analysis is complete, the results will appear at the bottom of the page. You can view:
    -   The **Overall SQI** score.
    -   A **Topic & Concept Breakdown** table.
    -   The raw **JSON payload** generated for the next system in the pipeline.
6.  **Export Payload**: Use the "Copy JSON" or "Download JSON" buttons to export the results.
