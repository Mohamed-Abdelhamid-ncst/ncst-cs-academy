<?php
declare(strict_types=1);
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
echo str_replace('<base href="/">', '<base href="' . htmlspecialchars($base, ENT_QUOTES, 'UTF-8') . '">', file_get_contents(__DIR__ . '/404.html'));
