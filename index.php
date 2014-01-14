<!doctype html>
<?php

include('p101_database_connect.php');

session_start();

$sid = SID; //Session ID #
$authenticated = $_SESSION['CAS'];
$target_url = 'https://perceptsconcepts.psych.indiana.edu/experiments/mmm-tutorial-spring14/index.php';

//send user to CAS login if not authenticated
if (!$authenticated) {
  $_SESSION['CAS'] = true;
  header('Location: https://cas.iu.edu/cas/login?cassvc=IU&casurl='.$target_url);
  exit;
}

if ($authenticated) {
  //validate since authenticated
  if (isset($_GET["casticket"])) {
	//set up validation URL to ask CAS if ticket is good
	$_url = 'https://cas.iu.edu/cas/validate';
	$cassvc = 'IU';  //search kb.indiana.edu for "cas application code" to determine code to use here in place of "appCode"
	$casurl = $target_url; //same base URLsent
	$params = "cassvc=$cassvc&casticket=$_GET[casticket]&casurl=$casurl";
	$urlNew = "$_url?$params";

	//CAS sending response on 2 lines.  First line contains "yes" or "no".  If "yes", second line contains username (otherwise, it is empty).
	$ch = curl_init();
	$timeout = 5; // set to zero for no timeout
	curl_setopt ($ch, CURLOPT_URL, $urlNew);
	curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
	ob_start();
	curl_exec($ch);
	curl_close($ch);
	$cas_answer = ob_get_contents();
	ob_end_clean();
	
	//split CAS answer into access and user
	list($access,$user) = split("\n",$cas_answer,2);
	$access = trim($access);
	$user = trim($user);
		
	//set user and session variable if CAS says YES
	if ($access == "yes") {
        $_SESSION['user'] = $user;
		
		// $user is the IU username
	}
  }
  else
  {
     $_SESSION['CAS'] = true;
     header('Location: https://cas.iu.edu/cas/login?cassvc=IU&casurl='.$target_url);
     exit;
  }
}

// username should be inside the session variable at this point
if(isset($_SESSION['user'])){

	$studentid = checkSID($_SESSION['user']);
	
	if($studentid == -1)
	{
		// echo 'Adding to DB';
		// if no id, add them to database.
		
		// get condition assignment
		$condition = assignCondition();

		$insert = mysql_query('INSERT INTO allusers (username, cond) VALUES (\''.$_SESSION['user'].'\','.$condition.')');
		if($insert) {
			$studentid = checkSID($_SESSION['user']);
			
			// add to progress table
			$insert = mysql_query('INSERT INTO subjectprogress (sid) VALUES ('.$studentid.')');
		} else {
			echo mysql_error();
		}
	} elseif($studentid == -2) {
		// there was a problem with the mysql database
		//echo 'db problem';
	} else {
		// already had subject in database.
		//echo 'Student ID: '.$studentid;	
		$condition = getCondition($_SESSION['user']);
	}
	
	$_SESSION['studentid'] = $studentid;
	$_SESSION['condition'] = $condition;
}

function checkSID($username) {
	$result = mysql_query('SELECT sid FROM allusers WHERE username=\''.mysql_real_escape_string($username).'\'');
	$studentid = -2;
	
	if($result) {
		$arr = mysql_fetch_array($result);
		if($arr){
			// if there is an id, store it as $studentid
			$studentid = $arr['sid'];
		} else {
			$studentid = -1;
		}
	} 
	
	return $studentid;
}
	
function getCondition($username) {
	$result = mysql_query('SELECT cond FROM allusers WHERE username=\''.mysql_real_escape_string($username).'\'');
	$c = 'NULL';
	if($result) {
		$arr = mysql_fetch_array($result);
		if($arr) { $c = $arr['cond']; }
	}
	return $c;
}

function assignCondition() {
    $result = mysql_query('SELECT sid, cond FROM allusers ORDER BY sid DESC LIMIT 1');
    $cond = 1;
    if($result){
        if(mysql_num_rows($result) > 0) {
            $arr = mysql_fetch_array($result);
            if($arr) { 
                $cond = $arr['cond']+1;
                if($cond>21) { $cond = 1; }
            }
        }
    }
    return $cond;
}
	
?>
<html>
<head>
<title>Mean, Median, and Mode Tutorial</title>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" type="text/javascript"></script>
<script src="startExperiment.js" type="text/javascript"></script>
<link rel="stylesheet" type="text/css" href="styles.css" />
<link rel="icon" type="image/x-icon" href="favicon.ico" />
</head>
<body>
<div id="wrapper">
	<div id="welcome">
		
	</div>
</div>
</body>
<script type="text/javascript">


var sid = <?php echo $_SESSION['studentid']; ?>;
var username = "<?php echo $_SESSION['user']; ?>";
var condition = <?php echo $_SESSION['condition']; ?>;
var prepend_data = { "subjid": sid, "cond": condition }


// check if they already have seen consent form

$.ajax({
	type: 'post',
	cache: false,
	url: 'check_consent.php',
	data: {"subjid": sid},
	success: function(data) { 
		if(data==1)
		{
			// they have seen consent form
			set_parameters();
		} else {
			// show consent form
			show_consent_form();
		}
	}
});

function show_consent_form() {
	$("#welcome").html(
		'<h1>Welcome to the tutorial on mean, median, and mode.</h1>\
		<p>You are logged in as: '+username+'</p>\
		<p>Before starting, you need to decide whether or not you give your consent to have your data analyzed for research purposes.\
		You will need to complete the tutorial in order to receive credit for the homework assignment, but you may choose whether \
		or not your responses are analyzed for research purposes.</p> \
		<button id="startbtn" type="button">View Consent Form</button>'
	);

	// consent
	$("#startbtn").click(function(){

		$("#welcome").hide();
		
		// TODO: see if they have already seen the consent form, and skip if they have.
		$("#wrapper").load("consent_form.html" + "?time=" + (new Date().getTime()), function(){
			// what to do after loading
			$("#wrapper").append('<button type="button" id="consentBtn">Start Tutorial</button>');
			$("#consentBtn").click(function(){
				// check to see if they gave consent
				var consent = $("#consent_checkbox").is(':checked');
				var data = [[{"sid": sid, "consent_given": consent}]];
				
				// write their choice to the database
				$.ajax({
					type: 'post',
					cache: false,
					url: 'submit_data_mysql.php',
					data: {"table": "consent", "json": JSON.stringify(data)},
					success: function(data) { set_parameters(); }
				});
				
				// update subject progress in database
				$.ajax({
					type: 'post',
					cache: false,
					url: 'update_progress.php',
					data: {"sid": sid , "flag": "consent"}
				});
			});
		});
		
	});
}


// determine training parameter values based on experimental condition and add them to prepend_data
// first parameter indicates when we switch from passive to intermediate; second indicates when we switch from intermediate to active
var parameters;
function set_parameters() {
    var parameter_space = [];
    for ( var i=0; i<6; i++ ) {
        for ( var j=i; j<6; j++ ) {
            parameter_space.push( [i,j] );
        }
    }
    parameters = parameter_space[ condition ];
    prepend_data.param_pass_to_inter    = parameters[0];
    prepend_data.param_inter_to_act     = parameters[1];
    //generate_content();
    recover_sequence();
}

var training_sequence;
function recover_sequence(){
    // try to recover from database
    $.ajax({
		type: 'post',
		cache: false,
		url: 'retrieve_sequence.php',
		data: {"subjid": sid},
		success: function(output){
		    var new_user = (output == "UNKNOWN");
		    if(!new_user){
		        training_sequence = JSON.parse(output);
		    }
		    generate_content(new_user);
		}
	});
}


// generate content for pretest, tutorial, and posttest
var pretest_questions, posttest_questions, training_questions;
function generate_content(new_user) {
    pretest_questions = [
        { "number": 1,
          "text": "1.  Five pizzas were given quality scores by an expert taster.  Their scores were: Pizza World = 8, Slices! = 3, Pisa Pizza = 2, Pizza a go-go = 4, Crusty's = 8. What are the mode, median and mean for this data set?",
          "answers": [ "A) mode = 8, median = 5, mean = 4", "B) mode = 5, median = 8, mean = 4", "C) mode = 8, median = 4, mean = 5", "D) mode = 5, median = 4, mean = 8" ],
          "correct_response": 2 },
        { "number": 2,
          "text": "2.  Imagine an easy vocabulary test on which 17 students do very well, each getting a score of 98, 99, or 100 out of 100 possible points.  However, the remaining 3 students get very poor scores: 2, 3, and 5.  Will the mode be less than or more than the mean?",
          "answers": [ "A) the mode will be less than the mean", "B) the mode will be more than the mean", "C) the mode and mean will be the same", "D) more information is needed about the particular scores" ],
          "correct_response": 1 },
        { "number": 3,
          "text": "3.  There are 7 players on a particular basketball team.  On a particular game, the median number of points scored by each player was 12 and no two players scored the same number of points.  If the lowest and highest scoring players are not considered, what will be the median of the remaining 5 players\' scores?",
          "answers": [ "A) more information is needed about the particular scores", "B) 7", "C) 10", "D) 12" ],
          "correct_response": 3 },
        { "number": 4,
          "text": "4.  Three children in a family have shoe sizes of 5, 10, and 9.  What are mean and median for the shoes sizes of the children in this family?",
          "answers": [ "A) mean = 9, median = 10", "B) mean = 9, median = 9", "C) mean = 8, median = 10", "D) mean = 8, median = 9" ],
          "correct_response": 3 }
        ];
    posttest_questions = [
        { "number": 1,
          "text": "1.  Five students on a dormitory floor were asked how many hours of TV they watched per week.  Their responses were: Ed: 5, Fred: 2, Ned: 1, Zed: 6, and Jed: 6.  What are the mode, median and mean values for this data set?",
          "answers": [ "A) mode = 4, median = 5, mean = 6", "B) mode = 6, median = 5, mean = 4", "C) mode = 5, median = 4, mean = 6", "D) mode = 5, median = 6, mean = 4" ],
          "correct_response": 1 },
        { "number": 2,
          "text": "2.  15 patients were given a 3-week diet.  13 of the patients lost only 1 or 2 pounds, but the other two patients lost a lot of weight: 27 and 32 pounds.  Will the mode number of pounds lost be less than or more than the mean?",
          "answers": [ "A) the mode and mean will be the same", "B) the mode will be more than the mean", "C) the mode will be less than the mean", "D) more information is needed about the particular weights lost" ],
          "correct_response": 2 },
        { "number": 3,
          "text": "3.  11 pianists were rated in a competition and each got a rating on a 10-point scale between 3 and 8.  The median rating was 5.  Two new pianists were rated and received scores of 1 and 9.  Including these new pianists, what will be the median for all 13 pianists?",
          "answers": [ "A) 5", "B) 13", "C) 11", "D) more information is needed about the particular scores" ],
          "correct_response": 0 },
        { "number": 4,
          "text": "4.  Each of three children in a family has pets.  The oldest, middle, and youngest child have 5, 6, and 1 pets, respectively.  What are mean and median number of pets for these children?",
          "answers": [ "A) mean = 4, median = 6", "B) mean = 6, median = 4", "C) mean = 5, median = 4", "D) mean = 4, median = 5" ],
          "correct_response": 3 }
        ];
    training_questions = [
        {prbID: 1, text: "The scores of several students on a 50-point pop quiz are shown below.", ques: "students' test scores", min: 10, max: 50},
        {prbID: 2, text: "The data below shows the numbers of stories of several buildings in a neighborhood.", ques: "numbers of stories", min: 1, max:50},
        {prbID: 3, text: "In a marketing research study, several consumers each rated how much they liked a product on a scale of 1 to 100. Their ratings are shown below.", ques: "consumers' ratings", min: 1, max: 100},
        {prbID: 4, text: "Several fishermen went fishing on the same day. Below you can find how many fish the different fishermen caught.", ques: "numbers of fish caught", min: 0, max: 30},
        {prbID: 5, text: "The ages of a group of friends are shown below.", ques: "ages in this group", min: 19, max: 35},
        {prbID: 6, text: "The grades of a group of students in a Psych course are shown below.", ques: "grades in the Psych course", min:50, max:90},
        {prbID: 7, text: "Below are the number of books a student read each month in the past few months.", ques: "numbers of books read", min:0, max:20},
        {prbID: 8, text: "The weight, in pounds, of people in a restaurant is shown below.", ques: "weights in this group of people", min:80, max: 170},
        {prbID: 9, text: "The price, in dollars, of the items in Mary's shopping cart is shown below.", ques: "prices of the products in this purchase", min:2, max:30},
        {prbID: 10, text: "The time each student spent doing an online exercise for a Neuroanatomy course is shown below, in minutes.", ques: "times spent doing the exercise", min:15, max:50},
        {prbID: 11, text: "The list below shows the monthly earnings of the employees of a video store, in dollars.", ques: "employees' earnings", min:1000, max:2000},
        {prbID: 12, text: "The number of students served in a college cafeteria in the past few months is shown below.", ques:"numbers of students served", min: 90, max:200},
        {prbID: 13, text: "The number of students attending a workshop on \"Research Ethics\" each time it was offered is shown below.", ques:"numbers of attendees", min:10, max:30},
        {prbID: 14, text: "Zach's scores in the quizzes of a science course are shown below.", ques:"scores", min: 10, max:80},
        {prbID: 15, text: "The scores below show the total fat content in some products.", ques:"fat contents", min:4, max:40},
        {prbID: 16, text: "A middle school teacher takes students' attendance at 9 am every day. The number of students in the classroom at that time in the last few classes is shown below.", ques: "numbers of students present at 9am", min:15, max:30},
        {prbID: 17, text: "The data below shows the total caloric content of several dishes.", ques: "caloric contents", min:80, max:400},
        {prbID: 18, text: "The total points scored by several high school basketball players are shown below.", ques:"numbers of points scored", min:40, max:60},
        {prbID: 19, text: "Below is the number of hours each student in a small college course spends watching TV each week.", ques:"numbers of hours spent watching TV for students in this class", min:1, max:20},
        {prbID: 20, text: "Anna practices swimming everyday. Below are the durations of her last practice sessions, in minutes.", ques:"durations", min:30, max:90},
        {prbID: 21, text: "The number of exercises completed by each student preparing for an algebra exam is shown below.", ques:"numbers of exercises completed", min:2, max:32},
        {prbID: 22, text: "The weight for each of several cereal brands sold in a store is shown below, in grams.", ques: "weights of cereal boxes", min:200, max:650},
        {prbID: 23, text: "Below are the mean temperatures in a series of days in a city.", ques:"temperatures in the city", min:30, max:70},
        {prbID: 24, text: "The price of a commodity in several different cities is given below.", ques: "prices of the commodity", min:100, max:200},
        {prbID: 25, text: "The height of the players of a team is shown below, in inches.", ques:"heights of the players", min:70, max:90},
        {prbID: 26, text: "The total number of bikes sold in the past few days in a shop is shown below.", ques:"numbers of bikes sold", min:0, max:20},
        {prbID: 27, text: "The sizes of the bicycles owned by the students in a class are listed below, in inches.", ques: "sizes of the bicycles", min:20, max:40},
        {prbID: 28, text: "The points scored in each game by a middle school's football team are shown below.", ques: "scores", min:8, max:30},
        {prbID: 29, text: "The number of DVDs rented at a local store in the past few days are shown below.", ques: "numbers of movies rented during this period", min:1, max:30},
        {prbID: 30, text: "The maximum length, in feet, of several whales is listed below.", ques: "whale lengths", min:30, max:70},
        {prbID: 31, text: "The number of visitors to a local museum each month in the past few months is shown below.", ques: "numbers of visitors", min:1, max:40},
        {prbID: 32, text: "A group of friends went bowling. Below are their scores.", ques:"scores", min:10, max:300}
        ];
        
    // training sequence - generate if we're just starting, otherwise retrieve from database
    if ( new_user ) {
        // eventually should only run when participant first begins the study - if continuing from a previous start, see below
        var probIDs=[], categories=[], trialtypes=[];
        // generate problem ID sequence: 3 successive trials for each of 5 randomly selected problem IDs
        function shuffle(o) { //v1.0
            for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
        };
        var all_probIDs = shuffle( training_questions.map( function(el){return el.prbID;} ) );
        var probID;
        for ( var i=0; i<5; i++ ) {
            probID = all_probIDs[i];
            probIDs = probIDs.concat( [ probID, probID, probID ] );
        }
        // generate category sequence: 5 repetitions of a random (but fixed) permutation of Mean, Median, Mode
        var base_categories = shuffle( ['Mean','Median','Mode'] );
        for ( var i=0; i<5; i++ ) {
            categories = categories.concat( base_categories );
        }
        // generate trial type sequence (active/intermediate/passive) according to experimental condition
        for ( var i=0; i<5; i++ ) {
            if ( i<parameters[0] ) {
                trialtypes = trialtypes.concat( [ "Passive", "Passive", "Passive" ] );
            } else if ( i<parameters[1] ) {
                trialtypes = trialtypes.concat( [ "Intermediate", "Intermediate", "Intermediate" ] );
            } else {
                trialtypes = trialtypes.concat( [ "Active", "Active", "Active" ] );
            }
        }
        // save training sequence info in a single object, add to prepend data and database, then start the experiment
        training_sequence = { "probIDs": probIDs, "categories": categories, "trialtypes": trialtypes };
        prepend_data.training_sequence = probIDs.concat( categories.concat( trialtypes ) ).toString();

        // save training sequence as JSON encoded string in database
        $.ajax({
			type: 'post',
			cache: false,
			url: 'save_sequence.php',
			data: {"subjid": sid , "sequenceobj": JSON.stringify(training_sequence)}
		});

        start();
    } else {
        // eventually should run when continuing from a previous start. recover previously-generated training_sequence, then call start()
         prepend_data.training_sequence = training_sequence.probIDs.concat( training_sequence.categories.concat( training_sequence.trialtypes ) ).toString();
         
         start();
    }
}


// starting experiment

function start(){
	$("#wrapper").html('<div id="target"></div>');
	var display_loc = $("#target");
	startExperiment( display_loc, prepend_data, pretest_questions, posttest_questions, training_questions, training_sequence );
}

</script>
</html>
