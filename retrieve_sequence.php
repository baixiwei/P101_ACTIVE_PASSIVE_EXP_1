<?php
// database connection
include('p101_database_connect.php');

// variables 
$subjid = $_POST['subjid']; // subject

$query = 'SELECT sequenceobj FROM sequences WHERE subjid='.mysql_real_escape_string($subjid);

$result = mysql_query($query);

if($result){
    $num_results = mysql_num_rows($result);
    if($num_results > 0){
    	while($row = mysql_fetch_array($result, MYSQL_ASSOC)){
    		// push row to array
    		$output = $row['sequenceobj'];
    	}
    } else {
        $output = "UNKNOWN";
    }
    echo $output;
}


?>