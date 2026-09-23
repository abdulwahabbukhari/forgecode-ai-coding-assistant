# WAHAB AI Version 2

WAHAB AI Version 2 is a complete PHP, HTML, CSS and JavaScript AI coding
workspace created and owned by **Syed Abdul Wahab Bukhari**. It is designed to
run from a normal InfinityFree `htdocs` folder without Node.js, Composer or a
database.

## Upload to InfinityFree

1. Download or copy the complete `infinityfree` folder from this repository.
2. Upload the **contents** of that folder into your InfinityFree website's
   `htdocs` directory. The uploaded root must contain:

   ```text
   index.php
   config.php
   .htaccess
   api/chat.php
   assets/app.js
   assets/config.js
   assets/styles.css
   ```

3. Open `config.php` in a text editor and replace the placeholder value:

   ```php
   'api_key' => 'YOUR_API_KEY_HERE',
   ```

   with your real provider key. The exact variable is `api_key` in
   `infinityfree/config.php`.
4. If needed, change the provider endpoint and model in the same file:

   ```php
   'api_url' => 'https://api.openai.com/v1/chat/completions',
   'model' => 'gpt-4o-mini',
   ```

5. Open your domain. The PHP endpoint keeps the key on the server and the
   browser talks to `api/chat.php`.

### Important InfinityFree note

The direct PHP mode needs PHP cURL enabled by the host. If your InfinityFree
plan blocks outbound PHP cURL, publish the repository's API Server separately
and set this value in `assets/config.js`:

```js
window.WAHAB_AI_API_URL = 'https://your-api-server.example.com/api/chat';
```

In that mode, keep the API key in server-side environment secrets instead of
any browser file.

## What works

- Professional WAHAB AI chat for writing, explaining, debugging, fixing and
  improving code.
- Markdown code blocks with Copy code and Download buttons.
- Multiple text files and folders as project context.
- ZIP upload with in-browser file extraction and complete ZIP download.
- PDF text extraction and analysis through PDF.js.
- Image analysis through vision-capable OpenAI-compatible chat models.
- Image generation through the configured `image_api_url` and `image_model`.
- HTML/CSS/JavaScript live preview inside a sandboxed iframe.
- Mobile and desktop responsive layout.
- No fake/demo response: a missing key produces an actionable setup error.

## API key safety

Never commit a real key to this public repository. Before creating a ZIP to
share, restore the value to exactly:

```text
YOUR_API_KEY_HERE
```

The public frontend configuration file never contains an API key.

## React preview

The `src/` application is the development preview and uses the shared API
server. Run it from the repository root with:

```bash
pnpm install
pnpm --filter @workspace/ai-coding-assistant run dev
```

For production checks:

```bash
pnpm run typecheck
pnpm run build
```

## Owner

**WAHAB AI Version 2**
Developed and owned by **Syed Abdul Wahab Bukhari**