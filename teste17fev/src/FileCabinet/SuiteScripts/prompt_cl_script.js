/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *NModuleScope SameAccount
 */
define(["N/ui/dialog", "N/error"], function (dialog, error) {
  function pageInit(scriptContext) {
    // alert("page init " + scriptContext.mode);
    //     debugger;
    //     console.log("Executou page init no modo " + scriptContext.mode);
    //     dialog.alert({
    //       title: "I am an Alert",
    //       message: "Executou page Init no modo" + scriptContext.mode,
    //     });
  }

  function fieldChanged(scriptContext) {
    const fieldId = scriptContext.fieldId;

    if (fieldId === "phone") {
      const currentRecord = scriptContext.currentRecord;
      const phone = currentRecord.getValue({ fieldId: fieldId });

      dialog.alert({
        title: "fieldChanged FORMA CORRETA",
        message: "Alterou o campo" + fieldId + "com o valor: " + phone,
      });
    }
  }

  function postSourcing(scriptContext) {}

  function sublistChanged(scriptContext) {}

  function lineInit(scriptContext) {}

  function validateField(scriptContext) {
    return true;
  }

  function validateLine(scriptContext) {
    return true;
  }

  function validateInsert(scriptContext) {
    return true;
  }

  function validateDelete(scriptContext) {
    return true;
  }

  function saveRecord(scriptContext) {
    var currentRecord = scriptContext.currentRecord;
    const phone = currentRecord.getValue({ fieldId: "phone" });

    if (!phone) {
      dialog.alert({
        title: "saveRecord",
        message: "Algo falta ser preenchido",
      });
      return false;
    }
    return true;
  }

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
