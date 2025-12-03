# Plant Catalog Microservice (Lambda + API Gateway)

Proxies Perenual **v2** free API so the API key stays on the backend.
Exposed routes:

- GET `/v2/species-list`
- GET `/v2/species/details/{id}`
- GET `/pest-disease-list`
- GET `/species-care-guide-list`
- GET `/hardiness-map` (HTML)

## Deploy (CI/CD)
GitLab pipeline uses AWS SAM:
- `sam build`
- `sam deploy --parameter-overrides PerenualApiKey=${PERENUAL_API_KEY}`

### Required GitLab variables
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION=ap-southeast-1`
- `STACK_NAME=plant-catalog`
- `PERENUAL_API_KEY=<your_key>`

## Local test
You can invoke locally with SAM:
```bash
sam build
sam local start-api
# then in another terminal
curl "http://127.0.0.1:3000/v2/species-list?q=aloe&page=1"
curl "http://127.0.0.1:3000/v2/species/details/1"
curl "http://127.0.0.1:3000/pest-disease-list?q=rust"
curl "http://127.0.0.1:3000/species-care-guide-list?species_id=1&type=watering"
curl "http://127.0.0.1:3000/hardiness-map?species_id=1"
