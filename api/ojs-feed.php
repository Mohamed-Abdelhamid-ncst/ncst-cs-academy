<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
// Errors must not be cached; the success path overrides this below.
header('Cache-Control: no-store');

$feed = getenv('OJS_FEED_URL') ?: '';
if ($feed === '') {
    // Not an error: the page shows its "feed not connected yet" message for an empty list.
    echo json_encode(['configured'=>false,'items'=>[]]);
    exit;
}
if (!filter_var($feed, FILTER_VALIDATE_URL) || !preg_match('/^https:\/\//i', $feed)) {
    http_response_code(500);
    echo json_encode(['error'=>'Invalid feed URL','items'=>[]]);
    exit;
}
if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(['error'=>'PHP curl extension is not enabled','items'=>[]]);
    exit;
}

$ch = curl_init($feed);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_TIMEOUT => 7,
    CURLOPT_USERAGENT => 'NCST-CyberAcademy-Website/1.0',
    CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
]);
$xmlText = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);
if ($xmlText === false || $status < 200 || $status >= 300) {
    http_response_code(502);
    echo json_encode(['error'=>'Feed unavailable','items'=>[]]);
    exit;
}
libxml_use_internal_errors(true);
$xml = simplexml_load_string($xmlText, 'SimpleXMLElement', LIBXML_NONET | LIBXML_NOCDATA);
if (!$xml) {
    http_response_code(502);
    echo json_encode(['error'=>'Invalid feed','items'=>[]]);
    exit;
}
$items = [];
if (isset($xml->channel->item)) {
    foreach ($xml->channel->item as $item) {
        $items[] = [
            'title'=>(string)$item->title,
            'url'=>(string)$item->link,
            'date'=>(string)$item->pubDate,
            'description'=>trim(strip_tags((string)$item->description))
        ];
        if (count($items) >= 10) break;
    }
} elseif (isset($xml->entry)) {
    foreach ($xml->entry as $entry) {
        $url='';
        foreach($entry->link as $link){$a=$link->attributes(); if(isset($a['href'])){$url=(string)$a['href']; break;}}
        $items[] = [
            'title'=>(string)$entry->title,
            'url'=>$url,
            'date'=>(string)($entry->updated ?: $entry->published),
            'description'=>trim(strip_tags((string)($entry->summary ?: $entry->content)))
        ];
        if (count($items) >= 10) break;
    }
}
header('Cache-Control: public, max-age=300');
echo json_encode(['configured'=>true,'items'=>$items], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
?>