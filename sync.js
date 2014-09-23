'use strict';

/*
 *
 * gvirs to NB sync. create or update people in NB using contact data from gvirs.
 * -bring over contacts logged from gvirs and add them to people profiles in NB.
 *
 */

var fs = require('fs');
var request = require('request');
var csv = require('csv');
var _ = require('lodash');
var chalk = require('chalk');

var Person = require('./person').Person;
var Gopher = require('./gopher').Gopher;

var NB_INTERVAL = 1000;
var NB_TOKENS = [];
var NB_ANDRE_ID = 1149870;
var NB_ACCESS_TOKEN_FILE  = process.cwd() + '/.nb_tokens';
//var GVIRS_PANDAS_ANALYSED_FILE   = process.cwd() + '/gvirs_to_nb_PANDAS_OUT_210914.csv';
var GVIRS_PANDAS_ANALYSED_FILE   = process.cwd() 
  + '/gvirs_to_nb_PANDAS_OUT_210914_only_NOs.csv';

fs.readFile(NB_ACCESS_TOKEN_FILE, {encoding:'utf-8'}, function (err, data) {
  if (err) throw err;
  csv.parse(data, function (err, tData) {
    if (err) throw error;
    NB_TOKENS = _.flatten(tData);
    init();
  });
});


function init() {
  //algo_design (not completed)
  //1. using custom query gvirs file (which contains contacts)
  //2. find all nationbuilder_ids 
  //   i)  matched=>update_person 
  //   ii) not matched=>create_person
  //3. create a list for them all
  //4. add a tag to each in list
  //5. attach contacts to all nationbuilder_ids
    
  var gopherOptions = {
    'nb_token': NB_TOKENS[0],
    'nb_ids': [NB_ANDRE_ID],
    'tag': 'SYNC_GVIRStoNB_personCreated_220914',
    'list' : {
      'list_name' : 'wv_der_test_' + Math.floor(Math.random() * 1000),
      'author_id': NB_ANDRE_ID
    }
  };
  var gopher = new Gopher(gopherOptions);
  gopher.createList(function (err, listObj) {
    if (err) throw err;
    console.log('CREATED list:');
    console.dir(listObj);

    startSync({
      'listObj': listObj,
      'tag': 'SYNC_GVIRStoNB_wv'
    });
  });
}

function startSync(options) {
  fs.readFile(GVIRS_PANDAS_ANALYSED_FILE, {encoding:'utf-8'}, function (err, data) {
    if (err) throw err;

    csv.parse(data, function (error, pData) {
      if (error) throw error;
      console.log('successfully parsed gvirs pandas analysed file');  
      //console.dir(pData[0]); //these are headers

      var actualTokenIndex = 0;
      var totalNumberOfPpl = pData.length - 1;

      indivCall(1);
  
      function indivCall(index) {
        if (index === totalNumberOfPpl) {
          return;	
	} else {
          setTimeout(littleCall, NB_INTERVAL);	
	} 
      
	function littleCall() {
          if (index % 60 === 0) {
  	    actualTokenIndex++;

	    var logString = '*** switching tokens *** =====> ' + 'actualTokenIndexl: ' 
	      + actualTokenIndex;
  	    console.log(chalk.red(logString));

  	    if (actualTokenIndex === NB_TOKENS.length) {
  	      throw error('ran out of tokens. you need to add more to .nb_tokens file'); 
  	    }
  	  }
          options['nb_token']      = NB_TOKENS[actualTokenIndex];
          options['headers']       = pData[0];
          options['gvirsPerson']   = pData[index];
  	  options['NB_ANDRE_ID']   = NB_ANDRE_ID;
  	  options['syncDate']      = '23_SEPT_2014';
	  options['instance_no']   = index;
    
          var aPerson = new Person(options);
          aPerson.syncToNB();

	  return indivCall(index + 1); 
	}
      }
    });
  });
}
