/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(["N/search", "N/error"], function (search, error) {
  // usar um if para validar o retorno da funcao buscaCnpj e bloquear a criação desse registro
  function saveRecord(context) {
    // criar um if -> se o valor do campo (isperson) for igual a "F", se entrar nessa condição fazer validação para cnpj
    // se não, fazer validação para cpf

    // o conteúdo dessa funcão não possui o elemento fieldId
    let currentRecord = context.currentRecord;
    const recordType = currentRecord.type;
    let valorZeradoCpf = "00000000000";
    let valorZeradoCnpj = "00000000000000";

    if (currentRecord.getValue({ fieldId: "isperson" }) == "F") {
      if (
        currentRecord.getValue({ fieldId: "custentity_psg_br_cnpj" }) ===
        valorZeradoCnpj
      ) {
        return true;
      }
    } else {
      if (
        currentRecord.getValue({ fieldId: "custentity_psg_br_cpf" }) ===
        valorZeradoCpf
      ) {
        return true;
      }
    }

    // criar uma forma em que nao seja possível salvar quando o campo estiver vazio

    // sempre ajuda dar console.log no context -> console.log(context)
    // criar um outro if com a condição dos valores do campo cpf (igual a 11 digitos 0) e cnpj (igual a 14 digitos 0)
    // e se o if for verdadeiro, retornar como true (==) e pra utilizar os 2 dentro do mesmo if usar ||

    if (currentRecord.getValue({ fieldId: "custentity_psg_br_cnpj" })) {
      // checa se o campo cnpj possui algum valor
      const objeto = {
        // o objeto esta dentro do if porque nao conseguimos acessar o elemento fieldId para realizar a busca
        type: recordType,
        name: "custentity_psg_br_cnpj",
        value: currentRecord.getValue({ fieldId: "custentity_psg_br_cnpj" }),
      };
      const retorno = buscaCnpjCpf(objeto);
      if (retorno != "" && retorno != currentRecord.id) {
        throw error.create({
          name: "Erro",
          message: "CNPJ já cadastrado!",
        });
      }
    }
    if (currentRecord.getValue({ fieldId: "custentity_psg_br_cpf" })) {
      const objeto = {
        type: recordType,
        name: "custentity_psg_br_cpf",
        value: currentRecord.getValue({ fieldId: "custentity_psg_br_cpf" }),
      };
      const retorno = buscaCnpjCpf(objeto);
      if (retorno != "" && retorno != currentRecord.id) {
        throw error.create({
          name: "Erro",
          message: "CPF já cadastrado!",
        });
      }
    }
    return true;
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

    // criar um outro if com a condição dos valores do campo cpf (igual a 11 digitos 0) e cnpj (igual a 14 digitos 0)
    // e se o if for verdadeiro, retornar como true (==) e pra utilizar os 2 dentro do mesmo if usar ||
    let valorZeradoCpf = "00000000000";
    let valorZeradoCnpj = "00000000000000";
    // criar um outro if com a condição dos valores do campo cpf (igual a 11 digitos 0) e cnpj (igual a 14 digitos 0)
    // e se o if for verdadeiro, retornar como true (==) e pra utilizar os 2 dentro do mesmo if usar ||

    if (currentRecord.getValue({ fieldId: "isperson" }) == "F") {
      if (
        currentRecord.getValue({ fieldId: "custentity_psg_br_cnpj" }) ===
        valorZeradoCnpj
      ) {
        return true;
      }
    } else {
      if (
        currentRecord.getValue({ fieldId: "custentity_psg_br_cpf" }) ===
        valorZeradoCpf
      ) {
        return true;
      }
    }

    if (fieldId === "custentity_psg_br_cnpj") {
      if (
        !currentRecord.getValue({
          fieldId: fieldId,
        })
      )
        return true;

      const retorno = buscaCnpjCpf(objeto); // declaramos uma constante para receber o retorno da nossa função buscaCnpjCpf
      if (retorno != "" && retorno != currentRecord.id) {
        window.alert("CNPJ já cadastrado!");
      }
    }

    if (fieldId === "custentity_psg_br_cpf") {
      if (
        !currentRecord.getValue({
          fieldId: fieldId,
        })
      )
        return true;

      const retorno = buscaCnpjCpf(objeto);
      if (retorno != "" && retorno != currentRecord.id) {
        window.alert("CPF já cadastrado!");
      }
    }
    if (fieldId === "custentity_psg_br_cpf") {
      if (fieldId == "") {
        window.alert("Favor preencher o campo CPF");
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
