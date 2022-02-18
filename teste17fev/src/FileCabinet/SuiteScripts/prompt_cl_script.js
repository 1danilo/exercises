/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function () {
  function pageInit() {
    alert("page init");
  }
  function saveRecord(context) {}
  function validateField(context) {}
  function fieldChanged(context) {}
  function postSourcing(context) {}
  function lineInit(context) {}
  function validateDelete(context) {}
  function validateInsert(context) {}
  function validateLine(context) {}
  function sublistChanged(context) {}
  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    postSourcing: postSourcing,
    sublistChanged: sublistChanged,
    lineInit: lineInit,
    validateField: validateField,
    validateLine: validateLine,
    validateInsert: validateInsert,
    validateDelete: validateDelete,
    saveRecord: saveRecord,
  };
});
