<?php
declare(strict_types=1);

// The Arabic forms post lang=ar so the visitor stays in the Arabic site after submitting.
$pages = (($_POST['lang'] ?? '') === 'ar') ? '../ar/' : '../';
function redirect_fail(): void { global $pages; header("Location: {$pages}form-error.html", true, 303); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') redirect_fail();

$host = $_SERVER['HTTP_HOST'] ?? '';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && strcasecmp((string)parse_url($origin, PHP_URL_HOST), (string)preg_replace('/:\d+$/', '', $host)) !== 0) redirect_fail();
if (!empty($_POST['website'] ?? '')) redirect_fail();

function clean(string $key, int $max=2000): string {
    $v = $_POST[$key] ?? '';
    if (!is_string($v) || !mb_check_encoding($v, 'UTF-8')) redirect_fail();
    if (mb_strlen($v, 'UTF-8') > $max) redirect_fail();
    $v = str_replace(["\r","\0"], '', trim($v));
    return mb_substr($v, 0, $max);
}
$type = clean('form_type', 30);
$allowed = ['contact','training','partner','event'];
if (!in_array($type,$allowed,true)) redirect_fail();

$name = str_replace("\n", ' ', clean('name', 120));
$emailRaw = clean('email', 180);
if (preg_match('/[\r\n\0]/', $_POST['email'] ?? '')) redirect_fail();
$email = filter_var($emailRaw, FILTER_VALIDATE_EMAIL);
$org = str_replace("\n", ' ', clean('organisation', 180));
$message = clean('message', 3000);
$audience = str_replace("\n", ' ', clean('audience', 300));
$interest = str_replace("\n", ' ', clean('interest', 200));
$event = str_replace("\n", ' ', clean('event', 200));
$course = str_replace("\n", ' ', clean('course', 200));

if ($name === '' || !$email) redirect_fail();
if ($type === 'contact' && $message === '') redirect_fail();
if ($type === 'training' && $org === '') redirect_fail();
if (preg_match('/[\r\n]/', $emailRaw)) redirect_fail();

// Rate-limit only valid submissions, so a rejected attempt does not lock the visitor out.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/ncst_academy_' . hash('sha256', $ip);
$now = time();
$rateHandle = @fopen($rateFile, 'c+');
if (!$rateHandle || !flock($rateHandle, LOCK_EX)) redirect_fail();
$lastSubmission = (int)stream_get_contents($rateHandle);
if ($now - $lastSubmission < 10) {
    fclose($rateHandle);
    redirect_fail();
}
rewind($rateHandle);
ftruncate($rateHandle, 0);
fwrite($rateHandle, (string)$now);
flock($rateHandle, LOCK_UN);
fclose($rateHandle);

$to = getenv('NCST_ACADEMY_EMAIL') ?: 'cyberacademy@ncst.edu.bh';
$subjects = [
 'training'=>'Cybersecurity Academy - Training Request',
 'partner'=>'Cybersecurity Academy - Partnership Enquiry',
 'event'=>'Cybersecurity Academy - Event Registration Enquiry',
 'contact'=>'Cybersecurity Academy - Website Enquiry'
];
$body = "Form: $type\nName: $name\nEmail: $email\nOrganisation: $org\n";
if ($audience !== '') $body .= "Target Audience: $audience\n";
if ($interest !== '') $body .= "Area of Interest: $interest\n";
if ($event !== '') $body .= "Event: $event\n";
if ($course !== '') $body .= "Requested Course: $course\n";
$body .= "\nMessage / Objective:\n$message\n";

// Keep a server-side record first, so an enquiry is never lost when mail delivery is unavailable.
// forms/data/ is blocked from web access by its own .htaccess (and by the nginx example config).
$dir = __DIR__ . '/data';
if (!is_dir($dir)) @mkdir($dir, 0750, true);
$record = [
    'received_at'=>gmdate('c'), 'form'=>$type, 'lang'=>($pages === '../ar/' ? 'ar' : 'en'), 'name'=>$name, 'email'=>$email, 'organisation'=>$org,
    'audience'=>$audience, 'interest'=>$interest, 'event'=>$event, 'course'=>$course, 'message'=>$message, 'ip'=>$ip
];
$stored = @file_put_contents(
    $dir . '/submissions.jsonl',
    json_encode($record, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) . "\n",
    FILE_APPEND|LOCK_EX
) !== false;

// Use an administrator-configured sender, never a visitor-controlled Host header.
$from = getenv('NCST_ACADEMY_FROM') ?: 'noreply@ncst.edu.bh';
if (!filter_var($from, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $from)) $from = 'noreply@ncst.edu.bh';
$headers = [
    'From: NCST Cybersecurity Academy <' . $from . '>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Content-Type-Options: nosniff'
];
$mailed = function_exists('mail') && filter_var($to, FILTER_VALIDATE_EMAIL) && !preg_match('/[\r\n]/', $to)
    && @mail($to, $subjects[$type], $body, implode("\r\n", $headers));
if (!$mailed) error_log('NCST Academy form: mail delivery failed for a "' . $type . '" submission' . ($stored ? ' (saved to forms/data/submissions.jsonl)' : ' and it could not be saved'));

if (!$stored && !$mailed) redirect_fail();
header("Location: {$pages}thank-you.html", true, 303);
exit;
?>
