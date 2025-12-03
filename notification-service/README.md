# sendReminder Lambda

Invoked by an orchestrator (Step Functions). Sends SMS/WhatsApp via Twilio and returns `{ ok: true|false, ... }`. Optionally writes audit rows to DynamoDB.

## Deploy
sam build && sam deploy --guided

## Invoke sample
sam local invoke SendReminderFunction -e events/sample.json
