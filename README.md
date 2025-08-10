# Receipt OCR & Structured Extraction (Full Stack)

Backend-focused system that ingests supermarket / restaurant receipt images, performs OCR + intelligent structuring, and exposes normalized data via a GraphQL API consumed by a minimal Next.js frontend.

## Tech Stack

Core:

- Node.js 20 (TypeScript)
- Apollo GraphQL Server 5
- PostgreSQL 15 + Prisma ORM
- AWS Textract (high-accuracy OCR)
- Google Gemini 2.5 Flash Lite (AI post-processing / structuring)
- Next.js 15 (frontend upload + results view)
- Docker & docker compose (local orchestration)

## Folder Structure

```folderStructure
└── 📁Receipt_OCR_DataExtraction_FullStack
    └── 📁backend
        └── 📁controllers
            ├── receipt.controller.ts
        └── 📁generated
            └── 📁prisma
        └── 📁graphql
            └── 📁resolvers
                ├── item.resolver.ts
                ├── receipt.resolver.ts
            └── 📁typeDefs
                ├── item.typeDef.ts
                ├── receipt.typeDef.ts
            ├── schema.ts
        └── 📁prisma
            └── 📁migrations
            ├── schema.prisma
        └── 📁routes
            ├── receipt.route.ts
        └── 📁services
            └── 📁parsers
                ├── aiFormatter.ts
                ├── parseProximity.ts
            ├── upload.service.ts
        └── 📁types
            ├── receipt.ts
        └── 📁unnessassry
            ├── proximityParser.js
            ├── textractBlockResponse.txt
        └── 📁uploads
        ├── .dockerignore
        ├── .env
        ├── .gitignore
        ├── apolloServer.ts
        ├── app.ts
        ├── Dockerfile
    └── 📁frontend
        └── 📁public
        └── 📁src
            └── 📁app
                └── 📁lib
                    ├── apolloClient.ts
                ├── ClientProviders.tsx
                ├── favicon.ico
                ├── globals.css
                ├── layout.tsx
                ├── page.tsx
            └── 📁components
                ├── ItemsTable.tsx
                ├── ProcessedResultCard.tsx
                ├── ReceiptsList.tsx
                ├── UploadForm.tsx
            └── 📁graphql
                └── 📁mutations
                    ├── upload.ts
                └── 📁queries
                    ├── receipts.ts
        ├── .dockerignore
        ├── .env
        ├── .gitignore
        ├── Dockerfile
        ├── eslint.config.mjs
        ├── README.md
    └── 📁TestDataSet
    ├── .gitignore
    ├── docker-compose.yml
    └── README.md
```

## High-Level Architecture

```text
+-----------------+         GraphQL Upload (multipart)          +------------------------+
|  Next.js UI     |  -----------------------------------------> |  Apollo GraphQL Server |
|  (User selects  |                                           / |  (Express)             |
|  receipt image) |<------------------------------------------   +-----------+------------+
+--------+--------+                JSON Response (parsed)                   |
         |                                                                  |
         |                                                                  v
         |                                                       +-------------------+
         |                                                       |  Upload Service   |
         |                                                       |  (temp file save) |
         |                                                       +---------+---------+
         |                                                                 |
         |                                                                 v
         |   1. Image bytes                               +-------------------------------+
         |   2. Async request (≈4.0s)                     | AWS Textract (OCR extraction) |
         |------------------------------------------------> (LINES + bounding boxes JSON) |
                                                           +----------------------+------+
                                                                                  |
                                                                                  v
                                                       +----------------------------------------+
                                                       | Proximity / Line Grouping Parser       |
                                                       | (normalize lines -> ParsedReceipt)     |
                                                       +----------------------+-----------------+
                                                                                  |
                                                                     (≈2.5s)     v
                                                       +----------------------------------------+
                                                       | Gemini Formatter (strict JSON schema)  |
                                                       |  - Derives items, totals, metadata     |
                                                       +----------------------+-----------------+
                                                                                  |
                                                                                  v
                                                       +----------------------------------------+
                                                       | Prisma Persistence (PostgreSQL)        |
                                                       +----------------------+-----------------+
                                                                                  |
                                                                                  v
                                                       +----------------------------------------+
                                                       | GraphQL Response (Receipt + Items)     |
                                                       +----------------------------------------+
```

### Flow Breakdown & Advantages

1. Fast byte-stream upload via GraphQL multipart -> immediate temp file persistence (no huge memory buffering).
2. Textract chosen for: multi-language support, robust layout understanding, and geometry (better than pure OCR libs for receipts).
3. Lightweight geometric proximity parser groups raw Textract LINE blocks into logical text rows before AI formatting (reduces prompt noise and cost).
4. Gemini 2.5 Flash Lite enforces a response JSON schema (minimizes hallucination) and applies deterministic post-validation to calculate line totals and fallback total when missing.
5. Database persistence (idempotent storage per upload path) enables later querying / enrichment (e.g., categorization, analytics).
6. Separation of concerns: each step (upload, OCR, structural parse, AI normalization, persistence) is isolated for easy swapping (e.g., replace Textract with Google Vision, or Gemini with local rule engine).

### Performance

- End-to-end average latency (single receipt): ~6.5 seconds
  - AWS Textract OCR: ≈4.0 s
  - Gemini structuring: ≈2.5 s
- AI response post-validated locally to ensure numeric integrity (lineTotal & totalPrice).
- Potential parallel optimization: prefetch AI prompt while performing DB writes or stream Textract blocks (future work).

## Running with Docker

Prerequisites: Docker Desktop (or compatible engine).

Environment variables required (place in `backend/.env`):

```env
GEMINI_API_KEY=your_gemini_api_key
AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
# DATABASE_URL is injected by docker-compose for the backend
``` 
Frontend optional env (`frontend/.env`):

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:5000/graphql
```

### 1. Build Images

```bash
docker compose build
```

### 2. Run Migrations (one-off)

```bash
docker compose run --rm backend npx prisma migrate deploy
```

### 3. Start the Stack

Detached:

```bash
docker compose up
```

You should then see:

- Backend: <http://localhost:5000/graphql>
- Frontend: <http://localhost:3000>

(or just `docker compose down` and retry).

## GraphQL Usage

Mutation (multipart upload):

```graphql
mutation UploadReceipt($file: Upload!) {
  uploadAndProcess(file: $file) {
    message
    receipt {
      id
      storeName
      purchaseDate
      totalAmount
      items { id name quantity price lineTotal }
      imageUrl
      createdAt
    }
    aiFormatted {
      totalPrice
      items { name quantity price lineTotal }
    }
  }
}
```

Example Apollo upload client (frontend already wired):

```typescript
const client = new ApolloClient({
  link: createUploadLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL }),
  cache: new InMemoryCache(),
});
```

## Data Model (Prisma excerpt)

```prisma
model Receipt {
  id           String   @id @default(uuid())
  storeName    String
  purchaseDate DateTime
  totalAmount  Float
  items        Item[]
  imageUrl     String
  createdAt    DateTime @default(now())
}

model Item {
  id        String  @id @default(uuid())
  name      String
  quantity  Int?
  price     Float?   // added migration
  lineTotal Float?   // derived or AI provided
  receiptId String
  receipt   Receipt @relation(fields: [receiptId], references: [id])
}
```

## Advantages of This Implementation

- Deterministic post-AI validation ensures numerical coherence even if AI omits totals.
- AI prompt engineered with hard rules + schema to minimize hallucination and standardize shape.
- Modular parsers: swapping OCR or AI requires touching only dedicated service modules.
- Docker reproducibility: single command to spin entire stack (db + API + UI).
- Performance transparency: measured timings surfaced; clear optimization targets.
- Extensible DB schema (already supports adding categorization or user ownership migrations).

## Extensibility Ideas

- Background queue (BullMQ) for large batch uploads (async status polling via subscription).
- Caching layer (Redis) for duplicate image hash detection.
- User accounts & auth (JWT) + per-user receipt ownership.
- Category tagging & spending analytics dashboards.
- Export endpoints (CSV / PDF) & webhooks for downstream systems.

## Quick Start (All In One)

```bash
# 1. Build
docker compose build
# 2. Apply DB migrations
docker compose run --rm backend npx prisma migrate deploy
# 3. Launch
docker compose up -d
# 4. Visit
open http://localhost:3000  # (or manually in browser)
```

---
Performance: ~6.5s end-to-end (4.0s Textract + 2.5s Gemini formatting) per average receipt.
