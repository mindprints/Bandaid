# BandAid - Band Collaboration Platform

A web-based Single Page Application (SPA) for band members to collaborate on song material stored in Dropbox. Members can rate song versions, leave comments, and track each other's opinions through an interactive leaderboard.

## Features

### Current (Phase 1-2 Complete)
- **Authentication System**: Secure JWT-based login with HTTP-only cookies
- **User Management**: Pre-created accounts for 5 band members
- **Database**: SQLite database with complete schema for songs, versions, ratings, comments, and notifications
- **Modern Tech Stack**: React + Vite frontend, Node.js + Express backend, TypeScript throughout

### Coming Soon
- **Dropbox Integration**: Manual sync button to import songs and versions from Dropbox folder structure
- **Rating System**: 1-10 numerical ratings for each song version
- **Comments**: Threaded discussion on specific song versions
- **Leaderboard**: Compare ratings across all versions and members
- **Notifications**: In-app notifications for new songs, versions, and comments

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, React Router, Axios
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT with HTTP-only cookies
- **Cloud Storage**: Dropbox API (coming in Phase 3)

## Project Structure

```
bandaid/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client and endpoints
│   │   ├── components/    # React components
│   │   ├── context/       # React context (Auth, etc.)
│   │   ├── pages/         # Page components
│   │   └── main.tsx       # Entry point
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── database/      # Schema and seeds
│   │   ├── middleware/    # Auth and error handling
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities (JWT, passwords)
│   └── package.json
├── shared/                # Shared TypeScript types
│   └── src/types.ts
└── package.json           # Root workspace config
```

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm 9+ installed

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd bandaid
```

2. Install dependencies:
```bash
npm install
```

3. Seed the database with band member accounts:
```bash
cd server
node --loader ts-node/esm src/database/seeds.ts
cd ..
```

### Development

Run both frontend and backend servers:
```bash
npm run dev
```

This starts:
- Backend API: http://localhost:3001
- Frontend: http://localhost:5173

### Default User Accounts

The database is seeded with 5 band member accounts:

| Username       | Password     | Display Name      |
|----------------|--------------|-------------------|
| john_guitar    | password123  | John (Guitar)     |
| sarah_vocals   | password123  | Sarah (Vocals)    |
| mike_drums     | password123  | Mike (Drums)      |
| lisa_bass      | password123  | Lisa (Bass)       |
| tom_keys       | password123  | Tom (Keys)        |

## Environment Configuration

Create `server/.env` with the following variables:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your_secret_key_here
DATABASE_PATH=./database/bandaid.db
DROPBOX_ACCESS_TOKEN=your_dropbox_token
DROPBOX_FOLDER_PATH=/BandAid
CLIENT_URL=http://localhost:5173
```

## Database Schema

### Tables
- **users**: Band member accounts
- **songs**: Song containers (mapped from Dropbox folders)
- **versions**: Song versions (mapped from Dropbox files)
- **ratings**: User ratings (1-10 scale, one per user per version)
- **comments**: User comments on versions
- **notifications**: In-app notifications

### Relationships
- Songs have many Versions
- Versions have many Ratings and Comments
- Users have many Ratings, Comments, and Notifications

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout (clear cookie)
- `GET /api/auth/me` - Get current user

### Coming Soon
- Songs and Versions CRUD
- Ratings submission and leaderboard
- Comments CRUD
- Dropbox sync
- Notifications

## Development Progress

- [x] Phase 1: Project setup and configuration
- [x] Phase 2: Authentication system and database
- [ ] Phase 3: Dropbox integration
- [ ] Phase 4: Songs and versions display
- [ ] Phase 5: Ratings and leaderboard
- [ ] Phase 6: Comments system
- [ ] Phase 7: Notifications
- [ ] Phase 8: Polish and deployment

## Architecture Decisions

### Why SQLite?
Perfect for 5 users, no separate database server needed, portable single-file database.

### Why JWT in HTTP-only Cookies?
More secure than localStorage (XSS protection), stateless server design, industry standard.

### Why Manual Dropbox Sync?
Simpler than webhooks, full user control, no public server endpoint required.

### Why Monorepo?
Easier management for small team, shared TypeScript types, single deployment unit.

## Next Steps

1. **Implement Dropbox Integration** (Phase 3)
   - Set up Dropbox app and access token
   - Create sync service to map folders → songs, files → versions
   - Build sync button UI component

2. **Build Song Display** (Phase 4)
   - Songs list page
   - Song details with versions
   - Dropbox file preview/download

3. **Implement Ratings** (Phase 5)
   - Rating input component (1-10)
   - Leaderboard calculations
   - User rating patterns

## Contributing

This is a private band collaboration tool. For feature requests or bug reports, contact the development team.

## License

Private - Band Use Only
