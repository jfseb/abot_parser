"use strict";
/**
 * @file formaterror.ts
 *
 * Formats (some) parser errors into a human understandable text
 *
 * (c) gerd forstmann 2017
 */
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debugf");
const debuglog = debug('formaterror');
var abot_erbase = require('abot_erbase');
const fdevsta_monmove_1 = require("fdevsta_monmove");
//t[{"name":"NoViableAltException","message":"Expecting: one of these possible Token sequences:\n  1. [AFact]\n  2. [AnANY]\nbut found: ''","token":{"image":"","startOffset":null,"endOffset":null,"startLine":null,"endLine":null,"startColumn":null,"endColumn":null,"tokenType":1},"resyncedTokens":[],"context":{"ruleStack":["catListOpMore","factOrAny"],
function getTokenText(token, sentence) {
    return getSentenceToken(token, sentence).string;
}
exports.getTokenText = getTokenText;
function getSentenceToken(token, sentence) {
    if (Number.isNaN(token.startOffset) || token.startOffset >= sentence.length) {
        throw Error('access outside of index' + token.startOffset + " / " + sentence.length);
    }
    return sentence[token.startOffset];
}
exports.getSentenceToken = getSentenceToken;
function getTokenQualifier(token, sentence) {
    return getQualifierFromWordType(getSentenceToken(token, sentence).rule.wordType);
}
exports.getTokenQualifier = getTokenQualifier;
function getQualifierFromWordType(wordType) {
    switch (wordType) {
        case fdevsta_monmove_1.IFModel.WORDTYPE.FACT:
            return "the fact";
        case fdevsta_monmove_1.IFModel.WORDTYPE.CATEGORY:
            return "the category";
        case fdevsta_monmove_1.IFModel.WORDTYPE.DOMAIN:
            return "the domain";
        case fdevsta_monmove_1.IFModel.WORDTYPE.OPERATOR:
            return "the operator";
    }
    return "";
}
exports.getQualifierFromWordType = getQualifierFromWordType;
function getExpecting(message) {
    //    return "A"
    //Error: NoViableAltException: Expecting: one of these possible Token sequences:
    //  1. [AFact]
    //  2. [AnANY]
    // todo extract and format alternatives...
    return 'a fact or a string fragment';
}
exports.getExpecting = getExpecting;
function formatError(error, sentence) {
    debuglog(() => 'error : ' + JSON.stringify(error));
    if ((error.name === "NotAllInputParsedException") && error.token && (error.token.startOffset !== null)) {
        var tok = getTokenText(error.token, sentence);
        var qualifier = getTokenQualifier(error.token, sentence);
        return { text: `I do not understand ${qualifier} "${tok}" at this position in the sentence.`,
            error: error };
    }
    if ((error.name === "NoViableAltException") && error.token && (Number.isNaN(error.token.startOffset))) {
        var expect = getExpecting(error.message);
        return { text: `Sentence terminated unexpectedly, i expected ${expect}.`,
            error: error };
    }
    //(error.name === "NoViableAltException")
    return { error: error,
        text: JSON.stringify(error)
    };
}
exports.formatError = formatError;

//# sourceMappingURL=formaterror.js.map
