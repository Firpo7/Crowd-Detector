const { Client } = require('pg');
var APIconstants = require('./APIConstants').constants;

var knex = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.DBHOST,
    user : process.env.DBUSER,
    password : process.env.DBPASSWORD,
    database : process.env.DBNAME
  }
});

function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

function generateRandomID() {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}



function insertNewNodeDB(res, name, max_people, type, floor, building) {
  let publicID = generateRandomID()
  let privateID = generateRandomID()
  knex.insert({
    'public_id' : publicID,
    'private_id' : privateID,
    'name' : name,
    'maxpeople' : max_people,
    'floor' : floor,
    'roomtype' : type,
    'building' : building,
  }).into('sensor').then(() => {
    res.send({code: APIconstants.API_CODE_SUCCESS, id: privateID})
  }).catch((err) => {
    res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)
  })
}

function insertNewBuildingDB(res, name, address, numFloors) {
  knex.insert({
    'name' : name,
    'address' : address,
    'numfloors' : numFloors
  }).into('building').then(() => {
    res.send({code: APIconstants.API_CODE_SUCCESS})
  }).catch((err) => {
    res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)
  })
}

function deleteBuildingDB(res, name) {
  knex("building").where('name', name).del().then(() => {
    res.send({code: APIconstants.API_CODE_SUCCESS})
  }).catch((err) => {
    res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)
  })
}

function deleteNodeDB(res, private_id) {
  knex('sensor').where('private_id', private_id).del().then(() => {
    res.send({code: APIconstants.API_CODE_SUCCESS})
  }).catch((err) => {
    res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)
  })
}


function registerNewNodeController(req, res) {
  console.log(req.body)
  if( !( req.body.name && typeof(req.body.name)==='string' ) ||
      !( req.body.max_people && typeof(req.body.max_people)==='string' ) ||
      !( req.body.type && typeof(req.body.type)==='string' ) ||
      !( req.body.floor && typeof(req.body.floor)==='string' ) ||
      !( req.body.building && typeof(req.body.building)==='string' )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  insertNewNodeDB(res, req.body.name, req.body.max_people, req.body.type, req.body.floor, req.body.building)
}

function registerNewBuildingController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ||
      !( req.body.address && typeof(req.body.address)==='string' ) ||
      !( req.body.numFloors && typeof(req.body.numFloors)==='string' )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  insertNewBuildingDB(res, req.body.name, req.body.address, req.body.numFloors)
}

function deleteBuildingController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  deleteBuildingDB(res, req.body.name)
}

function deleteNodeController(req, res) {
  if( !( req.body.id && typeof(req.body.id)==='string' ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  deleteNodeDB(res, req.body.id)
}


function manageAdminRequests(req, res, callback) {
  let token = req.body.token
  if(!token) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return}

  knex.select('validity').from('token').where('token', token).then((rows) =>{
    if(!rows.length && new Date(rows[0].validity) < new Date()) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return }
      callback(req, res)
  })
}


exports.deleteNode = deleteNodeController;
exports.deleteBuilding = deleteBuildingController;
exports.registerNewNode = registerNewNodeController;
exports.registerNewBuilding = registerNewBuildingController;
exports.manageAdminRequests = manageAdminRequests;
