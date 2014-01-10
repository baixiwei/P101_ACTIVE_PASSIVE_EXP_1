///////////////////////////////////////////////////////////////////////////
// main experiment structure
// startExperiment, doPretest, doInstructions, doTraining, endExperiment
///////////////////////////////////////////////////////////////////////////

// global variables
//  global variables assigned by startExperiment call
// should only be used within startExperiment.js
var startExperiment_display_loc;
var startExperiment_prepend_data;
var startExperiment_pretest_questions;
var startExperiment_posttest_questions;
var startExperiment_training_questions;
var startExperiment_training_sequence;
var startExperiment_skip;


// startExperiment: assign global vars, randomize training questions, and run pretest
function startExperiment( display_loc, prepend_data, pretest_questions, posttest_questions, training_questions, training_sequence ) {
    startExperiment_display_loc         = display_loc;
    startExperiment_prepend_data        = prepend_data;
    startExperiment_pretest_questions   = pretest_questions;
    startExperiment_posttest_questions  = posttest_questions;
    startExperiment_training_questions  = training_questions;
    startExperiment_training_sequence   = training_sequence;
    
	// build skip object here
	// var skip_training = false; // for debug purposes;
	$.ajax({
		type: 'post',
		cache: false,
		url: 'check_progress.php',
		data: {"sid": prepend_data.subjid},
		success: function(data)
		{
			var progress = JSON.parse(data);
			// progress.training = skip_training;   // for debug purposes
            progress.instructions = true;           // for development only, delete before going live
			startExperiment_skip = progress;
			
			doIntroduction();
		},
		error: function()
		{
			var progress = { "introduction": false, "pretest": false, "instructions": false, "training": false, "posttest": false };
            progress.instructions = true;           // for development only, delete before going live
			startExperiment_skip = progress;
			
			doIntroduction();
		}
	});	
}

// doIntroduction: and then pretest
function doIntroduction() {
	var subjid = prepend_data.subjid;
    
	var callback = function() {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": subjid, "flag": "introduction"}
		});
		
        doPretest();
    }
    var introduction = [
        "<p>The tutorial consists of 4 parts: a short test, instructions, a set of practice problems, and a few background questions. It should take about 30 minutes. Please do it all in one sitting - your work will not be saved if you close the page before finishing.</p><p><em>IMPORTANT:</em> During the tutorial, <em>DO NOT USE</em> your browser's 'Forward', 'Back', or 'Refresh' buttons. If you do, <em>all your work will be lost.</em></p><p>Click below to start.</p>",
        "<h1>Test Section</h1><p>In this section of the tutorial, you will take a short multiple choice test about mean, median, and mode.</p><p>The purpose of this test is to find out how much you already know about these concepts. So, please don't use any outside sources (books, friends, internet).</p><p>This test doesn't count towards your grade, but it's very similar to the test you'll receive later in class, which <strong>will</strong> count towards your grade. So this test is good practice for the real one.</p><p>Please do <em>NOT</em> use a calculator in this section. You won't have a calculator on the test in class, so it's better to practice without one too.</p>"
    ];
	if( startExperiment_skip.introduction ){
		doPretest();
	} else {
		doSlideshow( startExperiment_display_loc, introduction, callback );
	}
}

// doPretest: and then show training instructions
function doPretest() {
    var callback = function() {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": prepend_data.subjid , "flag": "pretest"}
		});
		
		// next section
        doInstructions();
    };
    if ( startExperiment_skip.pretest ) {
        var questions = []; 
    } else {
        var questions = startExperiment_pretest_questions;
    }
	
	// if we are skipping this because someone has already done it,
	// then we do not want to write a redundant flag to the database
	if ( questions.length > 0 ) {
		doRadioSurvey( questions, "pretestdata", startExperiment_display_loc, startExperiment_prepend_data, callback );
	} else {
		doInstructions();
	}
}

// doInstructions: and then run the training
// TBD
function doInstructions() {
    var callback = function() {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": prepend_data.subjid , "flag": "instructions"}
		});
		
		// next section
        doTraining();
    };
    /*
    var instructions = [
        "<h1>Instruction Section</h1><p>This section of the tutorial will explain to you more about the concepts of mean, median, and mode.</p>", "<h2>Mean</h2><p>The <strong>mean</strong> is the same as the <strong>average</strong>. To find the mean of a set of numbers, divide their sum by how many numbers there are.</p><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], then their sum is 49, and there are 7 numbers. So the mean is 49/7=7.</p>",
        "<h2>Median</h2><p>The <strong>median</strong> of a set of numbers is the number that is in the middle when the numbers are put in order.</p><p>To find the median, put them in order and then look to see which number is in the middle.</p><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], when you put them in order you get [ 4, 5, 6, 8, 8, 8, 10 ]. The number in the middle is 8, so the median is 8.</p><p>(Don't worry about situations when there's an even quantity of numbers-- we won't have any of those in this tutorial.)</p>",
        "<h2>Mode</h2><p>The <strong>mode</strong> of a set of numbers is the number that appears most commonly.</p><p>To find the mode, just count how many times each number appears and find which one appears the most. It's easiest to do this if you put the numbers in order first.</p><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], when you put them in order you get [ 4, 5, 6, 8, 8, 8, 10 ]. 8 appears 3 times, more often than any other number, so the mode is 8.</p>",
        "<h1>Practice Section</h1><p>In this section, you'll have a chance to practice the concepts you just learned.</p><p>You will see a series of practice problems for calculating mean, median, and mode. You'll have to answer each problem first, and then you'll be shown the correct answer.</p><p>In this section, please <em>feel free to use a calculator</em>. If you use an online calculator such as <a href='http://calculator.pro/' target='_blank'>Calculator Pro</a>, be sure to open it in a separate window.</p>"
        ];
    var buttons = '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>modified set of data</em>.</button>' +
        '<button type="button" class="option_buttons">Find the <em>Median</em> for the <em>same set of data</em>.</button>' +
        '<button type="button" class="option_buttons">Find the <em>Mode</em> for the <em>same set of data</em>.</button><br>' +
        '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>different story problem</em>.</button>' +
        '<button type="button" class="option_buttons">Find the <em>Median</em> for the <em>different story problem</em>.</button>' +
        '<button type="button" class="option_buttons">Find the <em>Mode</em> for the <em>different story problem</em>.</button>';
    var button_00 = '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>modified set of data</em>.</button>';
    var button_10 = '<button type="button" class="option_buttons">Find the <em>Mean</em> for a <em>different story problem</em>.</button>';
    var button_01 = '<button type="button" class="option_buttons">Find the <em>Median</em> for the <em>same set of data</em>.</button>';
    var complete_targs = getCompleteTargs( pretest_questions, posttest_questions, training_questions, training_sequence );
    var progbar = "<table border='1'><tr>" + // "<table border='1'><tr><td colspan='3'>Your Progress</td></tr><tr>" +
        "<td><strong>Mean</strong><br>2 out of " + complete_targs[0] + " complete</td>" +
        "<td><strong>Median</strong><br>1 out of " + complete_targs[1] + " complete</td>" +
        "<td><strong>Mode</strong><br>3 out of " + complete_targs[2] + " complete</td>" +
        "</tr></table>";
    if ( condition==SELF_REGULATED ) {
        instructions = instructions.concat( [
            "<p>After you complete each example, you will be able to choose what kind of example you want to see next. You'll see a set of buttons like this at the bottom of the page:</p><p>"+buttons+"</p><p>You can select mean, median, or mode by choosing buttons in the different columns. If you choose buttons in the first row, the next example will use the same story problem and either the same data or slightly modified data. If you choose buttons in the second row, the next example will use a completely different story problem and data.</p>",
            "<p>For example, suppose you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>Then suppose you pressed this button:</p><p>" + button_00 + "</p><p>In this case, you'd see a problem like this:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5, <ins>6</ins>, <ins>8</ins> ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>Notice that you're still being asked about the mean, but the data has been changed a bit. You can choose this option to see how the mean (or median, or mode) changes as a result of changes to the data.</p>",
            "<p>Now, suppose again that you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>But suppose you pressed this button instead:</p><p>" + button_01 + "</p><p>In this case, you'd see a problem like this:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>median</em> number of hamburgers eaten.'</p></div><p>Notice that the story and data are the same, but now you're being asked for the median instead of the mean. You can choose this option to compare different ways of calculating central tendency for the same data.</p>",
            "<p>Finally, suppose again that you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>But suppose you pressed this button instead:</p><p>" + button_10 + "</p><p>In this case, you'd see a problem like this:</p><div class='example'><p>'Each salesperson in an ad agency is evaluated based on how many contracts they bring in per year. Below you can see the number of contracts won by each of several salespeople.</p><p>[ 5, 11, 9, 9, 17, 20, 2 ]</p><p>Find the <em>mean</em> number of contracts won.'</p></div><p>You're still being asked for the mean, but it's a totally different story problem. You can choose this option if you want to see a new story problem with different data.</p>",
            "<p>You will have to complete at least 5 examples of mean, 5 of median, and 5 of mode, for 15 total. You can do them in any order you like, and it doesn't matter whether (or how much) you switch to new story problems.</p><p>At the top of the page, you'll see a table like this:</p><p>"+progbar+"</p><p>This will tell you how many problems you have finished already for each type. Once you've finished this minimum number, a 'Quit' button will appear which you can use to end the tutorial. However, you can do even more examples if you want - there's no limit!</p><p>OK, that's all! Click below to get started!"
        ] );
    } else {
        instructions = instructions.concat( [
            "<p>After you complete each example, you'll see some buttons like these at the bottom of the page:</p><p>"+buttons+"</p><p>However, only one button will appear at one time. The label on the button will tell you whether the next example will involve mean, median, or mode. It will also tell you whether the next example will use the same story problem as the current example with either the same or slightly modified data, or instead a completely different story problem and data.</p>",
            "<p>For example, suppose you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>Then suppose this button appears:</p><p>" + button_00 + "</p><p>After clicking the button, you'd see a problem like this:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5, <ins>6</ins>, <ins>8</ins> ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>Notice that you're still being asked about the mean, but the data has been changed a bit. This button lets you see how the mean (or median, or mode) changes as a result of changes to the data.</p>",
            "<p>Now, suppose again that you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>But suppose instead that this button appears:</p><p>" + button_01 + "</p><p>In this case, you'd see a problem like this:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>median</em> number of hamburgers eaten.'</p></div><p>Notice that the story and data are the same, but now you're being asked for the median instead of the mean. This button lets you compare different ways of calculating central tendency for the same data.</p>",
            "<p>Finally, suppose again that you did the following problem:</p><div class='example'><p>'Five friends have a hamburger-eating contest. Below you can see the number of hamburgers eaten by each friend.</p><p>[ 10, 8, 8, 4, 5 ]</p><p>Find the <em>mean</em> number of hamburgers eaten.'</p></div><p>But suppose that this button appears instead:</p><p>" + button_10 + "</p><p>In this case, you'd see a problem like this:</p><div class='example'><p>'Each salesperson in an ad agency is evaluated based on how many contracts they bring in per year. Below you can see the number of contracts won by each of several salespeople.</p><p>[ 5, 11, 9, 9, 17, 20, 2 ]</p><p>Find the <em>mean</em> number of contracts won.'</p></div><p>You're still being asked for the mean, but it's a totally different story problem. This button lets you see a new story problem with different data.</p>",
            "<p>You will have to complete at least " + complete_targs[0] + " examples of mean, " + complete_targs[1] + " of median, and " + complete_targs[2] + " of mode, for " + getSum(complete_targs) + " total. At the top of the page, you'll see a table like this:</p><p>"+progbar+"</p><p>This will tell you how many problems you have finished already for each type. Once you've finished this minimum number, a 'Quit' button will appear which you can use to end the tutorial.</p><p>OK, that's all! Click below to get started!"
        ] );
    }
    */
    if ( startExperiment_skip.instructions ) 
	{ 
		doTraining();
	} else {
		doSlideshow( startExperiment_display_loc, instructions, callback );
	}
}

// doTraining: and then go to posttest
function doTraining() {
    // callback is called at the end of training
    var callback = function( data ) {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": prepend_data.subjid , "flag": "training"}
		});
	
           // display_loc.html( JSON.stringify( data ) );
        doPosttest();
    };
	// check to see if there is any progress
    if ( startExperiment_skip.training ) {
        doPosttest();
    } else {
        $.ajax({
            type: 'post',
            cache: false,
            url: 'restore_progress.php',
            data: {"subjid": prepend_data.subjid},
            success: function(data) {
                // trial_data will contain an array with each element representing the trial
                // data can be accessed by name, i.e. trial_data[0].correct will indicate whether the first trial was correct or not.
                var trial_data      = JSON.parse(data);
                var trial_idx       = (trial_data==undefined) ? 0 : trial_data.length;
                var prev_dataset    = (trial_data==undefined) ? undefined : trial_data[trial_data.length-1]['dataset'].split(',').map( Number );
                console.log( "doTraining(): Successfully restored tutorial progress with trial_idx " + trial_idx + "." );
                doTutorialTrial( startExperiment_display_loc, startExperiment_training_questions, startExperiment_training_sequence, startExperiment_prepend_data, trial_idx, prev_dataset, callback );
                // TBD: pass in some info that indicates if there was a recovery here?
            },
            error: function(){
                // this likely means that they did not complete any trials, and therefore should start from scratch.
                // we do that by just creating a trial generator without previous progress information
                console.log( "doTraining(): failed to recover tutorial progress." );
                var trial_idx       = 0;
                doTutorialTrial( startExperiment_display_loc, startExperiment_training_questions, startExperiment_training_sequence, startExperiment_prepend_data, trial_idx, callback );
            }
        });
    }
}

// doPosttest: then go to background demographics
// doPretest: and then show training instructions
function doPosttest() {
    var callback = function() {
		// update subject progress in database
		$.ajax({
			type: 'post',
			cache: false,
			url: 'update_progress.php',
			data: {"sid": prepend_data.subjid , "flag": "posttest"}
		});
		
		// next section
        doDemographics();
    };
    if ( startExperiment_skip.posttest ) {
        var questions = []; 
    } else {
        var questions = startExperiment_posttest_questions;
    }
	
	// if we are skipping this because someone has already done it,
	// then we do not want to write a redundant flag to the database
	if ( questions.length > 0 ) {
        var intro = [ "<h1>Test Section</h1><p>Great job! You're done with the practice section, and you're almost done with the whole tutorial!</p><p>In this section, you will take another short multiple choice test about mean, median, and mode. The test questions are similar to questions that will appear on your midterm exam, so they are good practice for the midterm. Just like before, please don\'t use any outside sources, or a calculator, for this part.</p>" ];
        var test = function() { doRadioSurvey( questions, "posttesttdata", startExperiment_display_loc, startExperiment_prepend_data, callback ); };
		doSlideshow( startExperiment_display_loc, intro, test );
	} else {
		doDemographics();
	}
}

// doDemographics: and then end the experiment
function doDemographics() {
    var callback = function() {
        endExperiment();
    }
    var questions = [
        { "number": 0,
          "text": "<h1>Background Questions</h1><p>Congratulations! You're done with the tutorial! Finally, could you take a minute to answer a few questions about yourself?</p><p>This will just take a minute - honest!</p>" },
        { "number": 1,
          "text": "<p>Are you male or female?</p>",
          "answers": [ "Male", "Female" ] },
        { "number": 2,
          "text": "<p>How much do you agree with this statement? 'I enjoyed the statistics training that I just completed.'</p>",
          "answers": [ "1 = strongly disagree", "2 = disagree", "3 = neutral", "4 = agree", "5 = strongly agree" ] },
        { "number": 3,
          "text": "<p>How much do you agree with this statement? 'The training that I just completed helped me to understand mean, median, and mode.'</p>",
          "answers": [ "1 = strongly disagree", "2 = disagree", "3 = neutral", "4 = agree", "5 = strongly agree" ] },
        { "number": 4,
          "text": "<p>How much do you agree with this statement? 'I generally feel anxious when I am doing mathematics in a class.'</p>",
          "answers": [ "1 = strongly disagree", "2 = disagree", "3 = neutral", "4 = agree", "5 = strongly agree" ] },
        { "number": 5,
          "text": "<p>How much do you agree with this statement? 'I enjoy doing mathematics.'</p>",
          "answers": [ "1 = strongly disagree", "2 = disagree", "3 = neutral", "4 = agree", "5 = strongly agree" ] },
        { "number": 6,
          "text": "<p>How much do you agree with this statement? 'Before this training, I already knew how to calculate means, medians, and modes.'</p>",
          "answers": [ "1 = strongly disagree", "2 = disagree", "3 = neutral", "4 = agree", "5 = strongly agree" ] },
        { "number": 7,
          "text": "<p>When doing the practice examples, did you sometimes compare an example to the previous example?</p>",
          "answers": [ "No", "Yes" ] }
    ];
    doRadioSurvey( questions, "demographicdata", startExperiment_display_loc, startExperiment_prepend_data, callback );
}    
          
// endExperiment: records completion data and displays completion message
function endExperiment() {
    startExperiment_display_loc.html( "<p>The tutorial is now complete and your data has been recorded. Thank you for your participation! You may now close this browser window.</p>" );
}


//////////////////////////////////////////////////////////////////////
// helper functions for pretest, posttest, and instructions
// doRadioSurvey, doRadioQuestion, doSlideshow
//////////////////////////////////////////////////////////////////////

// doRadioSurvey
//  ask a series of multiple-choice questions
function doRadioSurvey( questions, table_name, display_loc, prepend_data, callback ) {
    if ( questions.length==0 ) {
        callback();
    } else {
        var question = questions.shift();
        doRadioQuestion( display_loc, question, 
            function( data ) {
                trial_data = $.extend( {}, prepend_data, data );
                $.ajax({ 
					type: 'post', 
					cache: false, 
					url: 'submit_data_mysql.php',
					data: { 'table': table_name, 'json': JSON.stringify([[trial_data]] ) },
                    success: function(d) {
						console.log(d)
                        doRadioSurvey( questions, table_name, display_loc, prepend_data, callback );
					},
					error: function(d) {
						console.log(d);
                        doRadioSurvey( questions, table_name, display_loc, prepend_data, callback );
                    }
                } );
            } );
    }
}

// doRadioQuestion
//  ask a single multiple-choice question
function doRadioQuestion( display_loc, question, callback ) {
    var content = "<form id='question_form' name='question_form' action=''><p>" + question.text + "</p>";
    if ( question.answers != undefined ) {
        for ( var i=0; i<question.answers.length; i++ ) {
            content += "<input type='radio' name='radio_option' value='" + i.toString() + "'>" + question.answers[i] + "<br>";
        }
        content += "<br><input type='submit' id='submit_button' name='submit_button' value='Submit'></form>";
    } else {
        content += "<br><input type='submit' id='submit_button' name='submit_button' value='Continue'></form>";
    }
    display_loc.html( content );
    var start_time = new Date();
    resp_func = function(e) {
        e.preventDefault();
		// check what kind of question this is
		// pretest question
        if ( ( question.answers != undefined ) && ( question.correct_response != undefined ) ) {
            var response = $('input[name=radio_option]:checked').val();
            if ( response == undefined ) {
                alert( "Please select an answer before proceeding." );
            } else {
                display_loc.html( "" );
                var end_time = new Date();
                $("#question_form").unbind("submit",resp_func);
                callback( { "number": question.number, "rt": end_time.getTime()-start_time.getTime(), "start": start_time.toString(), "end": end_time.toString(), "correct_response": question.correct_response, "response": response, "correct": (question.correct_response==response) } );
            }
		// what kind is this?
        } else if ( question.answers != undefined ) {
            var response = $('input[name=radio_option]:checked').val();
            if ( response == undefined ) {
                alert( "Please select an answer before proceeding." );
            } else {
                display_loc.html( "" );
                var end_time = new Date();
                $("#question_form").unbind("submit",resp_func);
                callback( { "number": question.number, "rt": end_time.getTime()-start_time.getTime(), "start": start_time.toString(), "end": end_time.toString(), "response": response } );
            }   
		// what kind is this?
        } else {
            display_loc.html( "" );
            var end_time = new Date();
            $("#question_form").unbind("submit",resp_func);
            callback( { "number": question.number, "rt": end_time.getTime()-start_time.getTime(), "start": start_time.toString(), "end": end_time.toString()  } );
        }
    }
    $("#submit_button").click( resp_func );
    $("#submit_button").focus();
    window.scrollTo(0,0);
}

// doSlideshow
//  present a sequence of text blocks
function doSlideshow( display_loc, content_array, callback ) {
    if ( content_array.length==0 ) {
        callback();
    } else {
        display_loc.html( content_array.shift() );
        var continue_button = "<p><button type='button' id='continue_button'>Continue</button></p>";
        display_loc.append( continue_button );
        $("#continue_button").click( function() {
            doSlideshow( display_loc, content_array, callback ); } );
        $("#continue_button").focus();
        window.scrollTo(0,0);
    }
}


//////////////////////////////////////////////////////////////////////
// helper functions for tutorial
// doTutorialTrial, createTrialSpec, displayTutorialTrial
//////////////////////////////////////////////////////////////////////

// do tutorial trials until you've run through all the trials specified in sequence, then call callback
function doTutorialTrial( display_loc, problems, sequence, prepend_data, trial_idx, prev_dataset, callback ) {
    var endTrial = function( data ) {
        // save data, then increment idx and either call the callback or do another iteration
        var trial_data = $.extend( {}, prepend_data, data );
        var new_dataset = trial_data['dataset'].split(',').map( Number );
        var action;
        if ( (trial_idx+1)<sequence.probIDs.length ) {
            action = function(d) {
                console.log(d);
                doTutorialTrial( display_loc, problems, sequence, prepend_data, trial_idx+1, new_dataset, callback );
            }
        } else {
            action = function(d) {
                console.log(d);
                callback();
            }
        }
        $.ajax( { 
            type: 'post', 
            cache: false, 
            url: 'submit_data_mysql.php',
            data: { 'table':'trialdata', 'json': JSON.stringify([[trial_data]] ) },
            success: action,
            error: action
            } );
    }
    var trial_spec = createTrialSpec( problems, sequence, trial_idx, prev_dataset );
    displayTutorialTrial( display_loc, trial_spec, endTrial );
}

// create all the content needed to display the trial and return it as an associative array
function createTrialSpec( problems, sequence, trial_idx, prev_dataset ) {
    var category    = sequence.categories[trial_idx];                                       // category for current trial
    var trialtype   = sequence.trialtypes[trial_idx];                                       // trial type (passive, intermediate, active)
    var progbar     = getProgressBar( trial_idx, sequence.probIDs.length );                 // progress bar
    var probID      = sequence.probIDs[trial_idx];
    var problem     = problems.filter( function(prob) { return prob.prbID==probID; } )[0];  // problem for current trial
    var probtxt     = "<p>" + problem.text + "</p>";                                        // text of story
    var dataset     = ((trial_idx%3==0)||(prev_dataset==undefined)) ?                       // dataset for current trial
                      generateNewDataset( problem.min, problem.max ) : prev_dataset;
    var dataset_str = stringifyDataset( dataset );                                          // pretty version of dataset
    var question    = getQuestion( problem, category );                                     // text of the question to be answered
    var text        = progbar + probtxt + dataset_str + question;                           // text block to appear before prompts
    var q1_text     = getStepPrompt( category, 1, problem.ques );                           // text of first solution step prompt
    var q1_key      = getStepKey( dataset, category, 1 );                                   // answer key for first step
    var q2_text     = getStepPrompt( category, 2, problem.ques );                           // text of second solution step prompt
    var q2_key      = getStepKey( dataset, category, 2 );                                   // answer key for second step
    var givens      = getStepPromptGivens( trialtype );                                     // determine which solution steps are to be presented already solved
    var q1_given    = givens[0];                                                            // whether answer to first step is given
    var q2_given    = givens[1];                                                            // whether answer to second step is given
    text            += "<p>The trial type is " + trialtype + ".</p>";                       // testing only
    text            += "<p>" + q1_text + " (solution would " + ["not be given","be given"][Number(q1_given)] + ").</p>";
    text            += "<p>" + q2_text + " (solution would " + ["not be given","be given"][Number(q2_given)] + ").</p>";
    var feedback_fn = function(corrects,num_errors) {                                       // function used during trial to generate feedback
        getFeedback( category, trialtype, dataset, givens, responses, num_errors ); };
    var data = {
        "trial_num": trial_idx, "trialtype": trialtype, "storyidx": probID, "category": category, "dataset": dataset.toString(),
        "q1_key": q1_key, "q1_given": Number(q1_given), "q2_key": q2_key, "q2_given": Number(q2_given) };
    return { "text": text, "q1_text": q1_text, "q1_key": q1_key, "q1_given": q1_given, "q2_text": q2_text, "q2_key": q2_key, "q2_given": q2_given, "feedback_fn": feedback_fn, "data": data };
}

// display the trial in the given location using the given specs and call callback on trial data once complete
function displayTutorialTrial( display_loc, trial_spec, callback ) {
    // variables to be given values during the trial
    var q1_response, q1_correct, q2_response, q2_correct, correct, errors=0;
    var start_time=new Date(), rt, time_complete;
    // function to run when the trial is complete
    var returnResult = function() {
        display_loc.html('');
        time_complete   = ( new Date().getTime() - start_time.getTime() );
        var end_time    = new Date();
        var data        = $.extend( {}, trial_spec.data,
            { "q1_response": q1_response, "q1_correct": Number(q1_correct),
              "q2_response": q2_response, "q2_correct": Number(q2_correct),
              "correct": Number(correct), "errors": errors,
              "start": start_time.toString(), "end": end_time.toString(),
              "rt": rt, "time_complete": time_complete } );
        callback( data );
    }
    // display trial content (TBD, this is just a placeholder)
    display_loc.html( trial_spec.text + "<button type='button' id='submit'>Submit</button>" );
    $('#submit').click( returnResult );
    window.scrollTo(0,0);
    // for testing, assign values to all the vars that should get values during trial
    q1_response = "placeholder";
    q1_correct  = q1_response==trial_spec.q1_key;
    q2_response = 5.9;
    q2_correct  = q2_response==trial_spec.q2_key;
    correct     = q1_correct && q2_correct;
    rt          = new Date().getTime() - start_time.getTime();
}


//////////////////////////////////////////////////////////////////////
// helper functions for createTrialSpec
//////////////////////////////////////////////////////////////////////

// create a progress bar
function getProgressBar( complete, total ) {
    var width   = $('#target').width()-200;
    var height  = 20; 
    var padding = 3;
    var content = "<table><tr><td style='vertical-align:middle; width: "+150+"px'>Your progress:  </td><td>";
    content     += "<div style='background-color: gray; border-radius: "+((height/2)+padding)+"px; padding: "+padding+"px; width: "+width+"px'>";
    content     += "<div style='background-color: #00FF99; width: "+(Math.floor(100*complete/total))+"%; height: "+height+"px; border-radius: "+(height/2)+"px'>";
    content     += "</div></div></td></tr></table><br>";
    return content;
}

// generateAndTest:
//  call func until test applied to its output returns true or counter runs out
//  return the output if true, false if the counter ran out
function generateAndTest( generator, testfunc, counter ) {
    var x;
    do {
        x = generator();
        counter--;
    } while ( (!testfunc(x)) && (counter>0));
    if ( counter<=0 ) {
        return false;
    } else {
        return x;
    }
}

// generateNewDataset
//  try to generate a dataset using numbers in [min,max] that is nice
function generateNewDataset( min, max ) {
    var generator = function() {
        var dataset = [];
        var length = 5 + Math.floor(Math.random()*3)*2;
        var num;
        for ( var i=0; i<length; i++ ) {
            num = randRange(min,max);
            dataset.push( num );
        }
        return dataset;
    }
    var tester = function( dataset ) {
        return ( isDatasetNice( dataset ) && ( getFrequencyProfile( dataset ).frequencies[0]==3 ) );
    }
    // if possible, try to generate a dataset with a mode with frequency 3
    var result = generateAndTest( generator, tester, 2000 );
    // if you failed, just generate any nice dataset
    if ( !result ) {
        result = generateAndTest( generator, isDatasetNice, 5000 );
    }
    return result;
}

function isDatasetNice(ds) {
    var dsprof  = getFrequencyProfile(ds);
    return     true
            && ( (ds.length%2)==1 )                                 // odd number of els
            && ( dsprof.elements.length>2 )                         // more than 2 unique elements
            && ( dsprof.frequencies[0]<=3 )                         // mode is 3 or less
            && ( dsprof.frequencies[0]==(dsprof.frequencies[1]+1) ) // contains an el with frequency = mode frequency - 1
            ;
}

// convert dataset to text string that can be presented to the user
function stringifyDataset( ds ) {
    var result = "<p>Data set: ";
    for ( var i=0; i<ds.length; i++ ) {
        result += ds[i] + ", ";
    }
    result = result.substring(0,result.length-2) + "</p>";
    return result;
}

// create text of the actual question the user is supposed to answer
function getQuestion( problem, category ) {
    return (category=="Mean") ?
        "<p>Find the <em>Mean</em> of the " + problem.ques + ". (Round off decimals to two decimal places.)</p>" :
        "<p>Find the <em>" + category + "</em> of the " + problem.ques + ".</p>";
}

// generate prompts for solution steps 1 and 2 for each category
function getStepPrompt( category, step, plural_noun ) {
    var prompts = {
        "Mean": [
            "Start by adding up all of the " + plural_noun + ". Write their sum here:",
            "Now divide the sum by the total number of numbers. The result is the Mean. Write it here:" ],
        "Median": [
            "Start by putting the " + plural_noun + " in order from smallest to largest. Write the result here:",
            "Now find the middle number in the ordered sequence. That number is the Median. Write it here:" ],
        "Mode": [
            "Start by putting the " + plural_noun + " in order from smallest to largest. Write the result here:",
            "Now find which number is repeated the most often. That number is the Mode. Write it here:" ] };
    var prompt = prompts[category][step-1];
    return prompt;
}

solutions:
Mean: Step1: "The sum is “; step2: “The mean is .”
Median: Step1: "The ordered sequence of numbers is "; step2: "The middle number is ."
Mode: Step1: "The ordered sequence of numbers is "; step2: "The number repeated more times is .”

// generate answer keys for solution steps 1 and 2 for each category
function getStepKey( dataset, category, step ) {
    var solutions = {
        "Mean": [
            getSum( dataset ),
            Math.round( getMean( dataset )*100 )/100 ],
        "Median": [
            getSorted( dataset ).toString(),
            getMedian( dataset ) ],
        "Mode": [
            getSorted( dataset ).toString(),
            getMode( dataset ) ] };
    var solution = solutions[category][step-1];
    return solution;
}

// determine which solution steps are to be presented already solved
function getStepPromptGivens( trialtype ) {
    return {
        "Active":       [false,false],
        "Passive":      [true,true],
        "Intermediate": [[false,true],[true,false]][Math.floor(Math.random()*2)]
        }[trialtype];
}

// TBD: determine generate feedback to responses given by user during tutorial trial
// category, trialtype, dataset, and givens are plugged in when the trial starts
// corrects (array giving correctness of responses to all solution step prompts) and num_errors (how many incorrect submissions so far) are passed in during the trial
function getFeedback( category, trialtype, dataset, givens, corrects, num_errors ) {
    var feedback;
    if ( trialtype=="Passive" ) {
        // no feedback given for passive trials
        feedback = false;
    } else if ( corrects.indexOf( false )==-1 ) {
        // no incorrect responses, so give correct feedback
        feedback = "<p><img src='small-green-check-mark-th.png'>  " + " Great job! All your answers are correct!</p>";
    } else if ( num_errors<=1 ) {
        // this is the first error, so they'll have to do it again
        // what follows is a placeholder, real content TBD
        // it's possible that in Intermediate cases where the SECOND solution step is given, it will be incorrect if calculated based on an incorrect first step response
        // in that case you might wish NOT to give error feedback for the second step
        feedback = "<p><img src='small-red-x-mark-th.png'>  " + " Oops!</p>";
        if ( !corrects[0] ) {
            feedback += {
                "Mean": "<p>Your answer to step 1 is not the correct sum of the numbers.</p>",
                "Median": "<p>Your answer to step 1 is not the correct re-arrangement of the numbers from lowest to highest.</p>",
                "Mode": "<p>Your answer to step 1 is not the correct re-arrangement of the numbers from lowest to highest.</p>"
                }[category];
        }
        if ( !corrects[1] ) {
            feedback += {
                "Mean": "<p>Your answer to step 2 is not the correct result of dividing the sum by the number of numbers.</p>",
                "Median": "<p>Your answer to step 1 is not the number that is in the middle once the numbers are arranged from lowest to highest.</p>",
                "Mode": "<p>Your answer to step 1 is not the number that appears most often once the numbers are re-arranged.</p>"
                }[category];
        }
        feedback += "<p>Please try again. The 'Submit' button will reactivate after a few moments.</p>";
    } else {
        // this is the second error, so the correct answers will be filled in for them
        // current feedback is a placeholder
        feedback = "<p><img src='small-red-x-mark-th.png'>  " + " Oops!</p><p>";
        if ( (!corrects[0])&&(!corrects[1]) ) {
            feedback += "Your answers to steps 1 and 2 are ";
        } else if ( !corrects[0] ) {
            feedback += "Your answer to step 1 is ";
        } else if ( !corrects[1] ) {
            feedback += "Your answer to step 2 is ";
        }
        feedback += "still incorrect.</p><p>The correct answer has been filled in for you - please take a moment to read it. The 'Continue' button will reactive after a few moments.</p>";
    }
    return feedback;
}

/* // Old feedback function retained temporarily for reference.
function getFeedback( dataset, measure ) {
    var correct = "<p><img src='small-green-check-mark-th.png'>  " + " Yes, that's correct!</p>";
    var incorr  = "<p><img src='small-red-x-mark-th.png'>  " + " Oops, that's not correct.</p>";
    switch ( measure ) {
        case "Mean":
            var s = getSum(dataset);
            var l = dataset.length;
            incorr += "<p>The sum of the numbers is " + s + " and there are " + l + " numbers. So the Mean is " + s + "/" + l + "=" + getCentTend( dataset, measure ) + ".</p>";
            break;
        case "Median":
            var sorted = getSorted(dataset);
            incorr += "<p>If you put the numbers in order, you get " + sorted.toString() + ". Then the Median is just the middle number, which is " + getCentTend( dataset, measure ) + ".</p>";
            break;
        case "Mode":
            var sorted = getSorted(dataset);
            var m = getCentTend( dataset, measure );
            incorr += "<p>If you put the numbers in order, you get " + sorted.toString() + ". You can see that " + m + " appears " + getFrequency(m,dataset) + " times, more often than any other number. So the Mode is " + m + ".</p>";
            break;
    }
    incorr += "<p>(The continue buttons will appear after several seconds.)</p>";
    return { false: incorr, true: correct };
}
*/


// doTrial: method of TrialSpec class, retained temporarily for reference
//  display this.text and this.question in display_loc, plus an area for text entry and a button
//  button is disabled until something is entered into the text entry area
//  when button is clicked, disappear it, display feedback and buttons based on this.options
//  when one of these is clicked, return result object including this.data, user input data, and which button was clicked
function doTrial( display_loc, callback ) {
    var trial = this;
    var response;
    var correct;
    var returnResult = function( i ) {
        display_loc.html('');
        var end_time = new Date();
        callback($.extend({},trial.data,
            {"response":response,"correct":correct,"rt":end_time.getTime()-start_time.getTime(),"start": start_time.toString(), "end": end_time.toString(), "option_selected":i,"option_text":trial.options[i]},
            extractDataFromOptionText( trial.category, trial.options[i] ) ) );
    }
    // content that will go into the page
    var question_text   = trial.question;
    var answer_field    = '<input type="text" id="answer_box"></input>';
    var answer_button   = '<button type="button" id="answer_button">Show the answer</button>';
    // var option_prompt   = 'Choose the next problem:';
    var option_prompt   = 'Click a button to continue:';
    var option_buttons  = '';
    for ( var i=0; i<trial.options.length; i++ ) {
        if ( i==3 ) { option_buttons += "<br>"; }
        // the above is a hack which relies on knowing that the option buttons come in sets of 3
        // I want the options in the second set of 3 to appear below the corresponding ones in the first set
        option_buttons += '<button type="button" class="option_buttons" id="option_button_'+i+'">'+trial.options[i]+'</button>  ';
    }
    // organize content and post to display_loc
    display_loc.html( 
        '<div id="question">' +
            question_text + 
            answer_field +
            answer_button + '</div></div>' +
        '<div id="feedback"></div>' +
        '<div id="continue">' +
            '<p>' + option_prompt + '</p>' +
            '<p>' + option_buttons + '</p></div>'
    );
    // disable answer_button until answer_field is filled
    $('#answer_button').attr('disabled','disabled');
    $('#answer_box').keyup( function(e) {
        if ( $('#answer_box').val()==="" ) {
            $('#answer_button').attr('disabled','disabled');
        } else {
            $('#answer_button').removeAttr('disabled');
            if (e.keyCode==13) {    // enter key
                $('#answer_button').click();
            }
        }
    } );
    // hide option prompt and buttons until user clicks answer_button
    $('#continue').hide();
    $('#answer_button').click( function() {
        if ( isNaN( $('#answer_box').val() ) ) {
            alert( "Please enter a number in the box. Your answer must be a number." );
        } else {
            $('#answer_box').attr('disabled','disabled');
            $('#answer_button').hide();
            response = $('#answer_box').val();
            if ( ( response==="" ) || ( response===undefined ) ) {
                correct = false;
            } else {
                response = Number( response );
                correct = ( Math.abs(response-trial.answer)<=0.11 );
            }
            var feedback_text = "<p>" + trial.feedback[ correct ] + "</p>";
            $('#feedback').html( feedback_text );
            // add a class to feedback to indicate whether it is correct or not,
            // then show feedback and continue options,
            // with longer delay after incorrect answers
            if ( correct ) {
                $('#feedback').addClass('feedback_correct');
                $('#continue').show();
            } else {
                $('#feedback').addClass('feedback_incorrect');
                setTimeout( function() { $('#continue').show(); }, 10000 );
                // $('#continue').show();
            }
        }
    } );
    // set option buttons to return the trial when clicked
    $('.option_buttons').click( function() { returnResult(Number(this.id.replace("option_button_",""))); } );
    // record start time
    var start_time = new Date();
    window.scrollTo(0,0);
}


//////////////////////////////////////////////////////////////////////
// utilities
//////////////////////////////////////////////////////////////////////

// getSum( a ) : return the sum of an array of numbers
function getSum(a) {
    if ( a.length==0 ) {
        return 0;
    } else {
        return a.reduce(function(a,b){return Number(a)+Number(b);});
    }
}

// getMean( a ) : return the integer mean of an array of numbers, or false if 4 * the mean is not an integer
function getMean(a) {
    return getSum(a)/a.length;
}

// getSorted( a ) : return an array with the same elements as an array of numbers a, sorted from small to large
function getSorted(a) {
    return (a.slice()).sort(function(a,b){return a-b});
}

// getMedian( a ) : return the median of an array of numbers, or false if the array has an even number of numbers
function getMedian(a) {
    if (((a.length)%2)==0) {
        return false;
    } else {
        return getSorted(a)[ (a.length-1)/2 ];
    }
}

// getFrequency( n, a ) : return the number of times n occurs in a
function getFrequency(n,a) {
    var f = 0;
    for ( var i=0; i<a.length; i++ ) {
        if (a[i]==n) { f++; }
    }
    return f;
}

// getFrequencyProfile
//  given an array of numbers, return an array of its unique elements sorted by decreasing frequency,
//  an array of the frequencies of those elements in the original array
//  and an associative array pairing elements with frequencies
function getFrequencyProfile(array) {
    var frequency = {}, value;
    
    // compute frequencies of each value
    for(var i = 0; i < array.length; i++) {
        value = array[i];
        if(value in frequency) {
            frequency[value]++;
        }
        else {
            frequency[value] = 1;
        }
    }

    // make array from the frequency object to de-duplicate
    var uniques = [];
    for(value in frequency) {
        uniques.push(value);
    }

    // sort the uniques array in descending order by frequency
    function compareFrequency(a, b) {
        return frequency[b] - frequency[a];
    }
    uniques = uniques.sort(compareFrequency);
    
    // make array of frequencies of uniques in orig array
    var origfreqs = [];
    for(var i = 0; i < uniques.length; i++) {
        origfreqs.push( frequency[uniques[i]] );
    }

    return { "elements": uniques, "frequencies": origfreqs, "elements_frequencies": frequency };
}

// getMode( a ) : return the mode of an array of numbers, or false if there is more than one mode, or the array is empty
function getMode(a) {
    if (a.length==0) {
        return false;
    } else {
        return getFrequencyProfile(a).elements[0];
    }
}

// randomSubset: return subset containing n of a's indices
function randomSubsetIdxs( a, n ) {
    var ids = [];
    for ( var i=0; i<a.length; i++ ) {
        ids.push(i);
    }
    return shuffle(ids).slice(0,n);
}

// return a copy of a with elements with indexs in idxs removed
function removeElsByIdxs( a, idxs ) {
    var result = [];
    for ( var i=0; i<a.length; i++ ) {
        if ( indexInArray(i,idxs)==-1 ) {
            result.push(a[i]);
        }
    }
    return result;
}

function indexInArray( el, arr ) {
    var idx = -1;
    for ( var i=0; i<arr.length; i++ ) {
        if ( arr[i]==el ) {
            idx = i;
            break;
        }
    }
    return idx;
}

function shuffle(o) { //v1.0
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

// randRange: return an int between min and max inclusive
function randRange( a, b ) {
    return a + Math.floor(Math.random()*(b-a+1));
}

// randWeighted: return an index of the integer array weights chosen with the likelihood of each index proportional to the weight at that index
function randWeighted( weights ) {
    var totalWeight = getSum( weights );
    var r = Math.floor( Math.random()* totalWeight );
    var i = 0;
    while ( r >= weights[i] ) {
        r = r - weights[i];
        i = i + 1;
    }
    return i;
}