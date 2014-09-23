'use strict';

var request = require('request');
var _ = require('lodash');
var chalk = require('chalk');

module.exports.Person = Person;

function Person (options) {
  var NB_TOKEN = options.nb_token;
  this.NB_ANDRE_ID = options.NB_ANDRE_ID;
  this.NB_BASE_URL = 'https://agv.nationbuilder.com/api/v1';
  this.NB_PEOPLE = '/people';
  this.NB_LISTS = '/lists';
  this.headers = options.headers;
  this.gvirsPerson = options.gvirsPerson;
  this.NBPerson = {};
  this.gIndexes = {};
  this.nationbuilder_id;
  this.listObj = options.listObj;
  this.tag = options.tag;
  this.person_method;
  this.syncDate = options.syncDate;
  this.iNo = options.instance_no;

  this.accessToken = function () {
    return NB_TOKEN;
  };

  //do some initial setup
  this.gvirsIndexes();
  this.makeNBDetails();
};

Person.prototype.getPeopleUrl = function () {
  return (this.NB_BASE_URL + this.NB_PEOPLE);
};

Person.prototype.getAddPersonToListUrl = function () {
  var url = this.NB_BASE_URL + this.NB_LISTS + '/' + this.listObj.list_resource.id 
    + '/people'; 
  return url;
};

Person.prototype.getAddContactUrl = function () {
  return (this.NB_BASE_URL + this.NB_PEOPLE + '/' + this.nationbuilder_id + '/contacts');
};

Person.prototype.getTaggingsUrl = function () {
  return (this.NB_BASE_URL + this.NB_PEOPLE + '/' + this.nationbuilder_Id + '/taggings');
};

Person.prototype.syncToNB = function () {
  this.gIndexes.hasNBMatchIdx = this.headers.indexOf('has_nb_match');
  this.gIndexes.nationbuilderIdIdx = this.headers.indexOf('nationbuilder_id');

  //there's no use logging an empty contact so skip everything if so.
  if (this.isContactEmpty()) {
    var contact_id = this.gvirsPerson[this.gIndexes.gvirsContactIdIdx];
    console.log(this.iNo + ' EMPTY CONTACT. ABORT EVERYTHING for GVIRS contact_id:' 
		+ contact_id);
    return;
  }

  if (this.gvirsPerson[this.gIndexes.hasNBMatchIdx] === 'NO') {
    this.person_method = 'POST'; 
    this.createPersonOnNB(); 
  }
  if (this.gvirsPerson[this.gIndexes.hasNBMatchIdx] === 'YES') {
    var nbIdInteger = parseInt(this.gvirsPerson[this.gIndexes.nationbuilderIdIdx], 10);
    this.person_method = 'PUT';
    this.nationbuilder_id = nbIdInteger;
    this.updatePersonOnNB(); 
  }
};

Person.prototype.updatePersonOnNB = function () {
  //atm don't update person details record on NB
  //only add them to list and attach the contact to their profile

  if (this.isANbContactAlreadyAttached()) {
    console.log(this.iNo + ' this.nationbuilder_Id: ' + this.nationbuilder_id 
		+ ' ALREADY IN NB & HAS THIS CONTACT LOGGED.Skip.');
    return; 
  } else {
    var bound_cb = cb.bind(this);
    this.tagPerson(bound_cb);
  }

  function cb (err, tagResp) {
    if (err) throw err;
    console.log(this.iNo + ' person already on NB. tagging..');
    console.log(this.iNo + ' TAGGED. this.nationbuilder_id: ' + this.nationbuilder_id);
    this.addPersonToList();
  }
};

Person.prototype.isContactEmpty = function () {
  var cNoteVal   = this.gvirsPerson[this.gIndexes.contactNoteIdx];
  if (!cNoteVal) {
    return true;
  } else {
    return false; 
  }
};

Person.prototype.isANbContactAlreadyAttached = function () {
  //now if we have a nationbuilder contact for a matched person in NB
  //=> we get a circular import.
  //the person in NB already exists AND has that contact logged
  //we should find this string at the START of cNoteVal
  var cNoteVal   = this.gvirsPerson[this.gIndexes.contactNoteIdx];
  var aNBContact = cNoteVal.indexOf('Imported from nationbuilder instance \'agv\'');
  if (this.person_method === 'PUT' && aNBContact === 0) {
    return true;
  } else {
    return false; 
  }
};

Person.prototype.tagPerson = function (callback) {
  var tagObj = {
    url: this.getTaggingsUrl(),
    qs: {
      'access_token': this.accessToken()
    },
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify({
      'tagging': {'tag': this.tag}
    })
  };
  function cb (err, resp, body) {
    if (err) throw err;
      callback(null, JSON.parse(body))
  }
  var cb_bound = cb.bind(this);
  request(tagObj, cb_bound);
};
  
Person.prototype.gvirsIndexes = function () {
  this.gIndexes.firstNameIdx = this.headers.indexOf('first_name');
  this.gIndexes.otherNamesIdx = this.headers.indexOf('other_names');
  this.gIndexes.surnameIdx = this.headers.indexOf('surname');
  this.gIndexes.dobIdx = this.headers.indexOf('dob');
  this.gIndexes.genderIdx = this.headers.indexOf('sex');
  this.gIndexes.combStreetAddIdx = this.headers.indexOf('combined_street_address');
  this.gIndexes.flatNumIdx = this.headers.indexOf('flat_no');
  this.gIndexes.localityIdx = this.headers.indexOf('locality_name');
  this.gIndexes.postcodeIdx = this.headers.indexOf('postcode');
  this.gIndexes.stateIdx = this.headers.indexOf('state_abbreviation');
  this.gIndexes.contactDateIdx = this.headers.indexOf('contact_date');
  this.gIndexes.contactStatusIdx = this.headers.indexOf('contact_status_name');
  this.gIndexes.contactMethodIdx = this.headers.indexOf('contact_method_name');
  this.gIndexes.contactNoteIdx = this.headers.indexOf('notes');
  this.gIndexes.supportLevelIdx = this.headers.indexOf('support_level');
  this.gIndexes.contactDateIdx = this.headers.indexOf('contact_date');
  this.gIndexes.gvirsContactIdIdx = this.headers.indexOf('contact_id');
  //TODO: custom contact csv
  //need this in contacts csv. 
  //this.gIndexes.phoneNumsIdx = this.headers.indexOf('phone_numbers');
  //this.gIndexes.elecStateUpperIdx = this.headers.indexOf('custom_uh_region');
  //this.gIndexes.elecStateLowerIdx = this.headers.indexOf('custom_lh_district');
  //this.gIndexes.elecFedIdx = this.headers.indexOf('custom_fed_elect');
  //this.gIndexes.lgaIdx = this.headers.indexOf('local_gov_area');
  //this.gIndexes.customTargetIdx = this.headers.indexOf('custom_target');
  //this.gIndexes.emailIdx = this.headers.indexOf('email');
};

Person.prototype.makeNBDetails = function () {
  var supportLevel;

  //TODO: custom contact csv
  /*
  var extractedPhoneNum = '';
  var phoneField = this.gvirsPerson[this.gIndexes.phoneNumsIdx];

  if (phoneField.indexOf('"') !== -1) {
    //if there's quotation marks then there should be a phonenumber present 
    //find the indexes of first two quotation marks. the phonenumber is inbetween.
    //current method ignores multiple phone numbers. 

    var firstQuotationIdx = phoneField.indexOf('"');
    var secondQuotationIdx = phoneField.indexOf('"', firstQuotationIdx + 1);
    extractedPhoneNum = phoneField.substring(firstQuotationIdx + 1, secondQuotationIdx);
    extractedPhoneNum = extractedPhoneNum.split(' ').join('');
  }
  */

  //gvirs and NB support level mismatch.
  //gvirs(0) => NB(null)
  if (this.gvirsPerson[this.gIndexes.supportLevelIdx] !== 0) {
    supportLevel = this.gvirsPerson[this.gIndexes.supportLevelIdx];
  }

  this.NBPerson.person = {
      'first_name': this.gvirsPerson[this.gIndexes.firstNameIdx], 
      'middle_name': this.gvirsPerson[this.gIndexes.otherNamesIdx], 
      'last_name': this.gvirsPerson[this.gIndexes.surnameIdx], 
      'birthdate': this.gvirsPerson[this.gIndexes.dobIdx],
      'sex': this.gvirsPerson[this.gIndexes.genderIdx],
      'registered_address' : {
        'address1': this.gvirsPerson[this.gIndexes.combStreetAddIdx],
        'address2': this.gvirsPerson[this.gIndexes.flatNumIdx],
        'city': this.gvirsPerson[this.gIndexes.localityIdx],
        'state': this.gvirsPerson[this.gIndexes.stateIdx].toUpperCase(),
        'zip': this.gvirsPerson[this.gIndexes.postcodeIdx] 
      },
      //TODO: custom contact csv
      //'email': this.gvirsPerson[this.gIndexes.emailIdx], 
      //'mobile': extractedPhoneNum, 
      //'custom_target': this.gvirsPerson[this.gIndexes.customTargetIdx],
      //'electorate_state_upper': this.gvirsPerson[this.gIndexes.elecStateUpperIdx],
      //'electorate_state_lower': this.gvirsPerson[this.gIndexes.elecStateLowerIdx],
      //'electorate_federal': this.gvirsPerson[this.gIndexes.elecFedIdx], 
      //'lga': this.gvirsPerson[this.gIndexes.lgaIdx],
      'tags': [this.tag],
      'support_level' : supportLevel 
    };
};


Person.prototype.createPersonOnNB = function () {
  var contact_id = this.gvirsPerson[this.gIndexes.gvirsContactIdIdx];
  console.log(this.iNo + ' createPersonOnNB for contact_id: ' + contact_id);

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
    body : JSON.stringify(this.NBPerson)
  };

  function cb (err, resp, body) {
    if (err) throw err;
    if (resp.statusCode !== 201) throw Error('create person resp: ' + resp.statusCode);
    var pBody = JSON.parse(body);
    var logString = this.iNo +  ' CREATED (' + pBody.person.id + '): ' 
      + pBody.person.first_name + ' ' + pBody.person.last_name 
      + ' for gvirs contact_id: ' + contact_id;
    console.log(chalk.blue(logString));
    
    //IMPORTANT: now we have successfully create a new NB person we MUST set their
    //nationbuilder_id for this person instance
    this.nationbuilder_id = pBody.person.id;
    this.addPersonToList();
  }
  var cb_bound = cb.bind(this);
  request(peopleObj, cb_bound);
}

Person.prototype.addPersonToList = function () {
  var body = {
    'people_ids': [this.nationbuilder_id] 
  };
  var addToListObj = {
    url: this.getAddPersonToListUrl(), 
    qs: {
      'access_token': this.accessToken()
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body: JSON.stringify(body)
  };

  function cb (err, resp, body) {
    if (err) throw err;
    if (resp.statusCode !== 200) throw Error('add person list resp: ' + resp.statusCode);
    var pBody = JSON.parse(body);
    console.log(this.iNo + ' ADDED PERSON ' + this.nationbuilder_id + ' TO LIST: ' 
      + pBody.list_resource.id);
    this.attachContactToPerson();
  }
  var cb_bound = cb.bind(this);
  request(addToListObj, cb_bound);
};

Person.prototype.attachContactToPerson = function () {
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

  //NB status API.
  /*
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
    'other': 'other',
    'Busy': 'other' //NB does not have Busy but gvirs does => default it to 'other'
  };
  */

  //NOTE: nomenclature in gvirs is different to NB. therefore, this will look unmatched
  //gvirs(answered)-> nb(meaningful_interaction)
  //gvirs(busy)-> nb(answered)
  //ask lloyd davies for further info if need be
  var cStatuses = {
    'Answered': 'meaningful_interaction',
    'Busy': 'answered' //NB does not have Busy but gvirs does => default it to 'other'
  };

  var cStatusVal = this.gvirsPerson[this.gIndexes.contactStatusIdx];
  var cMethodVal = this.gvirsPerson[this.gIndexes.contactMethodIdx];
  var cNoteVal   = this.gvirsPerson[this.gIndexes.contactNoteIdx];
  var cDate      = new Date(this.gvirsPerson[this.gIndexes.contactDateIdx]);

  if (cStatusVal === 'Busy') {
    cNoteVal = 'Busy. ' + cNoteVal;
  }
  cNoteVal = '[.::SYNC::.::gVIRS->NB::.::' + this.syncDate + '::.] =====> ' 
	     + ' [.::gVIRS_CONTACT_DATE::.] = ' 
	     + this.gvirsPerson[this.gIndexes.contactDateIdx]
	     + ' [.::gVIRS_CONTACT_ID::.] = '
             + this.gvirsPerson[this.gIndexes.gvirsContactIdIdx]
	     + ' [.::gVIRS_NOTE::.] = ' + cNoteVal;

  var contactData = {
    'contact': {
      //TODO: change to data_entry person's id, not mine for all contacts
      'sender_id': this.NB_ANDRE_ID,
      'status': cStatuses[cStatusVal],
      'method': cMethods[cMethodVal],
      'type_id': cTypes['Voter outreach election'],
      'note': cNoteVal 
    }
  };

  var contactsObj = {
    url: this.getAddContactUrl(),
    qs: {
      'access_token': this.accessToken()
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify(contactData)
  };

  console.log(this.iNo + ' attaching a contact to person_id: ' + this.nationbuilder_id);

  request(contactsObj, function (err, resp, body) {
    if (err) throw err;
    var pBody = JSON.parse(body);
    var logString = this.iNo + ' resp.statusCode: ' + resp.statusCode 
      + '. CONTACT CREATED:';
    console.log(chalk.green(logString));
    console.log(pBody);
  });
}
