# MediTrack Backend Deployment Guide

This document provides step-by-step instructions for deploying the MediTrack backend to Google Cloud VM.

## Prerequisites

- Google Cloud VM with Ubuntu
- Domain names configured:
  - `api.meditrack.jumpingcrab.com` → VM IP (34.121.50.214)
  - `meditrack.jumpingcrab.com` → VM IP (34.121.50.214)
- SSH access to the VM
- MongoDB installed on the VM

## Deployment Status

✅ **Backend Deployed Successfully**
- API URL: https://api.meditrack.jumpingcrab.com
- Server IP: 34.121.50.214
- Port: 3002
- SSL: Enabled via Let's Encrypt
- PM2 Process: `final-project`
- Status: Running

**Note:** If DNS hasn't fully propagated, you can verify the backend is working by SSH'ing into the VM and running:
```bash
curl http://localhost:3002
# Should return: MediTrack backend is running 🚀
```

## Deployment Steps

### 1. Configure NGINX

SSH into your VM and create a new NGINX configuration:

```bash
# Copy the default configuration
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/final-project

# Edit the new configuration
sudo nano /etc/nginx/sites-available/final-project
```

Update the configuration file with the following changes:

- Replace all domain names with `api.meditrack.jumpingcrab.com` (EXCEPT in blocks managed by Certbot)
- Remove www subdomain lines (server_name and if ($host = ...))
- Change `proxy_pass` to use port 3002
- Update `root` directive to `/home/USERNAME/final-project-frontend`

Example configuration:

```nginx
server {
    server_name api.meditrack.jumpingcrab.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    root /home/USERNAME/final-project-frontend;
    index index.html index.htm;
}
```

Create a symlink to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/final-project /etc/nginx/sites-enabled/final-project
```

Test and reload NGINX:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Clone and Setup Backend

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/williamhasrouty/meditrack-backend.git

# Navigate into the project
cd meditrack-backend

# Checkout your branch (if not using main)
git fetch
git checkout stage-2-backend

# Install dependencies
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add the following configuration:

```
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017/meditrack
JWT_SECRET=your-production-secret-key-here
NODE_ENV=production
```

**Important**: Use a strong, unique JWT_SECRET for production!

### 4. Start Application with PM2

```bash
# Start the application on port 3002
PORT=3002 pm2 start app.js --name final-project

# Save the PM2 configuration
pm2 save

# Enable PM2 to start on system boot
pm2 startup
```

Verify the application is running:

```bash
pm2 status
pm2 logs final-project
```

### 5. Configure SSL with Certbot

```bash
# Run Certbot for NGINX
sudo certbot --nginx

# Follow the prompts:
# - Select all listed domains
# - If prompted with "Expand?", choose Expand
# - Agree to redirect HTTP to HTTPS
```

Certbot will automatically:

- Obtain SSL certificates
- Configure NGINX to use HTTPS
- Set up automatic certificate renewal

### 6. Deploy Frontend

On your local machine, build and deploy the frontend:

```bash
# Navigate to your frontend project
cd /path/to/se_project_meditrack

# Build the project
npm run build

# Deploy to the VM
scp -r ./dist/* YOUR_USERNAME@api.meditrack.jumpingcrab.com:/home/YOUR_USERNAME/final-project-frontend
```

### 7. Verify Deployment

Test the API endpoints:

```bash
# Health check (if implemented)
curl https://api.meditrack.jumpingcrab.com

# Test signup
curl -X POST https://api.meditrack.jumpingcrab.com/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

## Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs final-project

# NGINX access logs
sudo tail -f /var/log/nginx/access.log

# NGINX error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Application

```bash
pm2 restart final-project
```

### Update Application

```bash
cd ~/meditrack-backend
git pull origin stage-2-backend
npm install
pm2 restart final-project
```

### SSL Certificate Renewal

Certbot automatically renews certificates. To test renewal:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### Application Won't Start

1. Check PM2 logs: `pm2 logs final-project`
2. Verify environment variables in `.env`
3. Ensure MongoDB is running: `sudo systemctl status mongod`
4. Check port availability: `sudo lsof -i :3002`

### NGINX Errors

1. Test configuration: `sudo nginx -t`
2. Check error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify file permissions on frontend directory

### SSL Certificate Issues

1. Check certificate status: `sudo certbot certificates`
2. Renew manually: `sudo certbot renew`
3. Verify domain DNS records

### MongoDB Connection Issues

1. Check MongoDB status: `sudo systemctl status mongod`
2. Verify connection string in `.env`
3. Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`

## Security Checklist

- ✅ Strong JWT_SECRET in production
- ✅ HTTPS enabled via Certbot
- ✅ CORS configured for frontend domain
- ✅ Rate limiting enabled
- ✅ Helmet security headers
- ✅ MongoDB authentication (if applicable)
- ✅ Regular security updates: `sudo apt update && sudo apt upgrade`

## PM2 Commands Reference

```bash
pm2 start app.js --name final-project    # Start application
pm2 stop final-project                   # Stop application
pm2 restart final-project                # Restart application
pm2 delete final-project                 # Remove from PM2
pm2 logs final-project                   # View logs
pm2 monit                                # Monitor all processes
pm2 status                               # List all processes
pm2 save                                 # Save current process list
```

## Domain Configuration

| Subdomain                     | IP Address   | Purpose              |
| ----------------------------- | ------------ | -------------------- |
| api.meditrack.jumpingcrab.com | 97.167.151.3 | Backend API          |
| meditrack.jumpingcrab.com     | 97.167.151.3 | Frontend Application |

Both domains point to the same VM. NGINX routes requests based on the subdomain:

- `api.meditrack.jumpingcrab.com` → Backend (port 3002)
- `meditrack.jumpingcrab.com` → Frontend static files
