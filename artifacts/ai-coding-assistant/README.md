# ForgeCode — AI Coding Assistant

ForgeCode is a complete PHP, HTML, CSS, and JavaScript AI coding assistant prepared for shared hosting such as InfinityFree.

## InfinityFree setup

1. Open `infinityfree/config.php` in a text editor.
2. Replace:

   ```php
   'api_key' => 'YOUR_API_KEY_HERE',
   ```

   with your real OpenAI API key. Keep the quotes around the key.
3. If you use a compatible provider, change `api_url` and `model` in the same file.
4. Upload the **contents** of the `infinityfree` folder into your InfinityFree `htdocs` folder. The uploaded root should contain `index.php`, an `api` folder, an `assets` folder, `config.php`, and `.htaccess`.
5. Visit your domain. The chat sends requests to `api/chat.php`, which keeps the API key on the server.

The server needs PHP with cURL enabled. No database, Composer install, Node.js, or build step is required.

## Local preview

The Replit preview is the React version in `src/`. It uses the shared `/api/chat` endpoint. Without an environment key it returns a clearly labeled preview response, so the interface can be explored without configuration.

## Security notes

- Never put the API key in `assets/app.js` or any browser-side file.
- Do not publish a real key in a public repository.
- If you accidentally expose a key, revoke it at the provider immediately and create a new one.
- The included `.htaccess` disables directory listing and blocks direct access to common configuration files.