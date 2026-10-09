# Job Tracker Web

A React and TypeScript frontend for tracking job applications. Users can create an account, log in, and manage their applications through a responsive dashboard.

**[Live Demo](https://job-tracker-web-one.vercel.app/)** · **[Backend Repository](https://github.com/jb-pryor/job-tracker-api)** · **[API Documentation](https://job-tracker-api-blush.vercel.app/docs)**

## Features

- Account registration and login
- Create applications with a company, job title, status, and application date
- Edit company names, job titles, and application dates
- Update application statuses directly from the list
- Delete applications with a confirmation prompt
- Filter applications by status and navigate paginated results
- Loading states, form validation, and error messages
- Responsive layout for desktop and mobile

Supported statuses are `saved`, `applied`, `interviewing`, `offer`, and `rejected`.

## Tech Stack

- **React** — Components, state management, and rendering
- **TypeScript** — Types for component props and API responses
- **Vite** — Local development server and production builds
- **CSS** — Styling and responsive layouts
- **ESLint** — Code quality checks
- **Vercel** — Frontend hosting

The frontend connects to a separate FastAPI backend backed by PostgreSQL hosted on Neon.

## How It Works

Registration sends account details to the API, where the password is hashed before storage. Login returns a JWT access token, which the frontend uses to retrieve the user's profile and authenticate application requests.

Application data is stored in PostgreSQL through the backend. The backend enforces ownership checks so users can access only their own applications.

The access token is held in React state. Refreshing the page requires logging in again. Logging out clears the local session; it does not revoke the token on the server.

## Local Setup

Requires Node.js and npm. This project was developed using Node.js 22.

### 1. Clone the repository

```bash
git clone https://github.com/jb-pryor/job-tracker-web.git
cd job-tracker-web
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure the API URL

Create a `.env.local` file in the project root:

```dotenv
VITE_API_URL=https://job-tracker-api-blush.vercel.app
```

To connect to a locally running backend instead:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

Use the API's base URL without `/docs` or a trailing slash. Restart the development server after changing this value.

Variables prefixed with `VITE_` are included in the frontend build and are visible to visitors. Database credentials and JWT signing secrets belong in the backend environment.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL printed in the terminal, usually:

http://localhost:5173

The backend must allow your frontend's origin through its CORS configuration.

## Available Commands

| Command           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Start the local development server                  |
| `npm run build`   | Run TypeScript checks and create a production build |
| `npm run lint`    | Run ESLint                                          |
| `npm run preview` | Preview the production build locally                |

Production files are generated in `dist/`.

## Project Structure

```text
src/
    App.tsx                 Login, logout, and dashboard layout
    Applications.tsx        Application list, filtering, pagination, and actions
    CreateApplications.tsx  New application form
    EditApplications.tsx    Edit application form
    Register.tsx            Account registration form
    App.css                 Application styles
    index.css               Global styles
    main.tsx                React entry point
```

## API Integration

The frontend uses the browser's Fetch API to communicate with these endpoints:

| Method | Endpoint             | Purpose                                         |
| ------ | -------------------- | ----------------------------------------------- |
| POST   | `/auth/register`     | Create an account                               |
| POST   | `/auth/token`        | Log in and receive an access token              |
| GET    | `/users/me`          | Retrieve the authenticated user's profile       |
| GET    | `/applications`      | List applications with filtering and pagination |
| POST   | `/applications`      | Create an application                           |
| PATCH  | `/applications/{id}` | Update an application                           |
| DELETE | `/applications/{id}` | Delete an application                           |

Protected requests include an `Authorization: Bearer <token>` header. Login submits form data; registration and application changes submit JSON.

## Validation

Run these checks before committing changes:

```bash
npm run build
npm run lint
```

Frontend behavior is currently checked manually, including registration, valid and invalid logins, application creation, editing, deletion, filtering, and pagination.

The backend has a separate suite of 16 automated tests that runs through GitHub Actions.

## Deployment

The frontend is hosted on Vercel and connected to this GitHub repository. Pushes to the configured production branch trigger a new deployment.

Set `VITE_API_URL` in the Vercel project's environment settings before building. Because this value is included at build time, changing it requires a new deployment.

The backend's CORS configuration must also allow the deployed frontend URL.

## Related Repository

[Job Tracker API](https://github.com/jb-pryor/job-tracker-api) contains the FastAPI backend, database models, Alembic migrations, authentication, and automated tests.
