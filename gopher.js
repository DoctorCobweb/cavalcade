'use strict';

var request = require('request');
var _ = require('lodash');

module.exports.Gopher = Gopher;

function Gopher (options) {
  var NB_TOKEN = options.nb_token;
  this.NB_BASE_URL = 'https://agv.nationbuilder.com/api/v1';
  this.NB_PEOPLE = '/people';
  this.NB_LISTS = '/lists';
  this.options = options;

  this.accessToken = function () {
    return NB_TOKEN;
  };

};

Gopher.prototype.getListUrl = function () {
  return (this.NB_BASE_URL + this.NB_LISTS);
};

Gopher.prototype.getAddPeopleToListUrl = function (list_id) {
  return (this.NB_BASE_URL + this.NB_LISTS + '/' + list_id + '/people');
};

Gopher.prototype.getAddTagsToListUrl = function (list_id) {
  return (this.NB_BASE_URL + this.NB_LISTS + '/' + list_id + '/tag/' + this.options.tag);
};

Gopher.prototype.getContactsUrl = function (person_id) {
  return (this.NB_BASE_URL + this.NB_PEOPLE + '/' + person_id + '/contacts');
};

Gopher.prototype.tagAll = function () {
  //TODO
  //create a new list
  //add nb_ids to list
  //add tags to all peopl in list

  this.createList();
};

Gopher.prototype.attachContacts = function () {
  //TODO
  console.log('TODO: Gopher attachContacts');
};

Gopher.prototype.createList = function (callback) {
  var newListBody = {
    'list': {
      'name': this.options.list.list_name,
      'slug': this.options.list.list_name,
      'author_id': this.options.list.author_id,
      'sort_order': 'oldest_first'
    }
  };
  var reqObjNewList = {
    url: this.getListUrl(),
    qs: {
      'access_token': this.accessToken()
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify(newListBody)
  };

  function cb (err, resp, body) {
    if (err) callback(err);
    if (resp.statusCode != 200) {
      var e=Error('ERR: Gopher.prototype.createList: resp.statusCode ' + resp.statusCode);
      callback(e);
    }
    callback(null, JSON.parse(body));
    //this.addPeopleToNewList(pBody);  
  };
  var cb_bound = cb.bind(this);
  request(reqObjNewList, cb_bound);
};

Gopher.prototype.addPeopleToNewList = function (pBody) {
  var addPeopleBody = {
    'people_ids': this.options.nb_ids 
  };
  var reqObjAddToList = {
    url: this.getAddPeopleToListUrl(pBody.list_resource.id),
    qs: {
      'access_token': this.accessToken() 
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    },
    body : JSON.stringify(addPeopleBody)
  };

  function cb (err, resp, body) {
    if (err) throw err;
    console.log(resp.statusCode);
    //body is a JSON string, we want an object.
    var lBody = JSON.parse(body);
    console.log('ADDED people to list:');
    console.log(lBody);
    this.tagAllInList(lBody.list_resource.id);
  }
  var cb_bound = cb.bind(this);
  request(reqObjAddToList, cb_bound);
};

Gopher.prototype.tagAllInList = function (list_id) {
  //nb recently made it easy to bulk add tag and bulk delete tags for many ppl.
  //it is base on lists so the api endpoints are:
  //
  //add :tag to all ppl in :listId
  //POST /lists/:listId/tag/:tag

  var reqObjAddTags = {
    url: this.getAddTagsToListUrl(list_id),
    qs: {
      'access_token': this.accessToken() 
    },
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept' :'application/json'
    }
  };

  function cb (err, resp, body) {
    if (err) throw err;
    console.log('NB should respond with a 204...');
    console.log(resp.statusCode);
    console.log('ADDED tag: ' + this.options.tag + ' to list: ' + list_id);
  }

  var cb_bound = cb.bind(this);
  request(reqObjAddTags, cb_bound);
};


Gopher.prototype.deleteTagToAllPeopleInList = function (list_id) {
  //nb recently made it easy to bulk add tag and bulk delete tags for many ppl.
  //it is base on lists so the api endpoints are:
  //
  //remove :tag from all ppl in :listId
  //DELETE /lists/:listId/tag/:tag
  
  var reqObjAddTags = {
    url: this.getAddTagsToListUrl(list_id), //same url as POST
    qs: {
      'access_token': this.accessToken() 
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
    console.log('DELETED the tag: ' + this.options.tag + ' for list_id: ' + list_id);
  });
};

Gopher.prototype.attachContactsToPerson = function (person_id) {
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
    url: this.getContactsUrl(),
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

  console.log('attaching a contact to person_id: ' + person_id);
  function cb(err, resp, body) {
    if (err) throw err;
    console.log('resp.statusCode: ' + resp.statusCode);
    //body is a JSON string, we want an object.
    var pBody = JSON.parse(body);
    console.log('CONTACT CREATED(' + person_id + '):');
    console.log(pBody);
  }
  var cb_bound = cb.bind(this);
  request(contactsObj, cb_bound);
};
