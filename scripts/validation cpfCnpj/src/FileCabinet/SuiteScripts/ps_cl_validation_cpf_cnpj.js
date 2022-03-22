/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(["N/search"], function (search) {
  function saveRecord(context) {}

  function validateField(context) {}

  function fieldChanged(context) {
    const fieldId = context.fieldId;
    const currentRecord = context.currentRecord;
    const recordType = currentRecord.type;

    const objeto = {
      type: recordType,
      name: fieldId,
      value: currentRecord.getValue({ fieldId: fieldId }),
    };

    if (fieldId === "custentity_psg_br_cnpj") {
      if (!currentRecord.getValue({ fieldId: fieldId })) return true;
      // window.alert("CNPJ já cadastrado!");
      const retorno = buscaCnpjCpf(objeto);
      if (retorno != "") {
        window.alert("CNPJ já cadastrado!");
      }
    }

    if (fieldId === "custentity_psg_br_cpf") {
      if (!currentRecord.getValue({ fieldId: fieldId })) return true;
      const retorno = buscaCnpjCpf(objeto);
      if (retorno != "") {
        window.alert("CPF já cadastrado!");
      }
    }
  }

  function buscaCnpjCpf(objeto) {
    var retorno = "";
    const results = search

      .create({
        type: objeto.type,
        filters: [
          {
            name: objeto.name,
            operator: search.Operator.STARTSWITH,
            values: objeto.value,
          },
        ],
        columns: [
          {
            name: "internalid",
          },
        ],
      })
      .run()
      .getRange({
        start: 0,
        end: 1000,
      })
      .forEach(function (result) {
        retorno = result.getValue({ name: "internalid" });
      });
    return retorno;
  }

  // 1-criar essa mesma condicao para o cpf
  // 2-fazer uma busca pelo cnpj ou cpf digitado(pegar o valor digitado pelo usuario e declarar numa variavel - currentRecord.getValue)
  // 3-criar um alerta se o registro existir

  return {
    // saveRecord: saveRecord,
    // validateField: validateField,
    fieldChanged: fieldChanged,
  };
});
