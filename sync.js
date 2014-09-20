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
var Person = require('./person').Person;
var Gopher = require('./gopher').Gopher;

var NB_ANDRE_ID = 1149870;
var NB_ACCESS_TOKEN_FILE  = process.cwd() + '/.nb_tokens';
//var GVIRS_NEW_PEOPLE_FILE = process.cwd() + '/NEW_GVIRS_PPL_TEST.csv';
//var GVIRS_NB_MATCHES_FILE = process.cwd() + '/JOINED_TEST.csv';
var GVIRS_CONTACTS_FILE   = process.cwd() + '/western_vic_answered_2014-09-19.csv';
var GVIRS_PANDAS_ANALYSED_FILE   = process.cwd() + '/gvirs_analysed_file_200914.csv';

//get access token then strip away trailing newline char. i dunno why
//var NB_TOKEN = fs.readFileSync(NB_ACCESS_TOKEN_FILE, {encoding:'utf-8'});
//NB_TOKEN = NB_TOKEN.substring(0, NB_TOKEN.length - 1);
var NB_TOKENS = [];

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
    'tag': 'SYNC_GVIRStoNB_personCreated_200914',
    'list' : {
      'list_name' : 'wv_der_test_3',
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
      'tag': 'SYNC_GVIRStoNB_personCreated_200914'
    });
  });
}

function startSync(options) {
  //fs.readFile(GVIRS_NEW_PEOPLE_FILE, {encoding:'utf-8'}, function (err, data) {
  //fs.readFile(GVIRS_CONTACTS_FILE, {encoding:'utf-8'}, function (err, data) {
  fs.readFile(GVIRS_PANDAS_ANALYSED_FILE, {encoding:'utf-8'}, function (err, data) {
    if (err) throw err;

    csv.parse(data, function (error, pData) {
      if (error) throw error;
      console.log('successfully parsed gvirs pandas analysed file');  
      //console.dir(pData[0]); //these are headers

      var actualTokenIndex = 0;
      //for (var i = 1; i <= pData.length; i++) {
      for (var i = 1; i <= 1; i++) {
        if (i % 200 === 0) {
	  actualTokenIndex++;
	  if (actualTokenIndex === NB_TOKENS.length) {
	    throw Error('ran out of tokens. you need to add more to .nb_tokens file'); 
	  }
	}
	console.log(NB_TOKENS[actualTokenIndex]);
        options['nb_token']      = NB_TOKENS[actualTokenIndex];
        options['headers']       = pData[0];
        options['gvirsPerson']   = pData[i];
        options['person_method'] = 'POST';
	options['NB_ANDRE_ID']   = NB_ANDRE_ID
  
        var aPerson = new Person(options);
        aPerson.syncToNB();
      }
    });
  });
}
