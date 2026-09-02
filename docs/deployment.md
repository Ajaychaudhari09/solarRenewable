# GridPulse AI — Deployment Guide

## IBM Cloud Code Engine (Recommended for Hackathon)

### Backend Deployment

1. **Build container:**
```bash
cd backend
# Create Dockerfile
```

2. **Push to IBM Container Registry:**
```bash
ibmcloud cr login
ibmcloud cr build --image us.icr.io/your-namespace/gridpulse-backend:latest .
```

3. **Deploy to Code Engine:**
```bash
ibmcloud ce application create \
  --name gridpulse-backend \
  --image us.icr.io/your-namespace/gridpulse-backend:latest \
  --port 8000 \
  --env GRANITE_API_KEY=your_key \
  --env GRANITE_PROJECT_ID=your_project_id \
  --env APP_ENV=production
```

### Frontend Deployment

```bash
cd frontend
npm run build
# Deploy dist/ to IBM Cloud Object Storage static hosting
# or IBM Cloud Code Engine with nginx
```

### Environment Variables for Production

| Variable | Value |
|---|---|
| `GRANITE_API_KEY` | IBM Cloud API key |
| `GRANITE_PROJECT_ID` | watsonx.ai project GUID |
| `GRANITE_URL` | https://us-south.ml.cloud.ibm.com |
| `APP_ENV` | production |
| `CORS_ORIGINS` | Your frontend URL |

## Docker (Local)

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

```bash
docker build -t gridpulse-backend .
docker run -p 8000:8000 --env-file .env gridpulse-backend
```
