# Admin Panel

A modern full-stack admin panel application built with Next.js frontend and Node.js backend.

## Project Structure

```
.
├── backend/             # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── server.js
│   └── package.json
│
└── frontend/           # Next.js frontend
    ├── app/            # App Router directory
    │   ├── login/      # Login page
    │   ├── signup/     # Signup page
    │   ├── layout.tsx
    │   └── page.tsx
    ├── public/
    ├── package.json
    └── tsconfig.json
```

## Features

- Modern authentication system
  - User registration
  - User login
  - Password confirmation
  - Remember me functionality
  - Forgot password option
- Responsive design with Tailwind CSS
- TypeScript support
- Client-side form validation
- Error handling
- Protected routes
- Modern UI/UX

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env.local file in the frontend directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- bcryptjs

### Frontend
- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- React Hooks
- Next.js Navigation
- Client-side Form Validation

## Development

The project uses modern development practices and tools:

- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling
- Next.js App Router for routing
- Client-side form validation
- Responsive design principles

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 