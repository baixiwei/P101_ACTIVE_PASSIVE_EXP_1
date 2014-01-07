<?php
// database connection
include('p101_database_connect.php');

// variables 
$subjid = $_POST['subjid']; // subject

$query = 'SELECT sequenceobj FROM sequences WHERE subjid='.$subjid);

$result = mysql_query($query);

if($result){
	while($row = mysql_fetch_array($result, MYSQL_ASSOC)){
		// push row to array
		$output = $row['sequenceobj'];
	}
}

echo $output;
?>