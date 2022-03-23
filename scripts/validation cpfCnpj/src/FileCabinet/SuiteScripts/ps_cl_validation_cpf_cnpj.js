/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(["N/search"], function (search) {
  function saveRecord(context) {
    // usar um if para validar o retorno da funcao buscaCnpj e bloquear a criação desse registro
  }

  function fieldChanged(context) {
    const fieldId = context.fieldId; // traz o campo que esta sendo alterado pelo usuario
    const currentRecord = context.currentRecord; // criamos uma variavel para definir o registro atual (como um todo)
    const recordType = currentRecord.type; // criamos uma variavel para definir o tipo de registro atual (qual o tipo desse registro)

    // o objeto foi criado para ser usado como parametro para a função buscaCnpjCpf
    const objeto = {
      type: recordType,
      name: fieldId,
      value: currentRecord.getValue({ fieldId: fieldId }), // é uma função do currentRecord que retorna o valor do campo
    };

    if (fieldId === "custentity_psg_br_cnpj") {
      if (!currentRecord.getValue({ fieldId: fieldId })) return true;
      // window.alert("CNPJ já cadastrado!");
      const retorno = buscaCnpjCpf(objeto); // declaramos uma constante para receber o retorno da nossa função buscaCnpjCpf
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
    let retorno = ""; // declaramos uma variável de retorno para verificar a existência do cnpj ou cpf

    search
      .create({
        type: objeto.type, // tipo de registro para realizar a busca
        filters: [
          {
            name: objeto.name, // id do campo
            operator: search.Operator.STARTSWITH, // tipo de operador a ser utilizado na busca
            values: objeto.value, // valor a ser buscado no campo do registro
          },
        ],
        columns: [
          {
            name: "internalid", // valor do campo do registro
          },
        ],
      })
      .run() // executa a busca
      .getRange({
        // define o range
        start: 0,
        end: 1000,
      })
      .forEach(function (result) {
        //percorre os resultados
        retorno = result.getValue({ name: "internalid" }); // adicionamos o valor do campo "internalid" do registro encontrado
      });
    return retorno; //retorno da função com o resultado da busca
  }

  // 1-criar essa mesma condicao para o cpf
  // 2-fazer uma busca pelo cnpj ou cpf digitado(pegar o valor digitado pelo usuario e declarar numa variavel - currentRecord.getValue)
  // 3-criar um alerta se o registro existir

  // falar com o guilherme e apresentar a solução até o momento e questionar se atende o que foi pedido pelo cliente

  return {
    saveRecord: saveRecord,
    fieldChanged: fieldChanged,
  };
});
