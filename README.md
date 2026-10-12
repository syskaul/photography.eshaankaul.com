# Photography by Eshaan Kaul

Personal photography website of Eshaan Kaul.

✨&nbsp;&nbsp;Features
-
- Built-in auth
- Photo uploads with camera metadata
- Organize photos by album
- Infinite scroll
- Light mode
- Automatic OG image generation
- CMD-K menu with photo search
- AI-generated text descriptions
- RSS/JSON feeds
- Support for Fujifilm film simulations

<img src="/readme/og-image-share.png" alt="OG Image Preview" width=600 />

The site uses a white appearance throughout. Share modals use the same liquid-glass treatment as controls and toast notifications, over a black backdrop at 80% opacity.
Toolbar glass adapts to the content beneath each control as photos scroll behind it: dark backdrops use a white tint and white selected icons; light backdrops keep dark selected icons. Inactive icons remain muted.
Camera, lens, and focal-length metadata are display-only. Their dedicated collection, photo, and OG image routes have been removed; these categories are not linked in the library, CMD-K menu, or sitemap. Film routes remain available.
Recipes have been removed, including photo overlays, detail/share modals, admin fields and management, EXIF extraction, and public/admin routes. Film simulations and other camera metadata remain supported. New databases contain no recipe columns. For an existing database, back it up and run `src/db/migrations/remove-recipes.sql` after deploying this version to permanently drop the old recipe columns. This destructive migration is explicit and does not run automatically.
All dropdown surfaces, including nested menus, photo choosers, selects, and autocomplete lists, use the same liquid-glass treatment.
Admin navigation, action buttons, and dialogs share that treatment while tables and form backgrounds remain solid. Admin pages without a sidebar use the full available width, with 12px interface text (editable fields stay at 16px on phones to avoid focus zoom).
The main toolbar's admin gear stays selected throughout admin routes, and the progressive header blur has a yellow tint. Admin tabs scroll with the page; only the tabs have glass styling, not their container. Scrollable admin tabs and tables include shadow clearance around glass controls.

📋&nbsp;&nbsp;Contents
-
- [Installation](#installation)
- [Receiving updates](#receiving-updates)
- [Local development](#local-development)
- [Customization](#customization)
- [Analytics](#analytics)
- [Alternate storage providers](#alternate-storage-providers)
- [Alternate database providers (experimental)](#alternate-database-providers-experimental)
- [I18N](#i18n)
- [FAQ](#faq)

🛠️&nbsp;&nbsp;Installation
-
### 1. Deploy to Vercel

1. Deploy this repository to Vercel and connect the required services.
2. Add required storage ([Vercel Postgres](https://vercel.com/docs/postgres) + [Vercel Blob](https://vercel.com/docs/vercel-blob)) as part of template installation
   - _When creating new blob store, make sure to configure as "public"_
   - _Preferred postgres provider: Neon, from Vercel Marketplace_
### 2. Setup Auth

1. [Generate auth secret](https://generate-secret.vercel.app/32) and add to environment variables:
   - `AUTH_SECRET`
2. Add admin user to environment variables:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
3. Trigger redeploy
   - Visit project on Vercel, navigate to "Deployments" tab, click ••• button next to most recent deployment, and select "Redeploy"

### 3. Upload your first photo 🎉
1. Visit `/admin`
2. Sign in with credentials supplied in Step 2
2. Click "Upload Photos"
3. Add optional title
4. Click "Create"

🔄&nbsp;&nbsp;Receiving updates
-
Deploy updates by pushing changes to the connected repository and redeploying the project.

💻&nbsp;&nbsp;Local development
-
1. Clone code
2. Run `pnpm i` to install dependencies
3. If necessary, install [Vercel CLI](https://vercel.com/docs/cli#installing-vercel-cli) and authenticate by running `vercel login`
4. Run `vercel link` to connect CLI to your project
5. Run `vercel dev` to start dev server with Vercel-managed environment variables

All required setup, optional integrations, and environment-variable checks now live in this README. There is no standalone `/admin/configuration` page.

See FAQ for [limitations of local development](#can-i-work-locally-without-access-to-an-image-storage-provider)

🎨&nbsp;&nbsp;Customization
-

### Content
- The site domain, title, description, language, and navigation title are
  hardcoded in `src/app/config.ts`.

### Analytics

Set `NEXT_PUBLIC_MIXPANEL_TOKEN` to the project token in `.env.local` for local
development and in the deployment environment for production. The token is a
public project identifier used by the browser SDK; do not hardcode it in
source files. This setup uses the same Mixpanel project in every environment,
so development and production events will be mixed.

Mixpanel tracks automatically, except in regions where consent would be
required (detected by browser timezone: Europe and EU/EEA territories), where
nothing is tracked. There is no consent UI. The implementation records:

- `photo_detail_viewed`: `photo_id`, optional `photo_title`, and
  `view_context`
- `photo_share_action`: `photo_id`, optional `photo_title`, and `share_method`

Automatic page tracking and autocapture are disabled. Events use a
pseudonymous browser identifier; URL/referrer/UTM and browser/device/screen
properties are excluded, and IP-based geolocation is disabled. Private-photo
views, admin activity, and camera/exposure/location metadata are not tracked.

Before first use, verify the project uses the
Simplified API and the `America/New_York` reporting timezone in Mixpanel
Project Settings. After deploying, confirm both events in
Mixpanel Live View.

### Performance
> ⚠️ Enabling may result in increased project usage. See FAQ for static optimization [troubleshooting hints](#why-do-production-deployments-fail-when-static-optimization-is-enabled).

- `NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTOS = 1` enables static optimization for photo pages (`p/[photoId]`), i.e., renders pages at build time
- `NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTO_OG_IMAGES = 1` enables static optimization for OG images, i.e., renders images at build time
- `NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTO_CATEGORIES = 1` enables static optimization for photo categories (`shot-on/[make]/[model]`, etc.), i.e., renders pages at build time
- `NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTO_CATEGORY_OG_IMAGES = 1` enables static optimization for photo category (`shot-on/[make]/[model]`, etc.) OG images, i.e., renders images at build time
- `NEXT_PUBLIC_PRESERVE_ORIGINAL_UPLOADS = 1` prevents photo uploads being compressed before storing
- `NEXT_PUBLIC_IMAGE_QUALITY = 1-100` controls the quality of large photos
- `NEXT_PUBLIC_DISABLE_BLUR = 1` prevents image blur data being stored and displayed (potentially useful for limiting Postgres usage)

### AI content generation

To enable AI-generated titles, captions, and semantic descriptions for photos, configure a provider. Vercel AI Gateway is the recommended path; direct OpenAI (or an OpenAI-compatible endpoint) is available as an alternate. If both variables are set, `OPENAI_SECRET_KEY` takes precedence.

#### Vercel AI Gateway

1. Set `AI_GATEWAY_MODEL` to a [supported model](https://vercel.com/docs/ai-gateway/models-and-providers) using the `creator/model-name` format, e.g. `openai/gpt-5.2` — the model must support image input (vision)
2. If deployed on Vercel, no API key is required — [authentication happens automatically via OIDC](https://vercel.com/docs/ai-gateway#authentication)
   - Outside Vercel (or for local development without `vercel env pull`), generate an API key from the [Vercel AI Gateway dashboard](https://vercel.com/docs/ai-gateway) and store it in `AI_GATEWAY_API_KEY`
3. Add [rate limiting](#rate-limiting) (_recommended_)
4. Configure auto-generated fields (optional)
   - Set which text fields auto-generate when uploading a photo by storing a comma-separated list, e.g., `AI_TEXT_AUTO_GENERATED_FIELDS = title,semantic`
   - Accepted values:
     - `all`
     - `title` (default)
     - `caption`
     - `semantic` (default)
     - `none`

#### Alternate: Direct OpenAI (or OpenAI-compatible)

1. Setup OpenAI
   - Create an [OpenAI](https://openai.com) account and fund it if using the direct OpenAI provider.
   - Setup usage limits to avoid unexpected charges (_recommended_)
2. Generate API key and store in environment variable `OPENAI_SECRET_KEY` (enable Responses API write access if customizing permissions)
   - Setting `OPENAI_SECRET_KEY` overrides a configured `AI_GATEWAY_MODEL`
   - Set `OPENAI_MODEL` to choose a specific model (set to 'compatible' to use gpt-4o)
3. URL configuration (optional)
   - Set `OPENAI_BASE_URL` to use alternate OpenAI-compatible providers
4. Add [rate limiting](#rate-limiting) (_recommended_)
5. Configure auto-generated fields (optional, see above for instructions)

### Location

To add location meta to entities like photos and albums:

1. Setup Google Places/Geocoding API
   - [Create Google Cloud project](https://console.cloud.google.com/projectcreate) if necessary
   - Enable "Places API (new)" (for finding places of interest)
   - Enable "Geocoding API" (for reverse lookup based on lat/long coordinates)
   - Select [Create credentials](https://console.cloud.google.com/apis/credentials) and choose "API key"
   - Choose "Restrict key" and select "Places API (new)" + "Geocoding API"
2. Store API key in `GOOGLE_PLACES_GEOCODING_API_KEY`
3. Add [rate limiting](#rate-limiting) (_recommended_)

### Rate limiting

Create an Upstash Redis store from the Vercel dashboard and link it to your project to enable rate limiting.

### Categories
- `NEXT_PUBLIC_CATEGORY_VISIBILITY`
  - Comma-separated value controlling which photo sets appear in grid sidebar and CMD-K menu, and in what order. For example, you could move films above albums by updating to `films,albums,recents`.
  - Accepted values:
     - `recents` (default)
     - `albums` (default)
     - `films` (default)
     - `focal-lengths`
  - Automatic categories for years, cameras, and lenses are no longer available. Photo metadata remains available on photo detail pages and in admin editing; existing year URLs still work when linked directly.
- Search is disabled for this site (nav button, CMD-K, and editable query headers), regardless of `NEXT_PUBLIC_ENABLE_SEARCH`.
- The navigation admin menu is available only when signed in; signed-out visitors can access the sign-in flow by navigating directly to `/admin/photos`.

### Display
- `NEXT_PUBLIC_ALWAYS_SHOW_EXPOSURE_COMP = 1` displays exposure compensation even when it's 0ev

### Grid
- Photo grids use fewer, larger thumbnails by default. Aspect ratio configuration (ratios of 1 or less) can increase the number of photos per row.

### Design
- `NEXT_PUBLIC_HIGH_DENSITY_PREVIEWS = 1` shows up to 6 photos in OG images (max defaults to 5)

### Settings
- `NEXT_PUBLIC_SITE_FEEDS = 1` enables feeds at `/feed.json` and `/rss.xml`

### Debugging
- `DISABLE_DEBUG_OUTPUTS = 1`
  - removes build identifier in `<head />`
  - disables debug export endpoints

## Alternate storage providers

Only one storage adapter—Vercel Blob, Cloudflare R2, AWS S3, or MinIO—can be used at a time. Ideally, configure this before photos are uploaded. If you have multiple adapters, you can set one as preferred by storing `aws-s3`, `cloudflare-r2`, `minio`, or `vercel-blob` in `NEXT_PUBLIC_STORAGE_PREFERENCE`. See [FAQ](#will-there-be-support-for-image-storage-providers-beyond-vercel-aws-and-cloudflare) regarding unsupported providers.

### Cloudflare R2

1. Setup bucket
   - [Create R2 bucket](https://developers.cloudflare.com/r2/) with default settings
   - Setup CORS under bucket settings:
   ```json
   [{
       "AllowedHeaders": ["*"],
       "AllowedMethods": [
         "GET",
         "PUT"
       ],
       "AllowedOrigins": [
          "http://localhost:3000",
          "http://localhost:3001",
          "https://{VERCEL_PROJECT_NAME}*.vercel.app",
          "{PRODUCTION_DOMAIN}"
       ]
   }]
   ```
   - Enable public hosting by doing one of the following:
       - Select "Connect Custom Domain" and choose a Cloudflare domain
       - OR
       - Select "Allow Access" from R2.dev subdomain
   - Store public configuration:
     - `NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET`: bucket name
     - `NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID`: account id (found on R2 overview page)
     - `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN`: either "your-custom-domain.com" or "pub-jf90908...s0d9f8s0s9df.r2.dev"
2. Setup private credentials
   - Create API token by selecting "Manage R2 API Tokens," and clicking "Create API Token"
   - Select "Object Read & Write," choose "Apply to specific buckets only," and select the bucket created in Step 1
   - Store credentials (⚠️ _Ensure access keys are not prefixed with `NEXT_PUBLIC`_):
     - `CLOUDFLARE_R2_ACCESS_KEY`
     - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

### AWS S3

1. Setup bucket
   - [Create an S3 bucket](https://s3.console.aws.amazon.com/s3) with Object Ownership set to **Bucket owner enforced** (ACLs disabled)
   - Configure public photo delivery:
     - Keep `BlockPublicAcls` and `IgnorePublicAcls` enabled
     - Disable `BlockPublicPolicy` and `RestrictPublicBuckets` only if required to apply the public-read bucket policy below. Account-level or Organizations policies can still block public access.
     - Apply this bucket policy after replacing `{BUCKET_NAME}`. It grants anonymous reads only and rejects insecure transport:
       ```json
       {
         "Version": "2012-10-17",
         "Statement": [
           {
             "Sid": "AllowPublicRead",
             "Effect": "Allow",
             "Principal": "*",
             "Action": "s3:GetObject",
             "Resource": "arn:aws:s3:::{BUCKET_NAME}/*"
           },
           {
             "Sid": "DenyInsecureTransport",
             "Effect": "Deny",
             "Principal": "*",
             "Action": "s3:*",
             "Resource": [
               "arn:aws:s3:::{BUCKET_NAME}",
               "arn:aws:s3:::{BUCKET_NAME}/*"
             ],
             "Condition": {
               "Bool": {
                 "aws:SecureTransport": "false"
               }
             }
           }
         ]
       }
       ```
       Do not grant public list, write, or delete access.
     - Enable default server-side encryption (SSE-S3)
   - Configure CORS for the exact site origins that need browser uploads:
     ```json
     {
       "CORSRules": [{
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "HEAD", "PUT"],
         "AllowedOrigins": [
           "https://{PRODUCTION_DOMAIN}",
           "http://localhost:3000",
           "http://localhost:3001"
         ],
         "ExposeHeaders": ["ETag"],
         "MaxAgeSeconds": 3600
       }]
     }
     ```
     Replace `{PRODUCTION_DOMAIN}` with the production hostname and add any specific preview hostname that needs uploads. Do not use a broad `*` origin for authenticated uploads.
     For this deployment, include `https://photography.eshaankaul.com`; allowing `https://photos.eshaankaul.com` alone does not allow uploads from the photography domain.
     The JSON above is the AWS CLI/API format. In the S3 console CORS editor, paste only the array inside `CORSRules`.
   - Store public configuration
     - `NEXT_PUBLIC_AWS_S3_BUCKET`: bucket name
     - `NEXT_PUBLIC_AWS_S3_REGION`: bucket region, e.g., "us-east-2"
2. Give the app server least-privilege access to the bucket. Prefer an IAM role or short-lived federated credentials; use an AWS profile/SSO for local development. The AWS SDK default credential provider chain is used when the optional static key variables below are unset.
   - Scope the IAM policy to this bucket:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": ["s3:ListBucket"],
           "Resource": "arn:aws:s3:::{BUCKET_NAME}"
         },
         {
           "Effect": "Allow",
           "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
           "Resource": "arn:aws:s3:::{BUCKET_NAME}/*"
         }
       ]
     }
     ```
     Do not add `s3:PutObjectAcl`: this setup uses **Bucket owner enforced** with ACLs disabled, and the app uploads and copies objects without setting ACLs. The app's S3 operations are covered by the bucket-level list permission and the object-level read, write, and delete permissions above.
   - For direct credentials from Vercel, create a dedicated IAM user with no console access, attach only the bucket-scoped policy above, and create an access key for an application running outside AWS.
   - Add these values to the Vercel project’s **Production** environment. Keep the access key variables server-only (never prefix them with `NEXT_PUBLIC_`) and rotate them regularly:
     - `AWS_S3_ACCESS_KEY`
     - `AWS_S3_SECRET_ACCESS_KEY`
     - `NEXT_PUBLIC_AWS_S3_BUCKET`
     - `NEXT_PUBLIC_AWS_S3_REGION`
   - For local development, use an AWS CLI profile/SSO where possible; otherwise set the same two key variables in the ignored `.env.local` file. Never commit credentials.
   - Public-read bucket policies make every uploaded object retrievable by anyone who knows its URL. Do not store sensitive or confidential content in this bucket.
   - For observability, enable S3 server access logging to a separate encrypted bucket, CloudTrail data events for this bucket, and CloudWatch request metrics. These may incur log storage, CloudTrail data-event, and CloudWatch custom-metric charges; see [Amazon S3 pricing](https://aws.amazon.com/s3/pricing/).

### MinIO

MinIO is a self-hosted S3-compatible object storage server.

#### 1. Server/bucket setup

First, install and deploy the MinIO server, then create a bucket with public read access.

- **Install MinIO:** [Follow official documentation](https://min.io/docs/minio/linux/operations/install-deploy-manage/deploy-minio-single-node-single-drive.html) to install and deploy MinIO.
- **Create bucket:**
  ```bash
  mc mb myminio/{BUCKET_NAME}
  ```
- **Set public read policy:** Create file named `bucket-policy.json` with the following content to allow read-only access:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "AWS": [
            "*"
          ]
        },
        "Action": [
          "s3:GetObject"
        ],
        "Resource": [
          "arn:aws:s3:::{BUCKET_NAME}/*"
        ]
      }
    ]
  }
  ```
  Next, apply this policy to your bucket:
  ```bash
  mc policy set myminio/photos bucket-policy.json
  ```
  
- **Store public configuration:** Set the following public environment variables for your application:
    - `NEXT_PUBLIC_MINIO_BUCKET`: Bucket name
    - `NEXT_PUBLIC_MINIO_DOMAIN`: MinIO server endpoint, e.g., "minio.yourdomain.com"
    - `NEXT_PUBLIC_MINIO_PORT`: (optional)
    - `NEXT_PUBLIC_MINIO_DISABLE_SSL`: Set to `1` to disable SSL (defaults to HTTPS)

#### 2. Create user with restricted permissions

Create a dedicated user and a policy that grants permission to manage objects within your `BUCKET_NAME`.

- **Define user policy:** Create file named `user-policy.json`. This policy will allow the user to list the bucket contents and to get, put, and delete objects within it.
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:PutObject"
        ],
        "Resource": [
          "arn:aws:s3:::{BUCKET_NAME}/*",
          "arn:aws:s3:::{BUCKET_NAME}"
        ]
      }
    ]
  }
  ```
- **Create policy:** Add named policy to MinIO.
  ```bash
  mc admin policy add myminio photos-manager-policy user-policy.json
  ```
- **Create user:** Create new user with access key and secret key.
  ```bash
  mc admin user add myminio {MINIO_ACCESS_KEY} {MINIO_SECRET_ACCESS_KEY}
  ```
- **Attach policy to user:** Assign `photos-manager-policy` to the user.
  ```bash
  mc admin policy set myminio photos-manager-policy user=MINIO_ACCESS_KEY
  ```
- **Store private credentials:** Set the following private environment variables for your application. ⚠️ **Ensure these access keys are not prefixed with `NEXT_PUBLIC`**.
  - `MINIO_ACCESS_KEY`: Your MINIO_ACCESS_KEY
  - `MINIO_SECRET_ACCESS_KEY`: Your MINIO_SECRET_ACCESS_KEY

## Alternate database providers (experimental)

Vercel Postgres can be switched to another Postgres-compatible, pooling provider by updating `POSTGRES_URL`. Some providers only work when SSL is disabled, which can configured by setting `DISABLE_POSTGRES_SSL = 1`.

### Supabase
1. Ensure connection string is set to "Transaction Mode" via port `6543`
2. Disable SSL by setting `DISABLE_POSTGRES_SSL = 1`

### Amazon Aurora PostgreSQL with Vercel OIDC

The app can use short-lived IAM database authentication tokens instead of a
stored PostgreSQL password. Enable `POSTGRES_IAM_AUTH_ENABLED = 1` and configure
these server-side Vercel environment variables:

- `AWS_ROLE_ARN`: IAM role trusted by your Vercel project through OIDC
- `AWS_REGION`: the Aurora cluster's region (for example, `us-east-2`)
- `PGHOST`: Aurora cluster endpoint
- `PGPORT`: database port (usually `5432`)
- `PGUSER`: PostgreSQL user granted the `rds_iam` role
- `PGDATABASE`: database name (defaults to `postgres`)

Enable IAM database authentication on the cluster and grant the Vercel IAM role
`rds-db:connect` for only the intended database user. Restrict the role trust
policy to the specific Vercel team, project, and environment. The [Vercel AWS
integration](https://vercel.com/marketplace/aws) can configure OIDC and database
connectivity; do not make an Aurora cluster publicly accessible to connect it
from Vercel. For local development without Vercel OIDC, omit `AWS_ROLE_ARN` and
use an AWS CLI profile or other AWS SDK default credentials. The local AWS
principal still needs `rds-db:connect`, and the machine must have network access
to the cluster. Do not store a generated IAM auth token in `POSTGRES_URL`;
tokens expire after 15 minutes and are generated automatically for new pool
connections.

When AWS S3 storage is configured without `AWS_S3_ACCESS_KEY` and
`AWS_S3_SECRET_ACCESS_KEY`, the S3 client also uses `AWS_ROLE_ARN` through
Vercel OIDC. Grant that role `s3:GetObject`, `s3:PutObject`,
`s3:DeleteObject`, and `s3:ListBucket` on only the photo bucket.

💬 &nbsp;&nbsp;I18N
-

Partial internationalization (for non-admin, user-facing text) is fixed to `en-US`.

### Supported Languages
- `bd-bn`
- `en-gb`
- `en-US`
- `es-es`
- `hi-in`
- `id-id`
- `pt-br`
- `pt-pt`
- `tr-tr`
- `vi-vn`
- `zh-cn`

To add support for a new language, follow the instructions in [/src/i18n/index.ts](./src/i18n/index.ts), using [en-us.ts](./src/i18n/locales/en-us.ts) as a reference.

Thank you ❤️ translators: [@sconetto](https://github.com/sconetto) (`pt-br`, `pt-pt`, `es-es`), [@brandnholl](https://github.com/brandnholl) (`id-id`), [@TongEc](https://github.com/TongEc) (`zh-cn`), [@xahidex](https://github.com/xahidex) (`bd-bn`, `hi-in`), [@mehmetabak](https://github.com/mehmetabak) (`tr-tr`), [@simondeeley](https://github.com/simondeeley) (`en-gb`), [@jasonquache](https://github.com/jasonquache) (`vi-vn`)

📖&nbsp;&nbsp;FAQ
-
#### How do I receive template updates?
> For repository updates, push the changes to the connected Git repository and redeploy from the Vercel project.

#### How do I edit multiple photos?
> In the admin menu, select "Batch edit ..." From there, you can perform bulk album, visibility, and delete actions.

#### Why don't my photo changes show up immediately?
> This template statically optimizes core views such as `/` and `/grid` to minimize visitor load times. Consequently, when photos are added, edited, or removed, it might take several minutes for those changes to propagate. If it seems like a change is not taking effect, use the admin "Clear Cache" action or redeploy.

#### Why do production deployments fail when static optimization is enabled?
> Large photos (over 30MB), or a CDN such as Cloudflare in front of Vercel, may destabilize static optimization.

#### Why don't my older photos look right?
> As the site evolves, camera metadata, blur data, and AI/privacy features may be updated. To refresh older photos, click the 'sync' button next to a photo or visit photo updates (`/admin/photos/updates`).

#### Why don't my OG images load when I share a link?
> Many services such as iMessage, Slack, and X, require near-instant responses when unfurling link-based content. In order to guarantee sufficient responsiveness, consider rendering pages and image assets ahead of time by enabling static optimization by setting `NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTOS = 1` and `NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTO_OG_IMAGES = 1`. Keep in mind that this will increase platform usage.

#### Why do vertical images take up so much space?
> Photo details display each image at its natural aspect ratio.

#### Why are my grid thumbnails so small?
> Thumbnail size depends on aspect ratio configuration. Ratios of 1 or less show more photos per row.

#### My images/content have fallen out of sync with my database and/or my production site no longer matches local development. What do I do?
> Use the admin "Clear Cache" action or redeploy.

#### What happens if adding an upload fails at the database step?
> The original stays in `/admin/uploads` until its photo record has been saved. Once the database is available, retry adding that upload; no reupload is needed. Retries reuse the same permanent file names and check for an existing photo record, including when a previous save succeeded but upload cleanup failed. Batch failures stop completion and retries skip photos already reported as added. Failed attempts may leave permanent copies in storage temporarily; they are reused on retry, not deleted automatically. This temporarily increases storage usage. This recovery behavior applies to new imports; older orphaned photo files require a separate recovery.

#### I'm seeing server-side runtime errors when loading a page after updating my fork. What do I do?
> Use the admin "Clear Cache" action or redeploy. If this doesn't help, contact the site maintainer.

#### Why can’t I upload HEIC files?
> This site relies on `sharp` to manipulate images and `next/image` to serve them, neither of which currently support HEIC (https://github.com/vercel/next.js/discussions/30043 + https://github.com/lovell/sharp/issues/3981). HEIC files uploaded from native share controls on Apple platforms are automatically converted to JPG.

#### Why are my thumbnails cropped?
> The masonry grid preserves each photo’s original aspect ratio. If a thumbnail appears cropped, check that the photo’s aspect ratio metadata is correct.

#### Why aren't Fujifilm simulations importing with camera metadata?
> Fujifilm simulation data is stored in vendor-specific MakerNote data embedded in image metadata. Some editing or sharing tools may strip this data. If a simulation is missing, try importing the original camera file or select the simulation manually when editing the photo.

#### How do I hide film-simulation categories?
> Set `NEXT_PUBLIC_CATEGORY_VISIBILITY` to the photo sets you want to show, such as `recents,albums`. Lens metadata remains available on photo detail pages and in admin editing.

#### Why do my images appear flipped/rotated incorrectly?
> Image orientations 1, 3, 6, and 8 are supported. Orientations 2, 4, 5, and 7—which use mirroring—are not supported.

#### Why does my image placeholder blur look different from photo to photo?
> Earlier versions of this template generated blur data on the client, which varied visually from browser to browser. Data is now generated consistently on the server. If you wish to update blur data for a particular photo, edit the photo in question, make no changes, and choose "Update."

#### Why are large, multi-photo uploads not finishing?
> The default timeout for processing multiple uploads is 60 seconds (the limit for Hobby accounts). This can be extended to 5 minutes on Pro accounts by setting `maxDuration = 300` in `src/app/admin/uploads/page.tsx`.

#### Why do uploads work locally but fail in production with a network error?
> Browser uploads go directly to the storage provider using a presigned PUT URL. For S3, the bucket's CORS rules must allow the exact origin in the browser's address bar, including the scheme and any port, and the `PUT` method and requested headers. Similar hostnames are separate origins. Check the failed request in browser DevTools and test its storage endpoint with an OPTIONS request containing `Origin`, `Access-Control-Request-Method: PUT`, and `Access-Control-Request-Headers: content-type`. A successful preflight should return `Access-Control-Allow-Origin` matching the site origin and allow `PUT` and `content-type`. CORS does not grant write permissions; keep uploads authenticated through presigned URLs rather than allowing public writes.

#### I've added my OpenAI key but can't seem to make it work. Why am I seeing connection errors?
> You may need to pre-purchase credits before accessing the OpenAI API. If you've customized key permissions, make sure write access to the Responses API is enabled.

#### How do I generate AI text for preexisting photos?
> Once AI text generation is configured, photos missing text will show up in photo updates (`/admin/photos/updates`).

#### Will there be support for image storage providers beyond Vercel, AWS, Cloudflare, and MinIO?
> At this time, there are no plans to introduce support for new storage providers. The template now supports Vercel Blob, AWS S3, Cloudflare R2, and MinIO (self-hosted S3-compatible storage). While configuring other AWS-compatible providers should not be too difficult, there's nuance to consider surrounding details like IAM, CORS, and domain configuration, which can differ slightly from platform to platform. If you'd like to contribute an implementation for a new storage provider, please open a PR.

#### Can I work locally without access to an image storage provider?
> At this time, an external storage provider is necessary in order to develop locally. If you have a strategy to propose which allows files to be locally uploaded and served to `next/image` in away that mirrors an external storage provider for debugging purposes, please open a PR.

#### Can this template be self-hosted?
> Possibly. Image hosting and Docker configuration depend on the selected storage provider.

#### Why am I seeing many merge conflicts when syncing my fork?
> This site uses the Next.js App Router. Keep application routes in `/app` and shared application code in `/src`.
