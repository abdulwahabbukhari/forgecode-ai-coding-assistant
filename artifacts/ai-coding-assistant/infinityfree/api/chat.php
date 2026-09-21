<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Only POST requests are allowed.']);
    exit;
}

$config = require __DIR__ . '/../config.php';
$input = json_decode(file_get_contents('php://input') ?: '', true);

if (!is_array($input) || !isset($input['messages']) || !is_array($input['messages']) || count($input['messages']) < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'Please provide at least one message.']);
    exit;
}

$messages = [];
foreach (array_slice($input['messages'], -30) as $message) {
    if (!is_array($message) || !in_array($message['role'] ?? '', ['user', 'assistant'], true) || !is_string($message['content'] ?? null)) {
        continue;
    }
    $content = trim($message['content']);
    if ($content !== '') {
        $messages[] = ['role' => $message['role'], 'content' => substr($content, 0, 20000)];
    }
}

if (!$messages) {
    http_response_code(400);
    echo json_encode(['error' => 'Please provide a non-empty message.']);
    exit;
}

$code = is_string($input['code'] ?? null) ? substr($input['code'], 0, 20000) : '';
$language = is_string($input['language'] ?? null) ? substr($input['language'], 0, 40) : '';
$context = $code !== ''
    ? "\n\nCode context (" . ($language !== '' ? $language : 'text') . "):\n```" . $language . "\n" . $code . "\n```"
    : '';

$system = 'You are ForgeCode, a senior AI coding assistant. Help users write, explain, debug, review, and improve software. Return complete working code when asked. Use Markdown headings and fenced code blocks with a language label. Prefer direct, practical explanations and state important assumptions. Never claim to have run code or accessed files you were not given.';
$lastIndex = count($messages) - 1;
if ($context !== '') {
    $messages[$lastIndex]['content'] .= $context;
}

$payload = [
    'model' => $config['model'],
    'temperature' => 0.2,
    'messages' => array_merge([['role' => 'system', 'content' => $system]], $messages),
];

$ch = curl_init($config['api_url']);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $config['api_key'],
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 90,
]);
$raw = curl_exec($ch);
$curlError = curl_error($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($raw === false || $curlError !== '') {
    http_response_code(502);
    echo json_encode(['error' => 'The AI service is temporarily unavailable. Please try again.']);
    exit;
}

$response = json_decode($raw, true);
if ($status < 200 || $status >= 300) {
    http_response_code(502);
    $providerMessage = is_array($response) ? ($response['error']['message'] ?? null) : null;
    echo json_encode(['error' => is_string($providerMessage) ? $providerMessage : 'The AI provider could not complete the request.']);
    exit;
}

$answer = $response['choices'][0]['message']['content'] ?? null;
if (!is_string($answer) || trim($answer) === '') {
    http_response_code(502);
    echo json_encode(['error' => 'The AI provider returned an empty response.']);
    exit;
}

echo json_encode([
    'message' => trim($answer),
    'model' => $config['model'],
    'demo' => false,
]);