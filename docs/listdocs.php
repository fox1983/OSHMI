<html>
<head>
<meta charset="ISO-8859-1">
<meta name="application-name" content="OSHMI-Open Substation HMI">
<meta name="description" content="About OSHMI">
<meta name="author" content="Ricardo L. Olsen">
<title>OSHMI Docs</title>
</head>
<body style="font-family:Helvetica;font-size:18pt;">
    
<ol>
<?PHP
foreach (glob("*.[pP][dD][fF]") as $filename) {
    $bname = str_replace(".pdf","",strtolower(basename($filename)));
    // do something with $filename
    echo "<li style='list-style-type: circle;'><a href='$filename' style='text-decoration: none;color:blue'>$bname</a></li>";
}
?>

</ol>
</body>

