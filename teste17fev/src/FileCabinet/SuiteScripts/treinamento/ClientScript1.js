/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(["N/ui/dialog", "N/error", "./vanilla-masker.min.js"], function (
  dialog,
  error,
  VMasker
) {
  function pageInit(context) {
    //  alert("pagina carregou " + context.mode);

    // debugger;

    // console.log("Executou pageInit no modo " + context.mode);

    // dialog.alert({
    //   title: "I am an Alert",
    //   message: "Executou pageInit no modo " + context.mode,
    // });

    VMasker(document.querySelector("#phone")).maskMoney();
    VMasker(document.querySelector("#phone")).maskPattern("(99) 9999-9999");
  }

  function fieldChanged(context) {
    var fieldId = context.fieldId;

    if (fieldId === "phone") {
      var currentRecord = context.currentRecord;
      var phone = currentRecord.getValue({ fieldId: fieldId });

      dialog.alert({
        title: "fieldChanged FORMA CORRETA",
        message: "Alterou o campo " + fieldId + " com o valor: " + phone,
      });

      currentRecord.setValue({
        fieldId: fieldId,
        value: "",
        ignoreFieldChange: true,
      });

      // .then(function () {
      //   alert("clicou ok forma correta");
      // })
      // .catch(function () {});
    }
  }

  function saveRecord(context) {
    // var currentRecord = context.currentRecord;
    // var phone = currentRecord.getValue({ fieldId: "phone" });

    // if (!phone) {
    //   dialog.alert({
    //     title: "saveRecord",
    //     message: "Algo falta ser preenchido",
    //   });
    //   return false;
    // }

    return true;
  }

  function validateField(context) {
    return true;
  }

  function validateDelete(context) {
    return true;
  }

  function validateInsert(context) {
    return true;
  }

  function validateLine(context) {
    return true;
  }

  function postSourcing(context) {}

  function lineInit(context) {}

  function sublistChanged(context) {}

  function test() {
    alert("executou test");
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    saveRecord: saveRecord,
    validateField: validateField,
    postSourcing: postSourcing,
    lineInit: lineInit,
    validateDelete: validateDelete,
    validateInsert: validateInsert,
    validateLine: validateLine,
    sublistChanged: sublistChanged,
    test: test,
  };
});
