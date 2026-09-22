# ForgeCode — AI Coding Assistant

ForgeCode is a complete PHP, HTML, CSS, and JavaScript AI coding assistant prepared for shared hosting such as InfinityFree.

## InfinityFree setup

There are two hosting modes:

- **Free InfinityFree:** host the frontend on InfinityFree and use the Replit API
  server for AI requests. This is the recommended setup because InfinityFree
  free hosting blocks PHP cURL.
- **cURL-enabled hosting:** upload the complete `infinityfree` folder and use
  its PHP endpoint directly.

### Recommended free InfinityFree + Replit API setup

1. Publish the **API Server** artifact on Replit. Its public URL must be
   reachable from the internet.
2. Add the secret `OPENAI_API_KEY` to the Replit API Server environment. Add it
   through Replit Secrets; never paste it into this repository or into a
   browser file.
   The API accepts OpenAI-compatible providers. For a Groq key, use:

   ```text
   OPENAI_API_URL=https://api.groq.com/openai/v1/chat/completions
   OPENAI_MODEL=openai/gpt-oss-20b
   ```

   The `OPENAI_API_KEY` variable name is kept for compatibility with both
   OpenAI and OpenAI-compatible providers.
3. If you want to restrict browser access, set the Replit environment variable
   `CORS_ORIGIN` to your InfinityFree domain, for example:
   `https://your-site.epizy.com`. Leave it unset while testing if you do not
   know the final domain yet.
4. Open `infinityfree/assets/config.js` and replace:

   ```js
   window.FORGE_CODE_API_URL = 'PASTE_REPLIT_API_URL_HERE/api/chat';
   ```

   with your published API URL, for example:

   ```js
   window.FORGE_CODE_API_URL = 'https://your-api-server.replit.app/api/chat';
   ```

5. Upload the **contents** of the `infinityfree` folder into the correct
   InfinityFree `htdocs` folder. The uploaded root should contain `index.php`,
   `api`, `assets`, `config.php`, and `.htaccess`.
6. Visit your InfinityFree domain. The browser will call the Replit API
   directly; the OpenAI key stays on Replit.

For this recommended mode, do **not** put an OpenAI key in `assets/config.js`
or `assets/app.js`. The `api/chat.php` file remains as a fallback for a
cURL-enabled PHP host, but it is not used when `assets/config.js` contains the
published Replit API URL.

### cURL-enabled hosting setup

1. Open `infinityfree/config.php` in a text editor.
2. Replace:

   ```php
   'api_key' => 'YOUR_API_KEY_HERE',
   ```

   with your real OpenAI API key. Keep the quotes around the key.
3. If you use a compatible provider, change `api_url` and `model` in the same file.
4. Leave `assets/config.js` pointing to the placeholder so the browser falls
   back to `api/chat.php`.
5. Upload the **contents** of the `infinityfree` folder into your hosting
   `htdocs` folder. The uploaded root should contain `index.php`, an `api`
   folder, an `assets` folder, `config.php`, and `.htaccess`.
6. Visit your domain. The chat sends requests to `api/chat.php`, which keeps
   the API key on the server.

The server needs PHP with cURL enabled. No database, Composer install, Node.js, or build step is required.

## Local preview

The Replit preview is the React version in `src/`. It uses the shared `/api/chat` endpoint. Without an environment key it returns a clearly labeled preview response, so the interface can be explored without configuration.

## Security notes

- Never put the API key in `assets/config.js`, `assets/app.js`, or any other browser-side file.
- Do not publish a real key in a public repository.
- If you accidentally expose a key, revoke it at the provider immediately and create a new one.
- The included `.htaccess` disables directory listing and blocks direct access to common configuration files.