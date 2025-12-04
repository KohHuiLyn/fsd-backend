# Scheduler Service - Run and Test Guide

## Overview

The scheduler-service is a **cron-based reminder scheduler** that:
- Polls for due reminders from the reminder service at regular intervals
- Processes reminders by resolving phone numbers and sending notifications via AWS Lambda
- Uses `node-cron` for reliable scheduled task execution

The service is a **single component**:
- **API Server** (`server.ts`) - Runs cron job and provides health check endpoint

## Prerequisites

1. **Node.js 20+** installed
2. **AWS credentials configured** (for Lambda invocation)
3. Required environment variables (see below)

## Environment Variables

Create a `.env` file in the `scheduler-service` directory with the following variables:

```bash
# External Services
REMINDER_SERVICE_BASEURL=http://localhost:3000     # Base URL of reminder service
USER_SERVICE_BASEURL=http://localhost:3001         # Base URL of user service

# Polling Configuration
POLL_INTERVAL_MS=30000                             # How often to poll (default: 30 seconds)
DUE_WINDOW_SEC=60                                  # Time window for "due" reminders (seconds)

# Security
AUTH_BEARER=DEV                                    # Bearer token for API authentication

# AWS Configuration (for Lambda)
AWS_REGION=ap-southeast-1                          # AWS region
NOTIF_FN=sendReminder                              # Lambda function name for notifications

# Timezone
TZ=Asia/Singapore                                  # Timezone (default: Asia/Singapore)

# Server
PORT=4000                                          # Port for health check endpoint (default: 4000)
```

## Running the Service

### Step 1: Install Dependencies

```bash
cd scheduler-service
npm install
```

### Step 2: Build TypeScript (Optional for development)

For development, you can skip this step and use `npm run dev` which uses `tsx` for direct TypeScript execution.

For production:
```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Step 3: Start the Service

You only need to run **one command**:

```bash
# Development mode (with auto-reload via tsx)
npm run dev

# OR production mode (after building)
npm run start
```

You should see:
```
🚀 Starting scheduler-service...
⏰ Setting up cron job: */30 * * * * * (every 30s)
   → Polling every 30 seconds
   → Due window: 60 seconds
🔄 Running initial poll...
✅ scheduler-service running on port 4000
   → Health check: http://localhost:4000/health
   → Polling every 30 seconds
```

The service will:
1. Set up a cron job to poll for due reminders at the configured interval
2. Run an initial poll immediately on startup
3. Start an Express server on port 4000 (default) with a health endpoint

## Service Architecture

```
┌─────────────────┐
│  Express Server │─── Health check endpoint
│  (server.ts)    │
└─────────────────┘
         │
         │ (cron job triggers)
         ▼
┌─────────────────┐
│  Cron Scheduler │─── Runs pollAndProcessReminders() every 30s
│  (node-cron)    │
└─────────────────┘
         │
         │ (for each due reminder)
         ▼
┌─────────────────┐
│  Scheduler      │─── Fetches due reminders
│  (scheduler.ts) │─── Processes each reminder in parallel
└─────────────────┘
         │
         │ (for each reminder)
         ▼
┌─────────────────┐
│  Activities     │─── Resolves phone number
│  (activities.ts)│─── Invokes AWS Lambda to send SMS
└─────────────────┘
```

## Testing

### 1. Health Check

Test that the service is running:

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok"}
```

### 2. Verify Cron Job is Running

Check the service logs. You should see periodic messages like:

```
🕒 Polling for due reminders...
   → Found X reminder(s) to process.
```

### 3. Test End-to-End Flow

1. **Ensure reminder service is running** and has reminders due in the next 60 seconds
2. **Monitor service logs** - you should see:
   ```
   🕒 [listDueReminders] Fetching due reminders...
   ✅ [listDueReminders] Received X reminder(s)
   📋 Processing reminder: <reminder-id> - <reminder-name>
   📤 [sendNotification] Invoking Lambda: sendReminder
   ✅ Successfully processed reminder: <reminder-id>
   📊 Reminder processing complete: X succeeded, Y failed
   ```
3. **Verify Lambda invocation** - Check AWS CloudWatch logs for your Lambda function

### 4. Test Reminder Service Endpoint Directly

Verify the reminder service is accessible:

```bash
curl -H "Authorization: Bearer DEV" \
  "http://localhost:3000/reminder/v1/reminders/due?windowSec=60"
```

Expected response:
```json
{
  "reminders": [
    {
      "id": "...",
      "user_id": "...",
      "name": "...",
      "notes": "...",
      "due_at": "2024-01-01T12:00:00Z",
      "is_proxy": false,
      "proxy": null
    }
  ]
}
```

### 5. Verify User Service Endpoint

Test that the user service can resolve phone numbers:

```bash
curl -H "Authorization: Bearer DEV" \
  "http://localhost:3001/users/<user-id>"
```

Expected response:
```json
{
  "phone_number": "+6512345678",
  ...
}
```

## Development Workflow

### Running in Development Mode

Use the `dev` script for auto-reload:

```bash
npm run dev
```

The service will automatically reload when you make changes to TypeScript files.

### Project Structure

```
scheduler-service/
├── src/
│   ├── server.ts          # Main server (sets up cron and Express)
│   ├── scheduler.ts       # Core scheduler logic (polling and processing)
│   ├── activities.ts      # External service calls (reminders, users, Lambda)
│   └── env.ts            # Environment configuration
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Troubleshooting

### Service not starting

- Check that all required environment variables are set
- Verify Node.js version is 20+: `node --version`
- Check for errors in startup logs

### Cron job not running

- Verify `POLL_INTERVAL_MS` is set correctly (minimum 5000ms = 5 seconds)
- Check service logs for cron setup messages
- Ensure the service process is still running

### Reminders not being fetched

- Verify `REMINDER_SERVICE_BASEURL` is correct and accessible
- Check reminder service is running: `curl http://localhost:3000/health`
- Test the endpoint manually (see Testing section above)
- Check service logs for HTTP errors

### Phone numbers not resolving

- Verify `USER_SERVICE_BASEURL` is correct and accessible
- Check user service is running
- Test the endpoint manually with a valid user ID
- Check service logs for errors

### Lambda not being invoked

- Verify AWS credentials are configured (check `~/.aws/credentials` or environment variables)
- Check `AWS_REGION` and `NOTIF_FN` environment variables
- Review AWS CloudWatch logs for Lambda errors
- Ensure Lambda function exists and has correct permissions
- Verify IAM role/user has `lambda:InvokeFunction` permission

### Service crashes or stops

- Check for unhandled promise rejections in logs
- Verify all external services are reachable
- Check for memory issues (cron jobs run in the same process)
- Review error logs for specific failure points

## Cron Expression Details

The service automatically generates a cron expression based on `POLL_INTERVAL_MS`:

- **Intervals < 60 seconds**: Uses 6-field cron with seconds
  - Example: `*/30 * * * * *` (every 30 seconds)
- **Intervals >= 60 seconds**: Uses 5-field cron (standard)
  - Example: `*/5 * * * *` (every 5 minutes)

The minimum interval is 5 seconds for performance reasons.

## Production Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Run with Docker:**
   ```bash
   docker build -t scheduler-service .
   docker run -p 4000:4000 --env-file .env scheduler-service
   ```

3. **Or use Docker Compose** with your orchestration setup

### Production Considerations

- Ensure the service process stays running (use process managers like PM2, systemd, or Docker)
- Set up logging to a centralized system
- Monitor cron job execution and reminder processing
- Configure alerting for failed reminder processing
- Consider rate limiting if processing large numbers of reminders
- Set appropriate resource limits (CPU/memory) for the container/process

## Additional Notes

- The cron job runs continuously while the service is running
- Reminders are processed in parallel using `Promise.allSettled` to ensure all are attempted
- Failed reminders are logged but don't stop processing of other reminders
- The service runs an initial poll immediately on startup to catch any due reminders
- The service is stateless - no database or persistent storage required
