/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *NModuleScope SameAccount
 */
define(["N/ui/dialog"], function (dialog) {
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
      dialog
        .alert({
          title: "fieldChanged FORMA ERRADA",
          message:
            "Alterou o campo " +
            fieldId +
            " com o valor: " +
            document.getElementById("phone").value,
        })

        .then(function () {
          alert("clicou ok forma errada");
        })
        .catch(function () {});

      const currentRecord = scriptContext.currentRecord;
      const phone = currentRecord.getValue({ fieldId: fieldId });

      dialog
        .alert({
          title: "fieldChanged FORMA CORRETA",
          message: "Alterou o campo" + fieldId + "com o valor: " + phone,
        })

        .then(function () {
          alert("clicou ok forma certa");
        })
        .catch(function () {});
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
