<?php
/**
 * WAHAB AI Version 2 server configuration.
 *
 * Replace only YOUR_API_KEY_HERE before uploading to InfinityFree.
 * Keep this file on the server and never publish a real key in a public repo.
 */

return [
    'api_key' => 'YOUR_API_KEY_HERE',
    'api_url' => 'https://api.openai.com/v1/chat/completions',
    'model' => 'gpt-4o-mini',

    // Image generation is optional. It uses the same key but needs an image-capable provider.
    'image_api_url' => 'https://api.openai.com/v1/images/generations',
    'image_model' => 'gpt-image-1',
];