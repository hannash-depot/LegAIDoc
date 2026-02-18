# PostgreSQL Setup Guide for macOS

## Option 1: Install Homebrew First (Recommended)

Homebrew is a package manager for macOS that makes installing PostgreSQL easy.

### Install Homebrew

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation completes, follow the instructions to add Homebrew to your PATH.

### Install PostgreSQL with Homebrew

```bash
brew install postgresql@14
```

### Start PostgreSQL

```bash
brew services start postgresql@14
```

### Add to PATH (if needed)

```bash
echo 'export PATH="/usr/local/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Option 2: Download Postgres.app (Easy GUI Method)

1. **Download Postgres.app**
   - Go to: https://postgresapp.com/
   - Download the latest version
   - Drag to Applications folder

2. **Install**
   - Open Postgres.app
   - Click "Initialize" to create a new server
   - PostgreSQL will start automatically

3. **Configure PATH**
   ```bash
   echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **Verify Installation**
   ```bash
   psql --version
   ```

---

## Option 3: Official PostgreSQL Installer

1. **Download**
   - Go to: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Download PostgreSQL 14 for macOS
   - Run the installer

2. **Installation**
   - Follow the installation wizard
   - Remember the password you set for the 'postgres' user
   - Keep the default port (5432)

3. **Add to PATH**
   ```bash
   echo 'export PATH="/Library/PostgreSQL/14/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

---

## After Installation - Quick Setup

Once PostgreSQL is installed and running, use our automated setup:

```bash
cd "/Users/hanna/Google Drive/Claude/LegAIDoc"
./setup-db.sh
```

The script will:
- Create the `legaidoc` database
- Update your `.env` file
- Run all migrations
- Seed the database with templates

---

## Manual Setup (if script fails)

If the automated script doesn't work, here's how to set up manually:

### 1. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE legaidoc;

# Exit
\q
```

### 2. Update .env File

Edit `/Users/hanna/Google Drive/Claude/LegAIDoc/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/legaidoc?schema=public"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 3. Run Migrations

```bash
cd "/Users/hanna/Google Drive/Claude/LegAIDoc"
npm run db:generate
npm run db:push
npm run db:seed
```

---

## Troubleshooting

### PostgreSQL won't start

**Homebrew:**
```bash
brew services restart postgresql@14
```

**Postgres.app:**
- Quit and reopen the app
- Click "Start"

**Official Installer:**
```bash
sudo -u postgres /Library/PostgreSQL/14/bin/pg_ctl start -D /Library/PostgreSQL/14/data
```

### Can't connect to database

Check if PostgreSQL is running:
```bash
pg_isready
```

If not running, start it using one of the methods above.

### Permission denied

You may need to create a password for the postgres user:
```bash
psql postgres
ALTER USER postgres PASSWORD 'your_password';
\q
```

### Port already in use

Check what's using port 5432:
```bash
lsof -i :5432
```

Stop the process or change PostgreSQL to use a different port.

---

## Verify Everything Works

After setup, test the connection:

```bash
psql -d legaidoc
```

You should see the PostgreSQL prompt. Type `\dt` to see tables and `\q` to exit.

---

## Need Help?

If you're still having issues:

1. Check PostgreSQL logs (location depends on installation method)
2. Verify PostgreSQL is running: `pg_isready`
3. Check your `.env` DATABASE_URL is correct
4. Make sure the database `legaidoc` exists: `psql -l`

---

**Recommended**: Use **Postgres.app** for the easiest setup on macOS!
