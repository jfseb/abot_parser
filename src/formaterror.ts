/**
 * @file formaterror.ts
 *
 * Formats (some) parser errors into a human understandable text
 *
 * (c) gerd forstmann 2017
 */

import * as debug from 'debugf';
const debuglog = debug('formaterror');

var abot_erbase = require('abot_erbase');

import { IFModel as IFModel } from 'fdevsta_monmove';
import { Sentence as Sentence, IFErBase as IFErBase } from 'abot_erbase';

//t[{"name":"NoViableAltException","message":"Expecting: one of these possible Token sequences:\n  1. [AFact]\n  2. [AnANY]\nbut found: ''","token":{"image":"","startOffset":null,"endOffset":null,"startLine":null,"endLine":null,"startColumn":null,"endColumn":null,"tokenType":1},"resyncedTokens":[],"context":{"ruleStack":["catListOpMore","factOrAny"],

export function getTokenText(token : any, sentence : IFErBase.ISentence) {
    return getSentenceToken(token,sentence).string;
}

export function getSentenceToken(token : any, sentence : IFErBase.ISentence) : IFErBase.IWord {
    if(Number.isNaN(token.startOffset) || token.startOffset >= sentence.length) {
        throw Error('access outside of index' + token.startOffset + " / " + sentence.length);
    }
    return sentence[token.startOffset];
}


export function getTokenQualifier(token : any, sentence : IFErBase.ISentence) {
    return getQualifierFromWordType(getSentenceToken(token,sentence).rule.wordType );
}

export function getQualifierFromWordType(wordType : string) : string {
    switch(wordType) {
        case IFModel.WORDTYPE.FACT :
            return "the fact";
        case IFModel.WORDTYPE.CATEGORY:
            return "the category"
        case IFModel.WORDTYPE.DOMAIN:
            return "the domain"
        case IFModel.WORDTYPE.OPERATOR:
            return "the operator"
    }
    return "";
}



export interface IParseError {
    text : string,
    error : any
}

export function getExpecting(message : string) : string {
//    return "A"
//Error: NoViableAltException: Expecting: one of these possible Token sequences:
//  1. [AFact]
//  2. [AnANY]
// todo extract and format alternatives...
return 'a fact or a string fragment';
}

export function formatError(error : any, sentence : IFErBase.ISentence) : IParseError {
    debuglog(() => 'error : ' + JSON.stringify(error));
    if ((error.name === "NotAllInputParsedException") && error.token && (error.token.startOffset !== null) ) {
        var tok = getTokenText(error.token, sentence);
        var qualifier = getTokenQualifier(error.token,sentence);
        return { text :
                `I do not understand ${qualifier} "${tok}" at this position in the sentence.`,
                error : error };
    }
    if ((error.name === "NoViableAltException") && error.token && (Number.isNaN(error.token.startOffset)) ) {
        var expect = getExpecting(error.message);
        return { text :
                `Sentence terminated unexpectedly, i expected ${expect}.`,
                error : error };
    }
    //(error.name === "NoViableAltException")
    return { error : error,
        text : JSON.stringify(error)
    }
}