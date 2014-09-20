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
var GVIRS_NEW_PEOPLE_FILE = process.cwd() + '/NEW_GVIRS_PPL_TEST.csv';
var GVIRS_NB_MATCHES_FILE = process.cwd() + '/JOINED_TEST.csv';
var GVIRS_CONTACTS_FILE   = process.cwd() + '/western_vic_answered_2014-09-19.csv';

//get access token then strip away trailing newline char. i dunno why
var NB_TOKEN = fs.readFileSync(NB_ACCESS_TOKEN_FILE, {encoding:'utf-8'});
NB_TOKEN = NB_TOKEN.substring(0, NB_TOKEN.length - 1);

init();

function init() {
  //algo_design (not completed)
  //1. using custom query gvirs file (which contains contacts)
  //2. find all nationbuilder_ids 
  //   i)  matched=>update_person 
  //   ii) not matched=>create_person
  //3. create a list for them all
  //4. add a tag to each in list
  //5. attach contacts to all nationbuilder_ids
    
  var nb_ids = [
    1149870
  ];

  var gopherOptions = {
    'nb_token': NB_TOKEN,
    'nb_ids': nb_ids,
    'tag': 'SYNC_GVIRStoNB_personCreated_200914',
    'list' : {
      'list_name' : 'wv_der_test_1',
      'author_id': NB_ANDRE_ID
    }
  };
  var gopher = new Gopher(gopherOptions);
  gopher.createList(function (err, listObj) {
    if (err) throw err;
    console.log('CREATED list:');
    console.dir(listObj);

    addNewPeopleToNB({
      'listObj': listObj,
      'tag': 'SYNC_GVIRStoNB_personCreated_200914'
    });

  });
}

function addNewPeopleToNB(options) {
  //fs.readFile(GVIRS_NEW_PEOPLE_FILE, {encoding:'utf-8'}, function (err, data) {
  fs.readFile(GVIRS_CONTACTS_FILE, {encoding:'utf-8'}, function (err, data) {
    if (err) throw err;

    csv.parse(data, function (error, pData) {
      if (error) throw error;
      console.log('successfully parsed gvirs new people file');  
      //console.dir(pData[0]); //these are headers

      for (var i = 1; i <= 50; i++) {
        options['nb_token'] = NB_TOKEN;
        options['headers']  = pData[0];
        options['gvirsPerson'] = pData[i];
        options['person_method'] = 'POST';
	options['NB_ANDRE_ID'] = NB_ANDRE_ID
  
        var aPerson = new Person(options);
        aPerson.syncToNB();
      }
    });
  });
}


/*
//ppl already in NB to update
fs.readFile(GVIRS_NB_MATCHES_FILE, {encoding:'utf-8'}, function (err, data) {
  if (err) throw err;
  csv.parse(data, function (error, pData) {
    if (error) throw error;
    var nb_id = pData[0].indexOf('nationbuilder_id');
    console.log('successfully parsed gvirs nb matches file');  
    //console.dir(pData[0]);
    
    var nb_ids = _.reduce(pData, function (result, row) {
      result.push(row[0])
      return result;
    }, []);

    nb_ids = nb_ids.slice(1);
    //console.log(nb_ids);
    
    var listOptions = {
      'list_name': 'wv_der_test_1',
      'nb_ids': nb_ids,
      'tag' : 'wv_dre_yadda',
      'author_id' : 1149870
    };
    //createList(listOptions);
    //addTagToAllPeopleInList(5785, 'wv_dre_yadda_test');
    //deleteTagToAllPeopleInList(5785, 'wv_dre_yadda_test');
  });
});
*/
