///////////////////////////////////////////////////////////////////////////
// main experiment structure
// startExperiment, doPretest, doInstructions, doTraining, endExperiment
///////////////////////////////////////////////////////////////////////////

// define some prototype methods in case they're not present in the browser
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }

    return res;
  };
}

if (!Array.prototype.map)
{
  Array.prototype.map = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        res[i] = fun.call(thisp, this[i], i, this);
    }

    return res;
  };
}

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

var TESTING = false;

// startExperiment: assign global vars, randomize training questions, and run pretest
function startExperiment( display_loc, prepend_data, pretest_questions, posttest_questions, training_questions, training_sequence ) {
    startExperiment_display_loc         = display_loc;
    startExperiment_prepend_data        = prepend_data;
    startExperiment_pretest_questions   = pretest_questions;
    startExperiment_posttest_questions  = posttest_questions;
    startExperiment_training_questions  = training_questions;
    startExperiment_training_sequence   = training_sequence;
    if ( TESTING ) {
        // specify the training problem sequence you want to see for testing
        startExperiment_training_sequence   = {
            "categories": [ "Mean", "Median", "Mode", "Mean", "Median", "Mode" ],
            "probIDs": [ 1,1,1,1,1,1 ],
            "trialtypes": [ "Passive", "Intermediate", "Active", "Intermediate", "Intermediate", "Intermediate" ] };
    }
    
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
            if ( TESTING ) { 
                // specify the sections you want to skip for testing
                progress.introduction   = true;
                progress.pretest        = true;
                progress.instructions   = true;
                progress.training       = false;
            }
            startExperiment_skip = progress;
			doIntroduction();
		},
		error: function()
		{
			var progress = { "introduction": false, "pretest": false, "instructions": false, "training": false, "posttest": false };
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
        "<p>The tutorial consists of 5 parts: (1) a short test, (2) a review of mean, median, and mode, (3) a series of practice problems, (4) a second short test, and (5) a few background questions. It should take about 30 minutes. Please do it all in one sitting - your work will not be saved if you close the page before finishing.</p><p><em>IMPORTANT:</em> During the tutorial, <em>DO NOT USE</em> your browser's 'Forward', 'Back', or 'Refresh' buttons. If you do, <em>all your work will be lost.</em></p><p>Click below to start.</p>",
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
    var instructions = [
        "<h1>Instruction Section</h1><p>This section of the tutorial will explain to you more about the concepts of mean, median, and mode. Also, it will show you a simple two-step method for calculating each of these numbers.</p>",
        "<h2>Mean</h2><p>The <strong>mean</strong> is the same as the <strong>average</strong>. To find the mean of a set of numbers, follow these two steps:</p><ol><li>Calculate the sum of the numbers.</li><li>Then divide the sum by the number of numbers. The result is the mean.</li></ol><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], then</p><ol><li>The sum of the numbers is 10+8+8+4+5+6+8=49.</li><li>There are 7 numbers, so the sum divided by the number of numbers is 49/7=7.</li></ol><p>So the mean is 7.</p>",
        "<h2>Median</h2><p>The <strong>median</strong> of a set of numbers is the number that is in the middle when the numbers are put in order. To find the median, follow these two steps:</p><ol><li>Put the numbers in order.</li><li>Look to see which number is in the middle.</li></ol><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], then</p><ol><li>When you put the numbers in order, you get 4, 5, 6, 8, 8, 8, 10.</li><li>The number in the middle is 8.</li></ol></p><p>So the median is 8. (Don't worry about situations when there's an even quantity of numbers-- we won't have any of those in this tutorial.)</p>",
        "<h2>Mode</h2><p>The <strong>mode</strong> of a set of numbers is the number that appears most commonly. To find the mode, follow these two steps:</p><ol><li>Put the numbers in order.</li><li>Look to see which number appears most commonly.</li></ol><p>Putting the numbers in order first makes it easier to see which number appears most commonly.</p><p>For example, if the numbers are [ 10, 8, 8, 4, 5, 6, 8 ], then</p><ol><li>When you put the numbers in order, you get 4, 5, 6, 8, 8, 8, 10.</li><li>8 appears 3 times, more than any other number.</li></ol><p>So the mode is 8.</p>",
        "<h1>Practice Section</h1><p>In this section of the tutorial, you'll have a chance to practice the concepts you just learned.</p><p>You will see a series of practice problems for calculating mean, median, and mode. You'll have to answer each problem first, and then you'll be shown the correct answer.</p><p>In this section, please <em>feel free to use a calculator</em>. If you use an online calculator such as <a href='http://calculator.pro/' target='_blank'>Calculator Pro</a>, be sure to open it in a separate window.</p>",
        "<p>Remember that each type of problem - mean, median, and mode - can be solved in two steps.</p><ul><li>Sometimes, you may be asked to do both steps yourself.</li><li>Sometimes, either the first or second step will be done for you. You will still need to do the other step.</li><li>Sometimes, both steps will be done for you.</li></ul><p>If one or both steps are already done for you, please be sure to read those steps to understand how they were done. Don't just ignore them!</p>",
        "<p>You will have to complete 5 examples of mean, 5 of median, and 5 of mode, for 15 total. A progress bar at the top of each page will show you how much you have finished and how much you have left to do.</p><p>OK, that's all! Click below to get started!"
        ];
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
                if ( TESTING ) {
                    // if in testing mode, override recovered progress
                    trial_data      = undefined;
                }
                var trial_idx       = (trial_data==undefined) ? 0 : trial_data.length;
                var prev_dataset    = (trial_data==undefined) ? undefined : trial_data[trial_data.length-1]['dataset'].split(',').map( Number );
                var recovery        = trial_idx>0;
                if ( recovery ) { console.log( "doTraining(): Successfully restored tutorial progress with trial_idx " + trial_idx + "." ); }
                doTutorialTrial( startExperiment_display_loc, startExperiment_training_questions, startExperiment_training_sequence, startExperiment_prepend_data, trial_idx, prev_dataset, recovery, callback );
                // TBD: pass in some info that indicates if there was a recovery here?
            },
            error: function(){
                // this likely means that they did not complete any trials, and therefore should start from scratch.
                // we do that by just creating a trial generator without previous progress information
                console.log( "doTraining(): failed to recover tutorial progress." );
                var trial_idx       = 0;
                doTutorialTrial( startExperiment_display_loc, startExperiment_training_questions, startExperiment_training_sequence, startExperiment_prepend_data, trial_idx, [], false, callback );
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
        var intro = [ "<h1>Test Section</h1><p>Great job! You're done with the practice section, and you're almost done with the whole tutorial!</p><p>In this section of the tutorial, you will take another short multiple choice test about mean, median, and mode. The test questions are similar to questions that will appear on your midterm exam, so they are good practice for the midterm. Just like before, please don\'t use any outside sources, or a calculator, for this part.</p>" ];
        var test = function() { doRadioSurvey( questions, "posttestdata", startExperiment_display_loc, startExperiment_prepend_data, callback ); };
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
    startExperiment_display_loc.html( "<p>The tutorial is now complete. Tutorial completion has been recorded for user "+username+". Thank you for your participation! You may now close this browser window.</p>" );
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
function doTutorialTrial( display_loc, problems, sequence, prepend_data, trial_idx, prev_dataset, recovery, callback ) {
    var endTrial = function( data ) {
        // save data, then increment idx and either call the callback or do another iteration
        var trial_data = $.extend( {}, prepend_data, data );
        var new_dataset = trial_data['dataset'].split(',').map( Number );
        var action;
        if ( (trial_idx+1)<sequence.probIDs.length ) {
            action = function(d) {
                console.log(d);
                doTutorialTrial( display_loc, problems, sequence, prepend_data, trial_idx+1, new_dataset, false, callback );
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
    var trial_spec = createTrialSpec( problems, sequence, trial_idx, prev_dataset, recovery );
    displayTutorialTrial( display_loc, trial_spec, endTrial );
}

// create all the content needed to display the trial and return it as an associative array
function createTrialSpec( problems, sequence, trial_idx, prev_dataset, recovery ) {
    var category    = sequence.categories[trial_idx];                                       // category for current trial
    var trialtype   = sequence.trialtypes[trial_idx];                                       // trial type (passive, intermediate, active)
    var probID      = sequence.probIDs[trial_idx];
    var problem     = problems.filter( function(prob) { return prob.prbID==probID; } )[0];  // problem for current trial
    var dataset     = ((trial_idx%3==0)||(prev_dataset==undefined)) ?                       // dataset for current trial
                      generateNewDataset( problem.min, problem.max ) : prev_dataset;
    var givens      = getStepPromptGivens( trialtype );                                     // which solution steps are to be presented already solved
    var q1_given    = givens[0];                                                            // whether answer to first step is given
    var q2_given    = givens[1];                                                            // whether answer to second step is given
    var text        = getProgressBar( trial_idx, sequence.probIDs.length ) +                // progress bar
                      "<div class='problem_text'><p>" + problem.text +                      // text of the problem back story
                      stringifyDataset( dataset ) +                                         // pretty version of dataset
                      getQuestion( problem, category ) + "</div>";                          // text of the question to be answered
    var q1_text     = getStepPrompt( q1_given, category, 1, problem.ques );                 // text of first solution step prompt
    var q1_key      = getStepKey( dataset, category, 1 );                                   // answer key for first step
    var blacked_out = ( !q1_given && q2_given );                                            // whether the answer to the second step will be blacked out
    var q2_text     = getStepPrompt( q2_given, category, 2, problem.ques, blacked_out );    // text of second solution step prompt
    var q2_key      = getStepKey( dataset, category, 2 );                                   // answer key for second step
    var check_valid = function( responses ) {                                               // function used during trial to check validity of responses & generate feedback
        return checkValidity( category, givens, responses ); };
    var check_corr  = function( responses, prev_errors ) {                                  // function used during trial to check correctness of responses & generate feedback
        return checkCorrectness( category, givens, [ q1_key, q2_key ], responses, prev_errors ); };
    var data = {
        "trial_num": trial_idx, "recovery": Number(recovery), "trialtype": trialtype, "storyidx": probID, "category": category, "dataset": dataset.toString(),
        "q1_key": q1_key, "q1_given": Number(q1_given), "q2_key": q2_key, "q2_given": Number(q2_given) };
    return { "text": text, "q1_text": q1_text, "q1_key": q1_key, "q1_given": q1_given, "q2_text": q2_text, "q2_key": q2_key, "q2_given": q2_given, "check_valid": check_valid, "check_corr": check_corr, "data": data };
}

// display the trial in the given location using the given specs and call callback on trial data once complete
function displayTutorialTrial( display_loc, trial_spec, callback ) {
    var start_time, trial_data = {};
    trial_data['errors']    = 0;
    // function to run when the trial is complete
    function processInput() {
        // record time submitted, read in responses, check validity
        var submit_time = new Date();
        var q1_response = $('#q1_response').val();
        var q2_response = $('#q2_response').val();
        var responses   = [ q1_response, q2_response ];
        var valid       = trial_spec.check_valid( responses ).valid;
        if ( !valid ) {
            // if either response is invalid, deliver an error
            alert( trial_spec.check_valid( responses ).feedback );
        } else {
            // check correctness of responses
            var corrects    = trial_spec.check_corr( responses, trial_data['errors'] ).corrects;
            var q1_correct  = corrects[0];
            var q2_correct  = corrects[1];
            // if this is the first valid response submitted, record responses and correctness
            if ( trial_data['rt']==undefined ) {
                trial_data['rt']            = submit_time.getTime() - trial_data['start'];
                trial_data['q1_response']   = q1_response;
                trial_data['q2_response']   = Number(q2_response);
                trial_data['q1_correct']    = Number(q1_correct);
                trial_data['q2_correct']    = Number(q2_correct);
                trial_data['correct']       = Number(q1_correct && q2_correct);
            }
            // if either response is incorrect, record the error
            if ( (!q1_correct) || (!q2_correct) ) {
                trial_data['errors']        += 1;
            }
            // if both solution steps are given, proceed
            if ( trial_spec.q1_given && trial_spec.q2_given ) {
                returnResult();
            } else {
                // otherwise display feedback after a pause
                var feedback = trial_spec.check_corr( responses, trial_data['errors']-1 ).feedback;
                $('#feedback').html('');
                $('#feedback').removeClass( 'feedback_correct feedback_incorrect' ).addClass( (q1_correct&&q2_correct) ? 'feedback_correct' : 'feedback_incorrect' );
                setTimeout( function() { $('#feedback').html( feedback ); }, 250 );
                // decide what to do after displaying feedback
                if ( q1_correct && q2_correct ) {
                    // if both responses are correct, let them go on
                    $('#submit').unbind( 'click', processInput );
                    $('#submit').click( returnResult );
                    $('#submit').html( 'Continue' );
                    // also, reveal step 2 if it was blacked out before
                    $('#q2_response').removeClass( 'blacked-out' );
                } else if ( trial_data['errors']<=1 ) {
                    // if at least one response is incorrect and this is the first error, make them resubmit
                    $('#submit').attr( 'disabled', 'disabled' );
                    setTimeout( function() { $('#submit').removeAttr( 'disabled' ); }, 2250 );
                } else {
                    // if at least one response is incorrect and this is the 2nd+ error, fill in the correct answer(s) and let them proceed after delay
                    if ( !q1_correct ) {
                        $('#q1_response').val( trial_spec.q1_key ).css( 'color', 'red' ).attr( 'disabled', 'disabled' );
                    }
                    if ( !q2_correct ) {
                        $('#q2_response').val( trial_spec.q2_key ).css( 'color', 'red' ).attr( 'disabled', 'disabled' );
                    }
                    // also, reveal step 2 if it was blacked out before
                    $('#q2_response').removeClass( 'blacked-out' );
                    $('#submit').unbind( 'click', processInput );
                    $('#submit').click( returnResult );
                    $('#submit').html( 'Continue' );
                    $('#submit').attr( 'disabled', 'disabled' );
                    setTimeout( function() { $('#submit').removeAttr( 'disabled' ); }, 5250 );
                }
            }
        }
    }
    function returnResult() {
        display_loc.html('');
        var end_time                = new Date();
        trial_data['end']           = end_time.toString();
        trial_data['time_complete'] = end_time.getTime() - start_time.getTime();
        callback( $.extend( {}, trial_spec.data, trial_data ) );
    }
    // display trial content
    var content = "";
    content     += trial_spec.text;
    content     += "<p>" + trial_spec.q1_text + "</p>";
    content     += "<p><input type='text' id='q1_response' size='60' class='solution_step_input'></p>";
    content     += "<p>" + trial_spec.q2_text + "</p>";
    content     += "<p><input type='text' id='q2_response' size='60' class='solution_step_input'></p>";
    content     += "<div id='feedback'></div>";
    content     += "<p><button type='button' id='submit'>Submit</button></p>";
    display_loc.html( content );
    $('#submit').click( processInput );
    window.scrollTo(0,0);
    // if some of the solution steps are given, fill in their answers and disable the text boxes
    if ( trial_spec.q1_given ) {
        $('#q1_response').val( trial_spec.q1_key ).attr( 'disabled', 'disabled' );
    }
    if ( trial_spec.q2_given ) {
        $('#q2_response').val( trial_spec.q2_key ).attr( 'disabled', 'disabled' );
        if ( !trial_spec.q1_given ) {
            $('#q2_response').addClass( 'blacked-out' );
        }
    }
    // record start time
    start_time          = new Date();
    trial_data['start'] = start_time.toString();
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
function getStepPrompt( given, category, step, plural_noun, blacked_out ) {
    blacked_out = (blacked_out===undefined) ? false : blacked_out;
    if ( blacked_out ) {
        // this should only happen on the 2nd solution step, when its answer is given, but the answer to the previous step is not.
        var prompt = {
            "Mean": "We now divide the sum by the total number of numbers. The result is the Mean. This step will be done for you once you complete the first step.",
            "Median": "We now find the middle number in the ordered sequence. That number is the Median. This step will be done for you once you complete the first step.",
            "Mode": "We now find which number is repeated the most often. That number is the Mode. This step will be done for you once you complete the first step."
            }[category];
    } else if ( given ) {
        // answer is given, prompt just explains the meaning of the step
        var prompts = {
            "Mean": [
                "We start by adding up all of the " + plural_noun + ". This step is already done for you. The sum is:",
                "We now divide the sum by the total number of numbers. The result is the Mean. This step is already done for you:" ],
            "Median": [
                "We start by putting the " + plural_noun + " in order from smallest to largest. This step is already done for you. The result is:",
                "We now find the middle number in the ordered sequence. That number is the Median. This step is already done for you:" ],
            "Mode": [
                "We start by putting the " + plural_noun + " in order from smallest to largest. This step is already done for you. The result is:",
                "We now find which number is repeated the most often. That number is the Mode. This step is already done for you:" ] };
        var prompt = prompts[category][step-1];
    } else {
        // answer is not given, prompt requires user to recall and do the step
        var prompts = [
            "Fill in the answer to the first step here.",
            "Now, based on the answer to the first step, fill in the " + category + " here:" ];
        var prompt = prompts[step-1];
    }
    return prompt;
}

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

// return an assoc array of form { "valid": bool, "feedback": "xxx" }
function checkValidity( category, givens, responses ) {
    function responseInvalid( category, number, response ) {
        var invalid = false;
        if ( response==undefined ) {
            invalid = "You seem to have left the " + [ "first", "second" ][ number-1 ] + " step blank.";
        } else if ( response.replace( /\s+/g, '' )=="" ) {
            invalid = "You seem to have left the " + [ "first", "second" ][ number-1 ] + " step blank.";
        } else if ( category=="Mean" ) {
            if ( ( number==1 ) && ( parseAsSingleNum( response )===false ) ) {
                invalid = "Your answer to the first step should be a single number - the sum of all the numbers in the data set.";
            } else if ( ( number==2 ) && ( parseAsSingleNum( response )===false ) ) {
                invalid = "Your answer to the second step should be a single number - the answer to the first step divided by the number of numbers in the data set.";
            }
        } else if ( category=="Median" ) {
            if ( number==1 ) {
                var arr = parseAsIntList( response );
                if ( arr===false ) {
                    invalid = "Your answer to the first step should be a list of numbers - the numbers in the data set, arranged in order from smallest to largest, separated by commas or spaces.";
                } else if ( arr.length<2 ) {
                    invalid = "Your answer to the first step should be a list of numbers, not just a single number. It should include ALL the numbers in the data set, arranged in order from smallest to largest.";
                }
            } else if ( ( number==2 ) && ( parseAsSingleNum( response )===false ) ) {
                invalid = "Your answer to the second step should be a single number - the number which appears in the middle of the numbers in the answer to the first step."
            }
        } else if ( category=="Mode" ) {
            if ( number==1 ) {
                var arr = parseAsIntList( response );
                if ( arr===false ) {
                    invalid = "Your answer to the first step should be a list of numbers - the numbers in the data set, arranged in order from smallest to largest, separated by commas or spaces.";
                } else if ( arr.length<2 ) {
                    invalid = "Your answer to the first step should be a list of numbers, not just a single number. It should include ALL the numbers in the data set, arranged in order from smallest to largest.";
                }
            } else if ( ( number==2 ) && ( parseAsSingleNum( response )===false ) ) {
                invalid = "Your answer to the second step should be a single number - the number which appears most commonly in the answer to the first step."
            }
        }
        return invalid;
    }
    var q1_invalid = responseInvalid( category, 1, responses[0] );
    var q2_invalid = responseInvalid( category, 2, responses[1] );
    if ( q1_invalid || q2_invalid ) {
        return { "valid": false,
            "feedback": "Oops!\n\n" +
               ( q1_invalid ? q1_invalid + "\n\n" : "" ) +
               ( q2_invalid ? q2_invalid + "\n\n" : "" ) +
               ( "Please correct your response(s) and click 'Submit' again when you are done." ) };
    } else {
        return { "valid": true, "feedback": "" };
    }
}

// return an assoc array of form { "corrects": [x,x], "feedback": "xxx" }
function checkCorrectness( category, givens, keys, responses, prev_errors ) {
    function responseCorrect( number, key, response ) {
        if ( ( category=="Median" || category=="Mode" ) && number==1 ) {
            return parseAsIntList( response ).toString()==key;
        } else {
            return Math.abs( parseAsSingleNum( response ) - key ) <= 0.11 ;    // this standard is held over from previous exps
        }
    }
    var corrects = [
        responseCorrect( 1, keys[0], responses[0] ),
        responseCorrect( 2, keys[1], responses[1] ) ];
    var feedback;
    if ( corrects[0] && corrects[1] ) {
        // both solution steps answered correctly
        if ( givens[0] && givens[1] ) {
            // i.e. it is a passive trial, so give no feedback at all
            feedback = false;
        } else if ( givens[0] ) {
            // it is an intermediate trial with the first step given and second step answered correctly, so tell them they got it right
            feedback = "<p><img src='small-green-check-mark-th.png'>  " + " Great job! Your answer for the second step is correct! Click 'Continue' to go on.</p>";
        } else if ( givens[1] ) {
            // it is an intermediate trial with the second step given and first step answered correctly, so draw their attention to the appearance of the second step solution
            feedback = "<p><img src='small-green-check-mark-th.png'>  " + " Great job! Your answer for the first step is correct! The answer for the second step has been filled in - please read it before going on.</p>";
        } else {
            // active trial with no incorrect responses, so give correct feedback
            feedback = "<p><img src='small-green-check-mark-th.png'>  " + " Great job! All your answers are correct! Click 'Continue' to go on.</p>";
        }
    } else if ( prev_errors==0 ) {
        // active or intermediate trial, first incorrect submission, so they'll have to do it again
        feedback = "<p><img src='small-red-x-mark-th.png'>  " + " Oops!</p>";
        if ( !corrects[0] ) {
            feedback += {
                "Mean": "<p>Your answer for the first step is not correct. It should be the sum of all the numbers in the data set.</p>",
                "Median": "<p>Your answer for the first step is not correct. It should be the numbers in the data set, arranged in order from smallest to largest, separated by commas or spaces.</p>",
                "Mode": "<p>Your answer for the first step is not correct. It should be the numbers in the data set, arranged in order from smallest to largest, separated by commas or spaces.</p>"
                }[category];
        }
        if ( !corrects[1] ) {
            feedback += {
                "Mean": "<p>Your answer for the second step is not correct. It should be the answer to the first step divided by the number of numbers in the data set.</p>",
                "Median": "<p>Your answer for the second step is not correct. It should be the number which appears in the middle of the numbers in the answer to the first step.</p>",
                "Mode": "<p>Your answer for the second step is not correct. It should be the number which appears most commonly in the answer to the first step.</p>"
                }[category];
        }
        feedback += "<p>Please try again. The 'Submit' button will reactivate after a few moments.</p>";
    } else {
        // active or intermediate trial submitted incorrect for the second time, so the correct answers will be filled in for them
        feedback = "<p><img src='small-red-x-mark-th.png'>  " + " Oops!</p>";
        if ( givens[0] ) {
            // intermediate trial with first step given, so second step is incorrect
            feedback += "<p>Your answer for the second step is still incorrect.</p><p>The correct answer has been filled in for you - please read it before going on. ";
        } else if ( givens[1] ) {
            // intermediate trial with second step given, so first step is incorrect, and second step will be revealed for the first time
            feedback += "Your answer for the first step is still incorrect.</p><p>The correct answer has been filled in for you, and the answer to the second step has been filled in too - please read both steps before going on. ";
        } else if ( (!corrects[0])&&(!corrects[1]) ) {
            // active trial with both answers incorrect
            feedback += "<p>Your answers to both steps are still incorrect.</p><p>The correct answers have been filled in for you - please read them before going on. ";
        } else if ( !corrects[0] ) {
            // active trial with only first answer incorrect
            feedback += "Your answer for the first step is still incorrect.</p><p>The correct answer has been filled in for you - please read it before going on. ";
        } else if ( !corrects[1] ) {
            // active trial with only second answer incorrect
            feedback += "<p>Your answer for the second step is still incorrect.</p><p>The correct answer has been filled in for you - please read it before going on. ";
        }
        feedback += "The 'Continue' button will reactive after a delay.</p>";
    }
    return { "corrects": corrects, "feedback": feedback } ;
}

// try to interpret a string as a list of numbers, return the list if possible, false otherwise
function parseAsIntList( response ) {
    var parse = response.match( /[-+]?[0-9]*\.?[0-9]+/g );
    if ( parse==null ) {
        return false;
    } else {
        return parse;
    }
}

// try to interpret a string as a single number, return it if possible, false otherwise
function parseAsSingleNum( response ) {
    var parse = parseAsIntList( response );
    if ( parse===false ) {
        return false;
    } else if ( parse.length>1 ) {
        return false;
    } else {
        return parse[0];
    }
}


/* // Old getFeedback and doTrial retained temporarily for reference.
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
*/



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
