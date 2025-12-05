# Deploy to Render.com

This guide will walk you through deploying your coding interview platform to Render.com.

## Prerequisites

1. **GitHub Repository**: Your code is already on GitHub ✅
   - Repository: `https://github.com/code-hy/coding-interview-platform`
2. **MongoDB Atlas**: You have a MongoDB connection string ✅
3. **Render Account**: Free account at [render.com](https://render.com)

---

## Step 1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with your GitHub account (recommended for easy integration)

---

## Step 2: Create a New Web Service

1. **Log in to Render Dashboard**
2. Click **"New +"** button (top right)
3. Select **"Web Service"**

---

## Step 3: Connect Your Repository

1. Click **"Connect a repository"**
2. If this is your first time:
   - Click **"Configure account"**
   - Grant Render access to your GitHub repositories
   - You can choose "All repositories" or select specific ones
3. Find and select: `code-hy/coding-interview-platform`
4. Click **"Connect"**

---

## Step 4: Configure the Web Service

Fill in the following settings:

### Basic Settings

| Field | Value |
|-------|-------|
| **Name** | `coding-interview-platform` (or your preferred name) |
| **Region** | Choose closest to you (e.g., `Oregon (US West)`) |
| **Branch** | `main` |
| **Root Directory** | Leave blank |
| **Runtime** | `Docker` |

### Build & Deploy Settings

Render will automatically detect your `Dockerfile` and use it.

- **Docker Command**: Leave blank (uses `CMD` from Dockerfile)
- **Docker Context Directory**: `.` (current directory)

---

## Step 5: Configure Environment Variables

Scroll down to **"Environment Variables"** section and add the following:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `NODE_ENV` | `production` | Sets production mode |
| `PORT` | `5000` | Internal port (Render maps this automatically) |
| `FRONTEND_URL` | `https://coding-interview-platform.onrender.com` | Replace with your actual Render URL |

> **Important**: For `FRONTEND_URL`, use the format:
> `https://[your-service-name].onrender.com`
> 
> You can find your service URL at the top of the settings page after creation.

### How to Add Environment Variables:

1. Click **"Add Environment Variable"**
2. Enter **Key** and **Value**
3. Repeat for each variable
4. Click **"Add"** for each one

---

## Step 6: Choose Your Plan

1. Scroll to **"Instance Type"**
2. Select **"Free"** (for testing) or **"Starter"** (for production)
   - **Free**: 
     - Spins down after 15 minutes of inactivity
     - Takes ~30 seconds to wake up on first request
     - 512 MB RAM
   - **Starter ($7/month)**:
     - Always on
     - 512 MB RAM
     - Better for production use

---

## Step 7: Deploy!

1. Click **"Create Web Service"** at the bottom
2. Render will now:
   - Clone your repository
   - Build the Docker image (this takes 5-10 minutes)
   - Deploy the container
   - Assign a public URL

### Monitor the Deployment

- You'll see a **build log** showing the progress
- Wait for the status to change from "Building" → "Live" 🟢

---

## Step 8: Update FRONTEND_URL (Important!)

After deployment completes:

1. Copy your Render URL (e.g., `https://coding-interview-platform.onrender.com`)
2. Go to **"Environment"** tab in Render dashboard
3. Update `FRONTEND_URL` to match your actual URL
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## Step 9: Test Your Deployment

1. Click on your service URL (e.g., `https://coding-interview-platform.onrender.com`)
2. You should see the home page
3. Test creating an interview:
   - Enter a candidate name
   - Select a language
   - Click "Create Interview"
4. Test code execution in the interview room

---

## Troubleshooting

### Build Fails

**Check the logs:**
- Click on the **"Logs"** tab
- Look for error messages

**Common issues:**
- Missing environment variables
- MongoDB connection string incorrect
- Dockerfile syntax errors

### Application Crashes

**Check runtime logs:**
- Go to **"Logs"** tab
- Look for errors after "Live" status

**Common issues:**
- Invalid `MONGODB_URI`
- MongoDB Atlas IP whitelist doesn't include `0.0.0.0/0`
- Port mismatch (ensure `PORT=5000` in env vars)

### Can't Connect to MongoDB

1. Go to MongoDB Atlas dashboard
2. Click **"Network Access"**
3. Add IP Address: `0.0.0.0/0` (allows all IPs)
4. Click **"Confirm"**

### Application is Slow to Wake Up

This is normal for the **Free tier**. The service spins down after 15 minutes of inactivity and takes ~30 seconds to wake up.

**Solutions:**
- Upgrade to **Starter plan** ($7/month) for always-on service
- Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your app every 5 minutes (keeps it awake)

### Go Code Execution Timeouts (Free Tier)

**Known Limitation:** Go compilation is resource-intensive and may timeout on Render's free tier.

**Status:**
- ✅ **JavaScript**: Works (client-side)
- ✅ **Python**: Works (client-side via Pyodide)
- ✅ **Java**: Works (server-side)
- ✅ **C++**: Works (server-side)
- ⚠️ **Go**: May timeout on free tier (works fine locally and on paid plans)

**Workaround:**
- Use simpler Go code snippets
- Upgrade to Starter plan ($7/month) for better CPU performance
- Disable Go option for free tier deployments

---

## Automatic Deployments

Render automatically deploys when you push to the `main` branch on GitHub!

**Workflow:**
1. Make changes locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push origin main`
4. Render automatically detects the push and redeploys 🚀

---

## Custom Domain (Optional)

To use your own domain (e.g., `interview.yourdomain.com`):

1. Go to **"Settings"** tab in Render
2. Scroll to **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Enter your domain
5. Follow the DNS configuration instructions
6. Update `FRONTEND_URL` environment variable to match your custom domain

---

## Monitoring & Logs

### View Logs
- Go to **"Logs"** tab
- See real-time application logs
- Useful for debugging

### Metrics
- Go to **"Metrics"** tab
- See CPU, memory usage
- Monitor response times

---

## Costs

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/month | 512 MB RAM, spins down after 15 min inactivity |
| **Starter** | $7/month | 512 MB RAM, always on |
| **Standard** | $25/month | 2 GB RAM, always on |

**Recommendation**: Start with **Free** for testing, upgrade to **Starter** for production.

---

## Next Steps After Deployment

1. ✅ Test all features (create interview, run code in all languages)
2. ✅ Share the URL with your team
3. ✅ Monitor logs for any errors
4. Consider adding:
   - Custom domain
   - SSL certificate (automatic with Render)
   - Monitoring/alerting
   - Backup strategy for MongoDB

---

## Support

- **Render Docs**: [https://render.com/docs](https://render.com/docs)
- **Render Community**: [https://community.render.com](https://community.render.com)
- **Your GitHub Repo**: [https://github.com/code-hy/coding-interview-platform](https://github.com/code-hy/coding-interview-platform)

---

## Summary Checklist

- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Configure Web Service (Docker runtime)
- [ ] Add environment variables (MONGODB_URI, NODE_ENV, PORT, FRONTEND_URL)
- [ ] Choose plan (Free or Starter)
- [ ] Deploy and wait for "Live" status
- [ ] Update FRONTEND_URL with actual Render URL
- [ ] Test the application
- [ ] Configure MongoDB Atlas IP whitelist (0.0.0.0/0)
- [ ] Share your live URL! 🎉
