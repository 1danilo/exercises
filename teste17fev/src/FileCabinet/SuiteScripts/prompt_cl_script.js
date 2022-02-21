/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function () {
  function pageInit(scriptContext) {
    alert("page init ");
  }
  function fieldChanged(scriptContext) {
    alert("field changed");
  }
  function postSourcing(context) {}
  function lineInit(context) {}
  function validateDelete(context) {}
  function validateInsert(context) {}
  function validateLine(context) {}
  function sublistChanged(context) {}
  function saveRecord() {}
  function validateField() {}
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
