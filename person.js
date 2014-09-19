'use strict';

var request = require('request');
var _ = require('lodash');

module.exports.Person = Person;

function Person (options) {
  var NB_TOKEN = options.nb_token;
  this.NB_BASE_URL = 'https://agv.nationbuilder.com/api/v1';
  this.NB_PEOPLE = '/people';
  this.NB_LISTS = '/lists';
  this.headers = options.headers;
  this.pDetails = options.pDetails;
  this.gIndexes = {};
  this.pDetailsNB = {};
  this.nationbuilder_id;

  this.accessToken = function () {
    return NB_TOKEN;
  };
};

Person.prototype.createPerson = function () {
  this.gvirsIndexes();
  this.makeNBDetails();
  this.createPersonOnNB();
};

Person.prototype.getPeopleUrl = function () {
  return (this.NB_BASE_URL + this.NB_PEOPLE);
};

Person.prototype.gvirsIndexes = function () {
  this.gIndexes.firstNameIdx = this.headers.indexOf('first_name');
  this.gIndexes.otherNamesIdx = this.headers.indexOf('other_names');
  this.gIndexes.surnameIdx = this.headers.indexOf('surname');
  this.gIndexes.dobIdx = this.headers.indexOf('dob');
  this.gIndexes.phoneNumsIdx = this.headers.indexOf('phone_numbers');
  this.gIndexes.genderIdx = this.headers.indexOf('gender');
  this.gIndexes.combStreetAddIdx = this.headers.indexOf('combined_street_address');
  this.gIndexes.flatNumIdx = this.headers.indexOf('flat_no');
  this.gIndexes.localityIdx = this.headers.indexOf('locality');
  this.gIndexes.postcodeIdx = this.headers.indexOf('postcode');
  this.gIndexes.stateIdx = this.headers.indexOf('state');
  this.gIndexes.elecStateUpperIdx = this.headers.indexOf('custom_uh_region');
  this.gIndexes.elecStateLowerIdx = this.headers.indexOf('custom_lh_district');
  this.gIndexes.elecFedIdx = this.headers.indexOf('custom_fed_elect');
  this.gIndexes.lgaIdx = this.headers.indexOf('local_gov_area');
  this.gIndexes.customTargetIdx = this.headers.indexOf('custom_target');
  this.gIndexes.emailIdx = this.headers.indexOf('email');
};

Person.prototype.makeNBDetails = function () {
  var extractedPhoneNum = '';
  var phoneField = this.pDetails[this.gIndexes.phoneNumsIdx];

  if (phoneField.indexOf('"') !== -1) {
    //if there's quotation marks then there should be a phonenumber present 
    //find the indexes of first two quotation marks. the phonenumber is inbetween.
    //current method ignores multiple phone numbers. 

    var firstQuotationIdx = phoneField.indexOf('"');
    var secondQuotationIdx = phoneField.indexOf('"', firstQuotationIdx + 1);
    extractedPhoneNum = phoneField.substring(firstQuotationIdx + 1, secondQuotationIdx);
    extractedPhoneNum = extractedPhoneNum.split(' ').join('');
  }

  var personData = {
      'first_name': this.pDetails[this.gIndexes.firstNameIdx], 
      'middle_name': this.pDetails[this.gIndexes.otherNamesIdx], 
      'last_name': this.pDetails[this.gIndexes.surnameIdx], 
      'birthdate': this.pDetails[this.gIndexes.dobIdx],
      'email': this.pDetails[this.gIndexes.emailIdx], 
      'mobile': extractedPhoneNum, 
      'sex': this.pDetails[this.gIndexes.genderIdx],
      'registered_address' : {
        'address1': this.pDetails[this.gIndexes.combStreetAddIdx],
        'address2': this.pDetails[this.gIndexes.flatNumIdx],
        'city': this.pDetails[this.gIndexes.localityIdx],
        'state': this.pDetails[this.gIndexes.stateIdx].toUpperCase(),
        'zip': this.pDetails[this.gIndexes.postcodeIdx] 
      },
      'electorate_state_upper': this.pDetails[this.gIndexes.elecStateUpperIdx],
      'electorate_state_lower': this.pDetails[this.gIndexes.elecStateLowerIdx],
      'electorate_federal': this.pDetails[this.gIndexes.elecFedIdx], 
      'lga': this.pDetails[this.gIndexes.lgaIdx],
      'custom_target': this.pDetails[this.gIndexes.customTargetIdx]
    };

  this.pDetailsNB.person = personData;
};


Person.prototype.createPersonOnNB = function () {
  var peopleObj = {
    url: this.getPeopleUrl(),
    qs: {
      'access_token': this.accessToken()
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify(this.pDetailsNB)
  };

  function cb (err, resp, body) {
    if (err) throw err;
    console.log('resp.statusCode: ' + resp.statusCode);
    //body is a JSON string, we want an object.
    var pBody = JSON.parse(body);
    console.log('CREATED (' + pBody.person.id + '): ' + pBody.person.first_name 
      + ' ' + pBody.person.last_name);
    //addATagToAPerson(pBody.person.id, 'SYNC_GVIRStoNB_person_created_190914', i);
    this.nationbuilder_id = pBody.person.id;
    this.tagPerson();
  }
  var cb_bound = cb.bind(this);
  request(peopleObj, cb_bound);
}

Person.prototype.tagPerson = function () {
  //TODO
  console.log('TODO: tagPerson()');
};

/*
Person.prototype.attachContactsToPerson = function () {
  var contactsUrl = NB_BASE_URL + NB_PEOPLE + '/' + person_id + '/contacts';

  var cTypes = {
    'Volunteer recruitment': 6,
    'Supporter Event Invitation': 21,
    'Voter persuasion': 14,
    'Volunteer intake': 2,
    'Donation thank-you': 15,
    'Donation request': 16,
    'Event confirmation': 17,
    'Event debrief': 18,
    'Meeting 1:1': 19,
    'Inbox response': 1,
    'Voter outreach election': 13,
    'Voter outreach issue': 4
  };											      
  var cMethods = {
    'Delivery': 'delivery', 
    'Door knock': 'door_knock',
    'Email': 'email',
    'Email blast': 'email_blast',
    'Face to face': 'face_to_face',
    'Facebook': 'facebook',
    'Meeting': 'meeting',
    'Phone call': 'phone_call',
    'Robocall': 'robocall',
    'Snail mail': 'snail_mail',
    'Text': 'text',
    'Text blast': 'text_blast',
    'Tweet': 'tweet',
    'Video call': 'video_call',
    'Webinar': 'webinar',
    'LinkedIn': 'linkedin',
    'other': 'other'
  };


  var cStatuses = {
    'Answered': 'answered',
    'Bad info': 'bad_info',
    'Inaccessible': 'inaccessible',
    'Left message': 'left_message',
    'Meaningful interaction': 'meaningful_interaction',
    'Not interested': 'not_interested',
    'No answer': 'no_answer',
    'Refused': 'refused',
    'Send information': 'send_information',
    'other': 'other'
  };

  var contactData = {
    'contact': {
      'sender_id': 1149870,
      'status': cStatuses['Answered'],
      'method': cMethods['Door knock'],
      'type_id': cTypes['Voter outreach election'],
      'note': 'SYNC_1: this is a TEST for SYNC_gVIRS->NB door knock contact' 
    }
  };

  var contactsObj = {
    url: contactsUrl,
    qs: {
      'access_token': NB_TOKEN
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify(contactData)
  };

  console.log('attaching a contact to person_id: ' + person_id);

  request(contactsObj, function (err, resp, body) {
    if (err) throw err;
    console.log('resp.statusCode: ' + resp.statusCode);
    //body is a JSON string, we want an object.
    var pBody = JSON.parse(body);
    console.log('CONTACT CREATED(' + person_id + '):');
    console.log(pBody);
  });
}
*/

/*
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
    createList(listOptions);
    //addTagToAllPeopleInList(5785, 'wv_dre_yadda_test');
    //deleteTagToAllPeopleInList(5785, 'wv_dre_yadda_test');
  });
});


function createList(options) {
  var new_list_url = NB_BASE_URL + NB_LISTS;
  var newListBody = {
    'list': {
      'name': options.list_name,
      'slug': options.list_name,
      'author_id': options.author_id,
      'sort_order': 'oldest_first'
    }
  };
  var reqObjNewList = {
    url: new_list_url,
    qs: {
      'access_token': NB_TOKEN
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify(newListBody)
  };

  request(reqObjNewList, function (err, resp, body) {
    if (err) throw err;
    console.log(resp.statusCode);
    //body is a JSON string, we want an object.
    var pBody = JSON.parse(body);
    console.log('CREATED new list:');
    console.log(pBody);

    addPeopleToNewList(pBody, options);  
  });
}

function addPeopleToNewList(pBody, options) {
  //using id of newly created list now add ppl to it using their nationbuilder_id
  var addToListUrl = NB_BASE_URL + NB_LISTS + '/' + pBody.list_resource.id + '/people';
  var addPeopleBody = {
    'people_ids': options.nb_ids 
  };
  var reqObjAddToList = {
    url: addToListUrl,
    qs: {
      'access_token': NB_TOKEN
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify(addPeopleBody)
  };

  request(reqObjAddToList, function (err, resp, body) {
    if (err) throw err;
    console.log(resp.statusCode);
    //body is a JSON string, we want an object.
    var lBody = JSON.parse(body);
    console.log('ADDED people to list:');
    console.log(lBody);

    //addTagToAllPeopleInList(lBody.list_resource.id, options);
  });
}

function addTagToAllPeopleInList(list_id, options) {
  //nb recently made it easy to bulk add tag and bulk delete tags for many ppl.
  //it is base on lists so the api endpoints are:
  //
  //add :tag to all ppl in :listId
  //POST /lists/:listId/tag/:tag
  //
  //remove :tag from all ppl in :listId
  //DELETE /lists/:listId/tag/:tag
  //
  //add :tag to all ppl in :listId
  //POST /lists/:listId/tag/:tag
  //
  var addTagsUrl = NB_BASE_URL + NB_LISTS + '/' + list_id + '/tag/' + options.tag;

  var reqObjAddTags = {
    url: addTagsUrl,
    qs: {
      'access_token': NB_TOKEN
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    }
  };

  request(reqObjAddTags, function (err, resp, body) {
    if (err) throw err;
    console.log('NB should respond with a 204...');
    console.log(resp.statusCode);
    console.log('ADDED tag: ' + options.tag + 'to list: ' + list_id);
  });
}


function deleteTagToAllPeopleInList(list_id, options) {
  //nb recently made it easy to bulk add tag and bulk delete tags for many ppl.
  //it is base on lists so the api endpoints are:
  //remove :tag from all ppl in :listId
  //DELETE /lists/:listId/tag/:tag
  
  var addTagsUrl = NB_BASE_URL + NB_LISTS + '/' + list_id + '/tag/' + options.tag;
  var reqObjAddTags = {
    url: addTagsUrl,
    qs: {
      'access_token': NB_TOKEN
    },
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    }
  };

  request(reqObjAddTags, function (err, resp, body) {
    if (err) throw err;
    console.log('NB should respond with a 204...');
    console.log(resp.statusCode);
    console.log('DELETED the tag: ' + options.tag + ' for list_id: ' + list_id);
  });
}




//OLDER INDIVIDUAL STUFF
function tagsForPerson(person_id) {
  var taggings_url = NB_BASE_URL + NB_PEOPLE + '/' + person_id + '/taggings';
  console.log(taggings_url);

  var reqObj = {
    url: taggings_url,
    qs: {
      'access_token': NB_TOKEN
    },
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    }
  };
  request(reqObj, function (err, resp, body) {
    if (err) throw err;
    console.log(resp.statusCode);
    console.log(body);
  });
}

function addATagToAPerson(person_id, tag, i) {
  var taggings_url = NB_BASE_URL + NB_PEOPLE + '/' + person_id + '/taggings';
  var reqObjPost = {
    url: taggings_url,
    qs: {
      'access_token': NB_TOKEN
    },
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify({
      'tagging': {'tag': tag}
    })
  };
  request(reqObjPost, function (err, resp, body) {
    if (err) throw err;
    console.log('response: ' + resp.statusCode);
    console.log(i + '. TAGGED (' + person_id + '): ' + tag);
    //console.log(body);
  });
}
*/
