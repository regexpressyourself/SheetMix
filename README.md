# Sam's Remix + Google Sheets App Starter Kit!

- [Remix Docs](https://remix.run/docs)
- [Google Sheets Docs](https://developers.google.com/sheets/api/quickstart/js)

## Required gobal packages

- sass: `yarn global add sass`
- prettier: `yarn global add prettier`

## `.env` File
```
# Replace USERNAME, PASSWORD, DB_NAME
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost/DB_NAME

# Any string
SESSION_SECRET=any_string

# Google credentials ([See docs](https://developers.google.com/workspace/guides/create-credentials))
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret

# Node port of choice (default is 3000; not used in dev mode)
PORT=3000
```

## Database

### Initial setup

1. Create: `npx prisma init --datasource-provider postgresql`
    - _edit prisma/schema.prisma and add a model_
2. Generate: `npx prisma generate`

### Maintenance

- Seed: `npx prisma db seed`
- Migrate: `npx prisma migrate dev`
- Reset: `npx prisma migrate reset`
- Re-create prisma schema based on DB: `npx prisma db push`
- Web admin panel: `npx prisma studio`


## Development

**Running concurrently**

```sh
npm run dev
```

**Running separately (in separate terminal windows)**

```sh
npm run sass:dev
remix watch
npm run serve:dev
```

## Deployment

**Running concurrently**

```sh
npm run start
```

**Running separately**

```sh
npm run sass
remix build
npm run serve
```
