

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var mQ = require(root + '/ast2MQuery.js');
var SentenceParser = require(root + '/sentenceparser.js');


var debug = require('debug')('ast2MQuery');
const Model = require('fdevsta_monmove').Model;

var theModel = Model.loadModels();

var words = {};

exports.testGetCategoryForNodePairEasy = function(test) {
  var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
  var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
  var u = r.asts[0];
  debug(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
  debug(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
  var nodeCat = u.children[1].children[0].children[0];
  var nodeFact = u.children[1].children[0].children[1];
  var cat = mQ.getCategoryForNodePair(nodeCat, nodeFact,  r.sentences[0]);
  test.equals(cat, 'ApplicationComponent');
  test.done();
};

exports.testGetCategoryForNodePairNoCat = function(test) {
  var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
  var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
  var u = r.asts[0];
  debug(JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
  debug(JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
  var nodeCat = u.children[1].children[2].children[0];
  var nodeFact = u.children[1].children[2].children[1];
  var cat = mQ.getCategoryForNodePair(nodeCat, nodeFact,  r.sentences[0]);
  test.equals(cat, 'TechnicalCatalog');
  test.done();
};


exports.testGetCategoryForNodeOk = function(test) {
  var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
  var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
  var u = r.asts[0];
  debug(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
  debug(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
  var nodeCat = u.children[1].children[0].children[0];
  var cat =  mQ.getCategoryForNode(nodeCat,  r.sentences[0]);
  test.equals(cat, 'ApplicationComponent');
  test.done();
};



exports.testGetCategoryForNodeThrows = function(test) {
  var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
  var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
  var u = r.asts[0];
  debug(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
  debug(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
  var nodeCat = u.children[1];
  try {
    mQ.getCategoryForNode(nodeCat,  r.sentences[0]);
    test.equals(0,1);
  } catch(e) {
    test.equals(1,1);
  }
  test.done();
};


exports.testAstToMQuerySentenceToAstsCatCatCatParseText = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
  var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
  var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
  var node = r.asts[0];
  var nodeFieldList = node.children[0].children[0];
  var nodeFilter = node.children[1];
  var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], theModel);
  test.deepEqual(match , { $match : { ApplicationComponent : 'CO-FIO', appId : 'W0052', 'TechnicalCatalog' : 'SAP_TC_FIN_CO_COMMON' }});
  var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, r.sentences[0], theModel);
  test.deepEqual(proj , { $project: { _id: 0, SemanticObject : 1, SemanticAction : 1, BSPName : 1, ApplicationComponent : 1 }});
  var group = mQ.makeMongoGroupFromAst(nodeFieldList, r.sentences[0], theModel);
  test.deepEqual(group , { $group: {
    _id:  { SemanticObject : '$SemanticObject', SemanticAction : '$SemanticAction', BSPName : '$BSPName' , ApplicationComponent : '$ApplicationComponent' }
    ,
    SemanticObject :{ $first: '$SemanticObject'}, SemanticAction : { $first: '$SemanticAction'}, BSPName : { $first: '$BSPName'} , ApplicationComponent : { $first: '$ApplicationComponent'}
  }});
  test.done();
};

exports.testMakeProjection = function (test) {
  var proj  = mQ.makeMongoProjection(
    ['BSPName', 'AppKey']);
  test.deepEqual(proj,{
    '$project': { _id: 0, BSPName : 1, AppKey : 1 }
  }
  , ' projection');
  test.done();
};

exports.testMakeMatch = function (test) {
  var proj  = mQ.makeMongoMatchF(
    [{
      cat : 'BSPName',
      value : 'CPM_REUSE_MS1'
    }]);
  test.deepEqual(proj,   {
    $match: {
      BSPName : 'CPM_REUSE_MS1' }}
    , ' match');
  test.done();
};



exports.testMakeQuery = function (test) {
  var query  = mQ.makeMongoQuery(
    [{
      cat : 'BSPName',
      value : 'CPM_REUSE_MS1'
    }],
    ['BSPName', 'AppKey']
  );

  test.deepEqual(query,[
    { '$match': { BSPName: 'CPM_REUSE_MS1' } },
    { '$group': { _id: { BSPName : '$BSPName', AppKey : '$AppKey'},
      BSPName: '$BSPName', AppKey: '$AppKey' } },
    { '$project': {
      _id: 0, BSPName : 1, AppKey : 1 }}
  ], ' abc');
  test.done();
};

exports.testMakeMongoReverseMapFromAst = function (test) {
  var s = 'object name';
  var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
  var u = r.asts[0].children[0].children[0];
  var reverseMap = mQ.makeMongoColumnsFromAst(u,r.sentences[0],theModel);
  test.deepEqual(reverseMap,  { columns: ['object name'], reverseMap :{ 'object_name' : 'object name' }});
  test.done();
};
