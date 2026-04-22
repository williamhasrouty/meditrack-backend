# MediTrack Backend

Backend API for MediTrack - A medication tracking and management application.

## Deployment

- **API URL**: [https://api.meditrack.jumpingcrab.com](https://api.meditrack.jumpingcrab.com)
- **Domain**: meditrack.jumpingcrab.com

## Frontend

- **Live Demo**: [https://meditrack.jumpingcrab.com](https://meditrack.jumpingcrab.com)
- **Repository**: [https://github.com/williamhasrouty/se_project_meditrack](https://github.com/williamhasrouty/se_project_meditrack)

## Tech Stack

- **Node.js** & **Express** - Server framework
- **MongoDB** & **Mongoose** - Database
- **JWT** - Authentication
- **Celebrate** & **Joi** - Request validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Winston** - Logging
- **bcryptjs** - Password hashing

## Installation

1. Clone the repository:

```bash
git clone https://github.com/williamhasrouty/meditrack-backend.git
cd meditrack-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/meditrack
JWT_SECRET=your-secret-key-here
```

4. Start the server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Public Routes

- `POST /signup` - Create a new user account
- `POST /signin` - Login and receive JWT token

### Protected Routes (require authentication)

- `GET /users/me` - Get current user information
- `PATCH /users/me` - Update current user profile
- `GET /clients` - Get all clients for logged-in user
- `POST /clients` - Create a new client
- `GET /clients/:clientId` - Get a single client
- `PATCH /clients/:clientId` - Update a client
- `DELETE /clients/:clientId` - Delete a client
- `POST /clients/:clientId/medications` - Add medication to client
- `PATCH /clients/:clientId/medications/:medicationId` - Update medication
- `DELETE /clients/:clientId/medications/:medicationId` - Delete medication
- `GET /administrations/:clientId` - Get administration records
- `POST /administrations/:clientId` - Save administration records
- `DELETE /administrations/:clientId` - Delete administration records

## Deployment Instructions

The backend is deployed on Google Cloud VM using NGINX as a reverse proxy and PM2 as the process manager.

### Server Configuration

1. **NGINX Configuration** (`/etc/nginx/sites-available/final-project`):

   - Server listens on port 80/443
   - Reverse proxy to Node.js app on port 3002
   - SSL/TLS certificates managed by Certbot

2. **PM2 Process Manager**:

   ```bash
   PORT=3002 pm2 start app.js --name final-project
   pm2 save
   ```

3. **Environment Variables** (on server):
   - `PORT=3002`
   - `MONGODB_URI=mongodb://127.0.0.1:27017/meditrack`
   - `JWT_SECRET=<production-secret>`

### Deployment Steps

1. SSH into VM and navigate to home directory
2. Clone repository: `git clone https://github.com/williamhasrouty/meditrack-backend.git`
3. Install dependencies: `npm install`
4. Configure environment variables
5. Start with PM2: `PORT=3002 pm2 start app.js --name final-project`
6. Configure NGINX reverse proxy
7. Set up SSL with Certbot: `sudo certbot --nginx`

## Development

### Linting

```bash
npm run lint
```

### Code Style

- ESLint with Airbnb base configuration
- Single quotes for strings
- No trailing commas in objects

## License

ISC
