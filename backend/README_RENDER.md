Deploy backend to Render — quick steps

1) Push your repo to GitHub (if not already):

   git add .
   git commit -m "prepare for render deploy"
   git push origin main

2) On Render dashboard → New → "Web Service" → Connect your GitHub repo
   - Branch: main
   - Root Directory: backend
   - Environment: Node
   - Start Command: npm start
   - Plan: Free (or pick one)

3) Set environment variables (Render Dashboard → Environment):
   - MONGODB_URI = your MongoDB Atlas connection string
   - JWT_SECRET = a long secret string
   - NODE_ENV = production
   - CLIENT_URL = https://<your-frontend-url> (optional)

4) Deploy
   - Render will install dependencies and start the service
   - Health check: open the live URL and visit /api/health

Notes & caveats
- Files uploaded to /uploads are stored on the instance filesystem (ephemeral). For persistent uploads use S3 or similar.
- If you want automatic deploys on push, leave "Auto Deploy" enabled in Render service settings.

Manual verification
- API health: https://<your-render-service>.onrender.com/api/health
- Portfolio data: https://<your-render-service>.onrender.com/api/portfolio

If you'd like, I can:
- create a GitHub Actions workflow to auto-deploy
- add a Render Health Check / status page
- prepare Dockerfile instead of using Render's native Node service

Tell me which next step you want me to perform.