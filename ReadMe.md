Chatbot Web Application

A full-stack web application for managing chatbot subscriptions, payments, and user settings.

Features:
- User subscription management (purchase, cancel, auto-renew)
- Payment history tracking
- Message usage tracking
- Settings management
- Responsive web dashboard

Tech Stack:
- Frontend: React, Next.js, Tailwind CSS, ShadCN UI
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- Other Tools: Git

Environment Variables:
Create a .env.local file with the following:


PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=chatbot-db
PGPORT=5432
PORT=5000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

Setup & Installation:
1. Clone the repository:
   git clone https://github.com/MNabeelAltaf/Chatbot.git
   cd <project_folder>

2. Install backend dependencies:
   npm install

3. Install frontend dependencies:
   cd client
   npm install

4. Run the backend:
   npm run dev

5. Run the frontend:
   cd client
   npm run dev

Database:
- DB file with name chatbot-db has attached for convenience. 
- PostgreSQL is used as the database.
- Use pgAdmin or pg_dump to manage/export data.

