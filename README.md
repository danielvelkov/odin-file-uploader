# Odin File Uploader

Google Drive from Temu.

## Key Directories

- **`/src/`** — Main application code: routes, controllers, middleware, and views
- **`/prisma/`** — Prisma schema and migrations for database setup
- **`/generated/`** — Auto-generated Prisma client files
- **`/uploads/`** — Uploaded files storage
- **`.env`**, `.gitignore`, config files — essential setup and tooling

---

## 🔧 Setup & Running

### Requirements

- Node.js ≥ 16
- npm ≥ 8
- PostgreSQL database
- Cloudinary account

### Installation Steps

```bash
git clone <repository-url>
cd odin-file-uploader
npm install
```

Create your `.env` file at project root:

```properties
PORT=3000
NODE_ENV=development
DATABASE_URL="your-database-url"
SESSION_SECRET="your-session-secret"
CLOUDINARY_URL="your-cloudinary-url"
```

Initialize the database:

```bash
npx prisma migrate dev
```

Build and run:

```bash
npm run build
npm start
```

Start with live reload for dev:

```bash
npm run dev
```

Visit your app at:  
**http://localhost:3000**

## 📦 Scripts from `/package.json`

- `npm run build` — Compiles TypeScript
- `npm start` — Launches server
- `npm run dev` — Dev mode with hot reload
- `npx prisma migrate dev` — DB migration

## 📝 Notes

- Ensure PostgreSQL is running
- Uploaded files go in `/uploads/`
- Prisma client lives in `/generated/`, don’t edit it manually
- Cloudinary has a limit for free accounts
