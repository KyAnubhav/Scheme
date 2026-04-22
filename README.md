# Government Scheme Portal

## What to replace
Copy these files into your repo root:

- `server.js`
- `db.js`
- `schema.sql`
- `.env`
- `middleware/auth.js`
- `utils/otpStore.js`
- `utils/mailer.js`
- `utils/eligibility.js`
- `routes/auth.js`
- `routes/profile.js`
- `routes/schemes.js`
- `routes/admin.js`
- `routes/meta.js`

Copy the whole `public/` folder contents too.

## Run
```bash
npm install
node server.js
```

Open:
- `http://localhost:3000/login.html`

## Important
Set SQL Server to fixed port `1433` and keep `SQL Server (SQLEXPRESS)` running.

## Make your account admin
In SSMS:
```sql
UPDATE Users
SET role = 'admin'
WHERE email = 'manmitpoojary@gmail.com';
```
