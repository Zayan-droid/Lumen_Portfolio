# Lumin - School Management Platform

## Waitlist Backend Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Server

Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:3000`

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌟 Lumin Waitlist Server                               ║
║                                                           ║
║   Server running on: http://localhost:3000                ║
║   API Endpoint: http://localhost:3000/api/waitlist        ║
║                                                           ║
║   Ready to accept waitlist submissions!                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Accessing the Website

Once the server is running, open your browser and navigate to:
- **Main Website**: `http://localhost:3000/index.html`
- **Waitlist Form**: `http://localhost:3000/waitlist.html`
- **Admin Dashboard**: `http://localhost:3000/admin.html`

### API Endpoints

#### Get all waitlist entries
```
GET http://localhost:3000/api/waitlist
```

#### Add new school to waitlist
```
POST http://localhost:3000/api/waitlist
Content-Type: application/json

{
  "schoolName": "Example School",
  "studentCount": 500,
  "contactEmail": "admin@example.edu",
  "city": "New York"
}
```

#### Get single school by ID
```
GET http://localhost:3000/api/waitlist/:id
```

#### Update school status
```
PATCH http://localhost:3000/api/waitlist/:id
Content-Type: application/json

{
  "status": "contacted"
}
```
Valid statuses: `pending`, `contacted`, `onboarded`

#### Delete school from waitlist
```
DELETE http://localhost:3000/api/waitlist/:id
```

#### Get statistics
```
GET http://localhost:3000/api/stats
```

### Data Storage

Waitlist data is stored in `waitlist-data.json` in the root directory. This file is automatically created when the server starts.

### Admin Dashboard

Access the admin dashboard at `http://localhost:3000/admin.html` to:
- View all waitlist entries
- See statistics (total schools, pending, contacted, onboarded)
- Update school status
- Delete entries
- Refresh data in real-time

### Features

✅ Form validation (client-side and server-side)
✅ Duplicate email detection
✅ Real-time statistics
✅ Status management (pending → contacted → onboarded)
✅ Responsive design
✅ Data persistence in JSON file

### Project Structure

```
├── server.js              # Backend Express server
├── waitlist.html          # Waitlist form page
├── waitlist.js            # Form submission logic
├── waitlist.css           # Waitlist styling
├── confirmation.html      # Success page
├── confirmation.js        # Confirmation page logic
├── admin.html             # Admin dashboard
├── admin.js               # Admin dashboard logic
├── waitlist-data.json     # Data storage (auto-generated)
└── package.json           # Dependencies
```

### Troubleshooting

**Server won't start:**
- Make sure port 3000 is not already in use
- Run `npm install` to ensure all dependencies are installed

**Form submission fails:**
- Ensure the server is running on port 3000
- Check browser console for error messages
- Verify all form fields are filled correctly

**Admin dashboard shows error:**
- Make sure the server is running
- Check that you're accessing via `http://localhost:3000/admin.html`
