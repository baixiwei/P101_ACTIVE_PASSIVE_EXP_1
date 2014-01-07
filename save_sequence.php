<?php
// database connection
include('p101_database_connect.php');

// variables 
$sequenceobj = $_POST['sequenceobj']; // sequence object data
$subjid = $_POST['subjid']; // subject

$query = 'INSERT INTO sequences (subjid, sequenceobj) VALUES ('.$subjid.','.$sequenceobj.')';

echo $query;

$result = mysql_query($query);

echo $result;
?>