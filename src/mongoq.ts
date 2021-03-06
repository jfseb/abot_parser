'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance

import { ErBase as ErBase, Sentence as Sentence, IFErBase as IFErBase } from 'abot_erbase';
import { IFModel as IFModel , Model as Model} from 'fdevsta_monmove';

import * as debug from 'debug';

const debuglog = debug('mongoq');

import * as chevrotain from 'chevrotain';
import * as AST from './ast';

import { ASTNodeType as NT} from './ast';

  var createToken = chevrotain.createToken;
  var Lexer = chevrotain.Lexer;
  var Parser = chevrotain.Parser;



import * as mongoose from 'mongoose';

import * as process from 'process';

process.on(

    "unhandledRejection",

    function handleWarning( reason, promise ) {



        console.log(  "[PROCESS] Unhandled Promise Rejection" );

        console.log(  "- - - - - - - - - - - - - - - - - - -"  );

        console.log( reason );

        console.log('' );



    }

);

export function makeMongoName(s : string) : string {
  return s.replace(/[^a-zA-Z0-9]/g,'_');
}

var mongodb = process.env.ABOT_MONGODB || "testmodel";


 (<any>mongoose).Promise = global.Promise;

var db = mongoose.connection;

export class MongoBridge {
  _model : IFModel.IModels;
  constructor(model : IFModel.IModels) {
    this._model = model;
  }
  mongoooseDomainToDomain(mgdomain: string) : string {
    var domain= undefined;
    debug('searching for .............## ' + mgdomain);
    this._model.domains.every(d => {
     // console.log("here we go "  + mgdomain + " " + makeMongoName(d));
      debug("here we go "  + mgdomain + " " + makeMongoName(d));
      if(makeMongoName(d) === makeMongoName(mgdomain)) {
        domain = d;
        debug('got one ' + d);
        return false;
      }
      return true;
    });

    return domain;
  }

  makeSchema(mgdomain : string)  : mongoose.Schema {
    debug('makeSchema for ' + mgdomain);
   // console.log('makeschema ' + mgdomain);
    var domain = this.mongoooseDomainToDomain(mgdomain);
    console.log(' domain ' + domain);
    console.log(JSON.stringify(this._model.domains.join("\n")));
    var cats = Model.getCategoriesForDomain(this._model, domain);
    var res = {};
    cats.forEach(cat => {
      res[makeMongoName(cat)] = { type : String};
    })
    return new mongoose.Schema(res);
  }
}




export var talking = new Promise(function(resolve, reject) {
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function () {
    // we're connected!
    debug('here model names : ' + db.modelNames());
    resolve();
    debug('now model names : ' + db.modelNames());
    debug('done');
  });
});

talking.catch((err) => {
  console.log(err);
});

export class ModelHandle {
  _theModel : IFModel.IModels;
  _mgBridge : MongoBridge;
  _schemas : { [key: string] : mongoose.Schema};
  _models : {[key : string] : mongoose.Model<any> };
  constructor(theModel: IFModel.IModels) {
    this._theModel = theModel;
    this._mgBridge = new MongoBridge(theModel);
    this._models = {};
    this._schemas = {};
  }
  query(mgdomain : string, query : any) : Promise<any> {
    var that = this;
    debuglog('query ' + mgdomain + ' >>' + JSON.stringify(query, undefined, 2));
    return getDBConnection().then(() =>{
      return new Promise(function(resolve, reject) {
        talking.then(() => {
          debug('constructing model');
          if(!that._models[mgdomain] && mongoose.modelNames().indexOf(mgdomain) >= 0) {
          // console.log('try1');
            that._models[mgdomain] = mongoose.model(mgdomain);
          //  console.log('try2');
            that._schemas[mgdomain] = mongoose.model(mgdomain).schema;
          }
          if(!that._models[mgdomain]) {
            that._schemas[mgdomain] = that._mgBridge.makeSchema(mgdomain);
            mongoose.modelNames();
            that._models[mgdomain] = mongoose.model(mgdomain,that._schemas[mgdomain]);
          }
        //  console.log('running stuff')
      // db.fioriboms.aggregate([ { $match : {}}, { $group: { _id : { a : '$BSPName', b : '$AppKey' } , BSPName : { $first : '$BSPName'} , AppKey : { $first : '$AppKey' }}},{ $project: { _id : 0, BSPName : 1 }}], { cursor : {  batchSize : 0}});
            var model = that._models[mgdomain];
          //  console.log('here model ' + model);
          //  model.collection.count({}, function(err,number) {
            //  console.log("counted " + number + " members in collection");
          //  });
        //   console.log(JSON.stringify(query, undefined,2));
            model.collection.count({}, function(a) { console.log('lets count' + a); });
            var resq = model.collection.aggregate(query)
            if(resq) {
              resq.toArray().then((res) =>{
          //   console.log("here the result" + JSON.stringify(res));
              resolve(res);
              //db.close();
            }).catch((err) => {
              console.error(err);
              db.close();
            })
            } else {
              console.log('connection closed?');
            }
          });
      });
    })
  }
}

function incHash(hsh, key) {
  hsh[key] = (hsh[key] || 0) + 1;
}

/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
export function getDomainForSentence(theModel: IFModel.IModels, sentence : IFErBase.ISentence) : {
  domain : string,
  collectionName : string
}
{
  // this is sloppy and bad
  var res = {};
  var o = 0xFFFFFFF;
  sentence.forEach(w => {
    if (w.rule.wordType === IFModel.WORDTYPE.CATEGORY ) {
      o = o & w.rule.bitSentenceAnd;
      Model.getDomainsForCategory(theModel,w.matchedString).forEach(d =>{
        incHash(res,d);
      });
    }
    if (w.rule.wordType === IFModel.WORDTYPE.FACT) {
      o = o & w.rule.bitSentenceAnd;
    //   console.log(`${w.rule.bitindex} ${w.bitindex} ${w.rule.bitSentenceAnd} ${o} `);
       Model.getDomainsForCategory(theModel,w.category).forEach(d =>{
        incHash(res,d);
      });
    }
  });
  var domains = Model.getDomainsForBitField(theModel,o);
  if(domains.length !== 1) {
    throw new Error('more than one domain: "' + domains.join('", "') + '"');
  }
  return {
    domain : domains[0],
    collectionName : makeMongoName(domains[0])
  }
};

import { IFErBase as IMatch, ErError as ErError } from 'abot_erbase';

import * as mQ from './ast2MQuery';

export interface SRes {
  sentence :  IFErBase.ISentence,
  records : any[]
};

export interface QResult {
  sentence :  IFErBase.ISentence,
  columns : string[],
  results : string[][]
};


export function fuseAndOrderResults(res : SRes[]) : IFErBase.IWhatIsTupelAnswer[] {
  var all = [];
  debug(JSON.stringify(res));
  res.forEach(res1 => {
    res1.records.forEach(rec => {
      var r2 = undefined as IFErBase.IWhatIsTupelAnswer;
      r2 = {
        record : rec,
        sentence : res1.sentence,
        categories: Object.keys(rec),
        result: Object.keys(rec).map(key => rec[key]),
        _ranking : 1
      };
      all.push(r2);
    })
  }
  );
  return all;
}
  /*
 sentence: ISentence;
    record: IRecord;
    categories: string[];
    result: string[];
    _ranking: number;
  */
var mongoConnPromise = undefined as Promise<mongoose.Connection>;

function getDBConnection() : Promise<mongoose.Connection> {
  if(!mongoConnPromise) {
     mongoConnPromise =  new Promise(function(resolve, reject) {
      mongoose.connect('mongodb://localhost/' + mongodb).then(() => {
        resolve(mongoose.connection);
      });
    });
  }
  return mongoConnPromise;
}

import * as SentenceParser from './sentenceparser';

export interface IQuery  {
  domain : string,
  columns : string[],
  reverseMap : IReverseMap,
  query : any
};

export interface IPreparedQuery extends SentenceParser.IParsedSentences {
  queries : IQuery[]
};

export function prepareQueries(query : string, theModel: IFModel.IModels) : IPreparedQuery {
  debuglog(`here query: ${query}`);
  var r = SentenceParser.parseSentenceToAsts(query,theModel,{}); // words);
  var res = Object.assign({}, r) as IPreparedQuery ;
  r.domains = [];
  res.queries = res.asts.map( (astnode,index) => {
    var sentence = r.sentences[index];
    debuglog('return ' + AST.astToText(astnode));
    if (!astnode) {
      debug(JSON.stringify(` empty node for ${index} ` + JSON.stringify(r.errors[index],undefined,2) ) );
      return undefined;
    }
    var nodeFieldList = astnode.children[0].children[0];
    var nodeFilter = astnode.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, theModel);
    var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, sentence, theModel);
    var columnsReverseMap= mQ.makeMongoColumnsFromAst(nodeFieldList, sentence,theModel);
    var group = mQ.makeMongoGroupFromAst(nodeFieldList, sentence, theModel);
    //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
    var domainPick = getDomainForSentence(theModel, sentence);
    r.domains[index] = domainPick.domain;
   // test.equal(domain, 'FioriBOM',' got domain');
    var query = [ match, group, proj ];
    debug(` mongo query for collection ${domainPick.collectionName} : ` + JSON.stringify(query, undefined, 2));
    return {
      domain : domainPick.domain,
      collectionName : domainPick.collectionName,
      columns: columnsReverseMap.columns,
      reverseMap : columnsReverseMap.reverseMap,
      query : query
    };
  });
  return res;
}

export interface IProcessedMongoAnswers extends IMatch.IProcessedSentences {
  queryresults : QResult[]
}


export function mergeResults(r : QResult[]) {
  return r;
}

export function query(query : string, theModel : IFModel.IModels) : Promise<IProcessedMongoAnswers> {
  var handle = new ModelHandle(theModel);
  return queryInternal(query, theModel,handle);
}

export type IReverseMap = { [key : string] : string};

export function remapRecord(rec,  columns: string[], reverseMap : IReverseMap) : string[] {
  var r = {};
  Object.keys(rec).forEach(key => {
    var targetKey = reverseMap[key] || key;
    r[targetKey] = rec[key];
  });
  return columns.map(c => r[c]);
};


export function remapResult(res, columns: string[], reverseMap : IReverseMap)  : string[][] {
  return res.map(record => remapRecord(record, columns, reverseMap)
  );
}

export function queryInternal(query : string, theModel : IFModel.IModels, handle: ModelHandle ) :
  Promise<IProcessedMongoAnswers> {
    var r =  prepareQueries(query, theModel);
    var aPromises = r.queries.map( (query, index)  => {
      debug(`query {$index} prepared for domain ` + query.domain);
      return handle.query(query.domain, query.query).then( res => {
        //console.log('db returned' + res);
        var resClean = remapResult(res, r.queries[index].columns, query.reverseMap);
        return  {
           sentence : r.sentences[index],
           columns : r.queries[index].columns,
           results : resClean
        } as QResult
      }
    )
    }
    );
    var u = Promise.all<QResult>(aPromises);
       var k = u.then<IProcessedMongoAnswers>( aRes => {
      //   console.log("***here results of all queries " + JSON.stringify(aRes, undefined, 2));
          var queryresults = mergeResults(aRes);
          var res2 = {
            queryresults : queryresults,
            errors : r.errors, // [ErError.makeError_EMPTY_INPUT()] ,
            tokens : r.tokens,
          } as IProcessedMongoAnswers;
       return res2;
    }
  );
  return k;
}

/*



          export interface IWhatIsTupelAnswer {
              sentence: ISentence;
              record: IRecord;
              categories: string[];
              result: string[];
              _ranking: number;
          }





      });
    }
  //  logPerf('listAllWithContext');
  //  perflog("totalListAllWithContext");
    var aSentencesReinforced = analyzeContextString(contextQueryString, aRules);
  //  perflog("LATWC matching records (s=" + aSentencesReinforced.sentences.length + ")...");
    var matchedAnswers = WhatIs.matchRecordsQuickMultipleCategories(aSentencesReinforced, categories, records, domainCategoryFilter); //aTool: Array<IMatch.ITool>): any /* objectstream * / {
    if(debuglog.enabled){
      debuglog(" matched Answers" + JSON.stringify(matchedAnswers, undefined, 2));
    }
  //  perflog("filtering topRanked (a=" + matchedAnswers.tupelanswers.length + ")...");
 //   var matchedFiltered = WhatIs.filterOnlyTopRankedTupel(matchedAnswers.tupelanswers);
 //   if (debuglog.enabled) {
 //     debuglog("LATWC matched top-ranked Answers" + JSON.stringify(matchedFiltered, undefined, 2));
 //   }
  }
}
*/