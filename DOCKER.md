# Docker Deployment Guide

## Prerequisites

1. **Install Docker Desktop**
   - Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
   - Mac: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
   - Linux: Install Docker Engine and Docker Compose

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Ensure `.env` file exists** with your MongoDB URI:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   FRONTEND_URL=http://localhost:5000
   PORT=5000
   ```

2. **Build and start the container:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Open browser: http://localhost:5000

4. **Stop the container:**
   ```bash
   # Press Ctrl+C, then:
   docker-compose down
   ```

### Option 2: Using Docker CLI

1. **Build the image:**
   ```bash
   docker build -t coding-interview-platform .
   ```

2. **Run the container:**
   ```bash
   docker run -p 5000:5000 \
     -e MONGODB_URI="your_mongodb_uri_here" \
     -e FRONTEND_URL="http://localhost:5000" \
     --name interview-app \
     coding-interview-platform
   ```

3. **Stop the container:**
   ```bash
   docker stop interview-app
   docker rm interview-app
   ```

---

## Docker Commands Reference

### Building

```bash
# Build image
docker build -t coding-interview-platform .

# Build with no cache (fresh build)
docker build --no-cache -t coding-interview-platform .

# Build with docker-compose
docker-compose build

# Build and start
docker-compose up --build
```

### Running

```bash
# Run in foreground
docker-compose up

# Run in background (detached)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Debugging

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Execute command in running container
docker exec -it <container_id> sh

# View container logs
docker logs <container_id>

# View logs (follow)
docker logs -f <container_id>

# Inspect container
docker inspect <container_id>
```

### Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all unused data (containers, networks, images)
docker system prune

# Remove everything including volumes (⚠️ CAUTION)
docker system prune -a --volumes
```

---

## What the Dockerfile Does

1. **Base Image**: Uses `node:20-alpine` for a lightweight container
2. **Installs Compilers**:
   - Python 3 (for Pyodide support)
   - OpenJDK 17 (Java)
   - GCC/G++ (C++)
   - Go compiler
3. **Installs Dependencies**: Runs `npm ci` for production dependencies
4. **Builds Frontend**: Compiles Vite app for production
5. **Exposes Port 5000**: Makes the app accessible
6. **Health Check**: Monitors app health via `/api/health` endpoint

---

## Environment Variables

The Docker container needs these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:5000` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |

**Set via `.env` file** (recommended):
```env
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=http://localhost:5000
PORT=5000
```

**Or pass directly to Docker:**
```bash
docker run -e MONGODB_URI="..." -e PORT=5000 ...
```

---

## Production Deployment

### Deploy to Cloud Platforms

#### 1. **Render.com** (Easiest)

1. Connect your GitHub repository
2. Create a new Web Service
3. Render will auto-detect the Dockerfile
4. Add environment variables in Render dashboard
5. Deploy!

#### 2. **Railway.app**

1. Connect GitHub repository
2. Railway auto-detects Dockerfile
3. Add environment variables
4. Deploy with one click

#### 3. **AWS ECS / Google Cloud Run / Azure Container Instances**

1. Build and push image to container registry:
   ```bash
   # Tag image
   docker tag coding-interview-platform:latest your-registry/coding-interview-platform:latest
   
   # Push to registry
   docker push your-registry/coding-interview-platform:latest
   ```

2. Deploy using platform-specific tools

---

## Troubleshooting

### Port Already in Use

**Error:** `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution:**
```bash
# Stop the container using the port
docker-compose down

# Or change the port in docker-compose.yml
ports:
  - "5001:5000"  # Map host port 5001 to container port 5000
```

### Build Fails

**Check Docker logs:**
```bash
docker-compose logs
```

**Common issues:**
- Missing `.env` file → Create it with required variables
- Network issues → Check internet connection
- Disk space → Run `docker system prune`

### Container Exits Immediately

**Check logs:**
```bash
docker-compose logs app
```

**Common causes:**
- Invalid `MONGODB_URI`
- Missing environment variables
- Application error on startup

### Can't Connect to MongoDB

**Verify:**
1. `MONGODB_URI` is correct in `.env`
2. MongoDB Atlas IP whitelist includes `0.0.0.0/0` (or your IP)
3. Database user credentials are correct

---

## Development vs Production

### Development (Current Setup)
```bash
npm run dev
```
- Hot reload
- Source maps
- Faster iteration
- No Docker needed

### Production (Docker)
```bash
docker-compose up
```
- Optimized build
- All compilers included
- Production-ready
- Portable and consistent

**Recommendation:** Use `npm run dev` for development, Docker for production/deployment.

---

## Next Steps

1. ✅ Ensure `.env` file has valid `MONGODB_URI`
2. ✅ Run `docker-compose up --build`
3. ✅ Test at http://localhost:5000
4. ✅ Deploy to cloud platform (Render, Railway, etc.)
