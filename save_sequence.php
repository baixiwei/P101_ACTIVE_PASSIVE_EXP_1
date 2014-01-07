<?php
// database connection
include('p101_database_connect.php');

// variables 
$sequenceobj = $_POST['sequenceobj']; // sequence object data
$subjid = $_POST['subjid']; // subject

$query = 'INSERT INTO sequences (subjid, sequenceobj) VALUES ('.mysql_real_escape_string($subjid).',\''.mysql_real_escape_string($sequenceobj).'\')';

$result = mysql_query($query);

?>