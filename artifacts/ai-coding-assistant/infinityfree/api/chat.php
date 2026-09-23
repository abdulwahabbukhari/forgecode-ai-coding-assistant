<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function cleanText(mixed $value, int $limit): string
{
    return is_string($value) ? trim(substr($value, 0, $limit)) : '';
}

function identityAnswer(string $message): ?string
{
    $normalized = strtolower(trim((string) preg_replace(
        '/\s+/',
        ' ',
        (string) preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $message),
    )));

    if ($normalized === 'tumhara naam kya hai') {
        return 'Mera naam WAHAB AI hai.';
    }
    if (in_array($normalized, [
        'tumhein kis ne banaya hai',
        'tumhen kis ne banaya hai',
        'tumhe kis ne banaya hai',
    ], true)) {
        return 'Mujhe Syed Abdul Wahab Bukhari ne banaya hai.';
    }
    return null;
}

function isPlaceholderKey(string $key): bool
{
    return $key === '' || $key === 'YOUR_API_KEY_HERE' || strlen($key) < 12;
}

function providerError(array $payload, string $fallback): string
{
    $message = $payload['error']['message'] ?? null;
    return is_string($message) && $message !== '' ? $message : $fallback;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(['error' => 'Only POST requests are allowed.'], 405);
}

$config = require __DIR__ . '/../config.php';
$input = json_decode(file_get_contents('php://input') ?: '', true);

if (!is_array($input)) {
    respond(['error' => 'Send a valid JSON request body.'], 400);
}

$mode = cleanText($input['mode'] ?? 'chat', 20);

if ($mode === 'image') {
    $apiKey = cleanText($config['api_key'] ?? '', 300);
    if (isPlaceholderKey($apiKey)) {
        respond([
            'error' => 'WAHAB AI is not configured yet. Replace YOUR_API_KEY_HERE in config.php with your provider API key.',
        ], 503);
    }
    $prompt = cleanText($input['prompt'] ?? '', 4000);
    if ($prompt === '') {
        respond(['error' => 'Add an image description before generating.'], 400);
    }

    $payload = [
        'model' => cleanText($config['image_model'] ?? 'gpt-image-1', 100),
        'prompt' => $prompt,
        'size' => in_array($input['size'] ?? '', ['1024x1024', '1536x1024', '1024x1536'], true)
            ? $input['size']
            : '1024x1024',
    ];

    $ch = curl_init(cleanText($config['image_api_url'] ?? '', 500));
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 120,
    ]);
    $raw = curl_exec($ch);
    $curlError = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $curlError !== '') {
        respond(['error' => 'The image provider is temporarily unavailable. Check cURL and try again.'], 502);
    }
    $response = json_decode($raw, true);
    if (!is_array($response) || $status < 200 || $status >= 300) {
        respond(['error' => is_array($response) ? providerError($response, 'The image provider rejected the request.') : 'The image provider returned an invalid response.'], 502);
    }
    $imageUrl = $response['data'][0]['url'] ?? null;
    $base64 = $response['data'][0]['b64_json'] ?? null;
    if (is_string($base64) && $base64 !== '') {
        $imageUrl = 'data:image/png;base64,' . $base64;
    }
    if (!is_string($imageUrl) || $imageUrl === '') {
        respond(['error' => 'The image provider returned no downloadable image.'], 502);
    }
    respond(['image_url' => $imageUrl, 'model' => $payload['model']]);
}

$rawMessages = $input['messages'] ?? null;
if (!is_array($rawMessages) || count($rawMessages) < 1) {
    respond(['error' => 'Please provide at least one message.'], 400);
}

$messages = [];
foreach (array_slice($rawMessages, -30) as $message) {
    if (!is_array($message) || !in_array($message['role'] ?? '', ['user', 'assistant'], true)) {
        continue;
    }
    $content = cleanText($message['content'] ?? '', 20000);
    if ($content !== '') {
        $messages[] = ['role' => $message['role'], 'content' => $content];
    }
}
if (!$messages) {
    respond(['error' => 'Please provide a non-empty message.'], 400);
}

$identity = identityAnswer($messages[count($messages) - 1]['content']);
if ($identity !== null && $messages[count($messages) - 1]['role'] === 'user') {
    respond([
        'message' => $identity,
        'model' => 'identity',
        'demo' => false,
    ]);
}

$apiKey = cleanText($config['api_key'] ?? '', 300);
if (isPlaceholderKey($apiKey)) {
    respond([
        'error' => 'WAHAB AI is not configured yet. Replace YOUR_API_KEY_HERE in config.php with your provider API key.',
    ], 503);
}

$language = cleanText($input['language'] ?? '', 40);
$code = cleanText($input['code'] ?? '', 20000);
$pdfText = cleanText($input['pdfText'] ?? '', 60000);
$contextParts = [];
if ($code !== '') {
    $contextParts[] = "Selected code context (" . ($language !== '' ? $language : 'text') . "):\n```" . ($language !== '' ? $language : '') . "\n" . $code . "\n```";
}
if ($pdfText !== '') {
    $contextParts[] = "Extracted PDF text:\n" . $pdfText;
}

$projectFiles = $input['projectFiles'] ?? [];
if (is_array($projectFiles)) {
    $fileParts = [];
    $total = 0;
    foreach (array_slice($projectFiles, 0, 80) as $file) {
        if (!is_array($file)) {
            continue;
        }
        $path = cleanText($file['path'] ?? '', 240);
        $content = cleanText($file['content'] ?? '', 18000);
        if ($path === '' || $content === '') {
            continue;
        }
        $total += strlen($content);
        if ($total > 100000) {
            break;
        }
        $fileParts[] = "FILE: {$path}\n```\n{$content}\n```";
    }
    if ($fileParts) {
        $contextParts[] = "Project files supplied by the user:\n" . implode("\n\n", $fileParts);
    }
}

$system = implode(' ', [
    'You are WAHAB AI Version 2, a senior software engineer and practical coding expert.',
    'Your owner and developer is Syed Abdul Wahab Bukhari.',
    'If the user asks "Tumhara naam kya hai?", reply exactly: "Mera naam WAHAB AI hai."',
    'If the user asks "Tumhein kis ne banaya hai?", reply exactly: "Mujhe Syed Abdul Wahab Bukhari ne banaya hai."',
    'Answer these identity questions clearly in Roman Urdu.',
    'Help users write, explain, debug, fix, review, secure and improve software.',
    'When asked to implement something, return complete working code with file paths and clear setup steps.',
    'Use Markdown headings and fenced code blocks with a language label.',
    'Respect supplied project context and do not invent files, test results, deployments or access you do not have.',
    'For web work, prefer accessible, responsive and maintainable HTML, CSS and JavaScript.',
    'Be direct and identify important assumptions, risks and exact changes.',
]);

$attachments = [];
if (is_array($input['attachments'] ?? null)) {
    foreach (array_slice($input['attachments'], 0, 3) as $attachment) {
        if (!is_array($attachment)) {
            continue;
        }
        $data = cleanText($attachment['data'] ?? '', 8_000_000);
        $type = cleanText($attachment['type'] ?? 'image/png', 100);
        if (str_starts_with($type, 'image/') && str_starts_with($data, 'data:image/')) {
            $attachments[] = ['type' => 'image_url', 'image_url' => ['url' => $data]];
        }
    }
}

if ($contextParts) {
    $last = count($messages) - 1;
    $context = "\n\n" . implode("\n\n", $contextParts);
    if ($attachments) {
        $messages[$last]['content'] = array_merge(
            [['type' => 'text', 'text' => $messages[$last]['content'] . $context]],
            $attachments,
        );
    } else {
        $messages[$last]['content'] .= $context;
    }
}

$payload = [
    'model' => cleanText($config['model'] ?? 'gpt-4o-mini', 100),
    'temperature' => 0.2,
    'messages' => array_merge([['role' => 'system', 'content' => $system]], $messages),
];

$ch = curl_init(cleanText($config['api_url'] ?? '', 500));
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 120,
]);
$raw = curl_exec($ch);
$curlError = curl_error($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($raw === false || $curlError !== '') {
    respond(['error' => 'The AI service is temporarily unavailable. Check cURL and your provider settings.'], 502);
}
$response = json_decode($raw, true);
if (!is_array($response) || $status < 200 || $status >= 300) {
    respond(['error' => is_array($response) ? providerError($response, 'The AI provider could not complete the request.') : 'The AI provider returned an invalid response.'], 502);
}

$answer = $response['choices'][0]['message']['content'] ?? null;
if (is_array($answer)) {
    $answer = implode("\n", array_map(
        static fn (mixed $part): string => is_array($part) ? (string) ($part['text'] ?? '') : '',
        $answer,
    ));
}
if (!is_string($answer) || trim($answer) === '') {
    respond(['error' => 'The AI provider returned an empty response.'], 502);
}

respond([
    'message' => trim($answer),
    'model' => $payload['model'],
    'demo' => false,
]);