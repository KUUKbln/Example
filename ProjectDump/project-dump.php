<?php
$rootDir = __DIR__;
$selfFile = basename(__FILE__);
$webTextExtensions = ['php','html','htm','css','js','json','txt','md','htaccess'];

$rawMode = isset($_GET['raw']) && $_GET['raw'] == 1;

$projectName = basename($rootDir);
$today = date('Y-m-d H:i:s');

function scanDirRecursive($dir) {
    global $webTextExtensions, $selfFile;

    $entries = scandir($dir);
    $tree = [];

    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        if ($entry === basename(__FILE__)) continue;

        $fullPath = $dir . DIRECTORY_SEPARATOR . $entry;

        if (is_dir($fullPath)) {
            $subtree = scanDirRecursive($fullPath);
            $tree[$entry] = ['type'=>'dir','children'=>$subtree];
            if (empty($subtree)) $tree[$entry]['empty'] = true;
        } else {
            $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
            if (in_array($ext, $webTextExtensions) || $entry === '.htaccess') {
                $tree[$entry] = ['type'=>'text','path'=>$fullPath];
            } else {
                $tree[$entry] = ['type'=>'binary','path'=>$fullPath];
            }
        }
    }
    ksort($tree);
    return $tree;
}

function renderTreeAscii($tree, $prefix='', $parent='') {
    $lines = [];
    $entries = array_keys($tree);
    $count = count($entries);
    $i = 0;

    foreach ($tree as $name => $info) {
        $i++;
        $connector = ($i === $count) ? '└── ' : '├── ';
        $linePrefix = $prefix . $connector;
        $relPath = ($parent === '') ? $name : $parent.'/'.$name;
        if ($info['type'] === 'dir') {
            $lines[] = $linePrefix . '<a href="#'.preg_replace('/[^a-z0-9_-]/i','_',$relPath).'">'.$name.'/</a>';
            $newPrefix = $prefix . (($i === $count) ? '    ' : '│   ');
            if (!empty($info['children'])) {
                $lines = array_merge($lines, renderTreeAscii($info['children'], $newPrefix, $relPath));
            } elseif (!empty($info['empty'])) {
                $lines[] = $newPrefix . '<a href="#'.preg_replace('/[^a-z0-9_-]/i','_',$relPath).'">(empty)</a>';
            }
        } else {
            $lines[] = $linePrefix . '<a href="#'.preg_replace('/[^a-z0-9_-]/i','_',$relPath).'">'.$name.'</a>';
        }
    }
    return $lines;
}

function renderContentBlocks($tree, &$blocks, $parent='') {
    foreach ($tree as $name => $info) {
        $relPath = ($parent === '') ? $name : $parent.'/'.$name;
        $id = preg_replace('/[^a-z0-9_-]/i','_',$relPath);
        if ($info['type'] === 'dir') {
            if (!empty($info['children'])) {
                renderContentBlocks($info['children'], $blocks, $relPath);
            } else {
                $blocks[$relPath] = ['id'=>$id,'content'=>'(empty folder)'];
            }
        } else {
            if ($info['type'] === 'text') {
                $content = file_get_contents($info['path']);
            } else {
                $content = "(binary file)";
            }
            $blocks[$relPath] = ['id'=>$id,'content'=>$content];
        }
    }
}

$tree = scanDirRecursive($rootDir);
$asciiTree = implode("\n", renderTreeAscii($tree));

$blocks = [];
renderContentBlocks($tree, $blocks);

if ($rawMode) {
    header('Content-Type: text/plain; charset=utf-8');
    foreach ($blocks as $path => $data) {
        echo "=== $path ===\n";
        echo $data['content'] . "\n\n";
    }
    exit;
}

$htmlBlocks = '';
foreach ($blocks as $path => $data) {
    $htmlBlocks .= "<h3 id='{$data['id']}'>=== <a href='".htmlspecialchars($path)."'>".$path."</a> ===</h3>\n";
    $htmlBlocks .= "<pre>". htmlspecialchars($data['content']) ."</pre>\n";
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Projekt: <?php echo htmlspecialchars($projectName); ?></title>
<style>
body { font-family: monospace; font-size: 14px; margin: 1em; }
pre { white-space: pre-wrap; word-wrap: break-word; background: #f4f4f4; padding: 0.5em; border: 1px solid #ccc; }
h1,h3 { font-family: monospace; font-size: 14px; margin: 0.5em 0 0.2em; }
button { margin-right: 0.5em; margin-bottom: 1em; }
a { text-decoration: none; color: #0066cc; }
a:hover { text-decoration: underline; }
</style>
</head>
<body>

<h1>Projekt: <?php echo htmlspecialchars($projectName); ?> – <?php echo $today; ?></h1>

<button onclick="copyText()">📋 Kopieren</button>
<button onclick="downloadTxt()">💾 Als .txt speichern</button>

<pre><?php echo $asciiTree; ?></pre>

<?php echo $htmlBlocks; ?>

<script>
function copyText() {
    let text = '';
    document.querySelectorAll('h3, pre').forEach(el => {
        if(el.tagName==='H3') text += el.textContent + "\n";
        else text += el.textContent + "\n\n";
    });
    navigator.clipboard.writeText(text).then(()=>alert('Text in Zwischenablage kopiert'));
}

function downloadTxt() {
    let text = '';
    document.querySelectorAll('h3, pre').forEach(el => {
        if(el.tagName==='H3') text += el.textContent + "\n";
        else text += el.textContent + "\n\n";
    });
    const blob = new Blob([text], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Projekt-<?php echo htmlspecialchars($projectName); ?>.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
</script>

</body>
</html>
