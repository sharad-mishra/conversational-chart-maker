**Live URL**: <https://conversational-chart-maker-1.onrender.com/>

Conversational AI Chart Generator
=================================

Overview
--------

The Conversational AI Chart Generator is a full-stack web application that enables users to create and customize interactive charts using natural language or file uploads. Built with a React frontend and a Node.js/Express backend, it integrates AI to interpret user requests and generate Chart.js-based visualizations. Deployed on Render, it offers a seamless, responsive experience with real-time chart previews and export options.

What We Built
-------------

We developed an AI-powered chart generation platform with the following components:

-   **Frontend**: A React-based interface with a chat system, real-time chart preview, and customization tools, hosted on Render.
-   **Backend**: A Node.js/Express RESTful API that processes natural language inputs and file uploads, generating chart configurations, hosted on Render.
-   **AI Integration**: Uses an AI service to parse user requests for chart types, data, and styling preferences.

Features
--------

### 1\. Natural Language Chart Creation

-   Describe charts in natural language (e.g., "Create a bar chart showing sales by month").
-   AI parses requests to generate Chart.js configurations.
-   Supports bar, line, pie, scatter, and more.

### 2\. Data Input Methods

-   **Manual Data Entry**: Input data via chat.
-   **File Upload**: Supports CSV/JSON files, processed with Papaparse.
-   **Sample Datasets**: Backend provides test datasets.

### 3\. Chart Customization

-   **Color Schemes**: Customize dataset colors via an interactive color picker.
-   **Titles and Labels**: Configurable titles, axis labels, and legends.
-   **Axis Configurations**: Dynamic axis adjustments.
-   **Legend Positioning**: Click-based legend customization.

### 4\. Export Functionality

-   **Download Chart as Image**: Export as PNG.
-   **Export React Component Code**: Generate `MyChart.jsx` for reuse.
-   **Chart Configurations**: Generated for reuse or modification.

Technical Implementation
------------------------

### Frontend

-   **Framework**: React 19.1.0, Vite 7.0.0.
-   **Charting**: Chart.js 4.4.2, react-chartjs-2 5.2.0.
-   **Data Handling**: Axios 1.6.8, Papaparse 5.4.1.
-   **UI**: Chat interface, real-time chart rendering, file upload with validation, gradient-based styling.
-   **Environment**: Uses `VITE_BACKEND_URL` for backend connection.

### Backend

-   **Framework**: Node.js/Express, hosted at `https://conversational-chart-maker.onrender.com`.
-   **API**: `/api/chart/generate` (POST) for processing requests.
-   **AI**: Parses natural language for chart configurations.
-   **Data**: Validates CSV/JSON, generates Chart.js configs.
-   **CORS**: Allows requests from frontend URL.

Usage
-----

1.  Visit <https://conversational-chart-maker-1.onrender.com/>.
2.  **Chat**: Enter requests (e.g., "Show a line graph of website traffic").
3.  **Upload**: Import CSV/JSON files.
4.  **Customize**: Click chart elements to change colors.
5.  **Export**: Download as PNG or React component code.

Example Interactions
--------------------

-   **Input**: "Create a bar chart showing sales by month" → Bar chart with customizable colors.
-   **Input**: Upload CSV with demographics → Pie chart.
-   **Input**: "Show a scatter plot of test scores" → Scatter chart with configurable axes.

Troubleshooting
---------------

-   **CORS Errors**: Ensure backend allows frontend origin.
-   **API Errors**: Test `https://conversational-chart-maker.onrender.com/api/chart/generate` with Postman.
-   **Environment**: Verify `VITE_BACKEND_URL` in Render settings.

Future Enhancements
-------------------

-   Add radar, area charts.
-   Persist chart configurations.
-   Improve AI for complex data.
-   Enable real-time collaboration.

License
-------

MIT License. See `LICENSE` file.

Contact
-------

For issues, contact <sharadrx9@gmail.com> or open a GitHub issue.