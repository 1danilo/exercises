/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
  "N/task",
  "N/runtime",
  "N/ui/serverWidget",
  "N/file",
  "N/search",
], function (task, runtime, serverWidget, file, search) {
  function onRequest(context) {
    const request = context.request;
    const response = context.response;
    const parameters = request.parameters;

    switch (context.request.method) {
      case "GET":
        const form = serverWidget.createForm({
          title: "Importação Extrato Bancário",
        });

        const field = form.addField({
          id: "custpage_file",
          type: serverWidget.FieldType.FILE,
          label: "Arquivo",
        });

        field.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.ENDROW,
        });

        const subsidiary = form.addField({
          id: "custpage_subsidiary",
          type: serverWidget.FieldType.SELECT,
          label: "Subsidiaria",
          source: "subsidiary",
        });

        subsidiary.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.STARTROW,
        });

        const account = form.addField({
          id: "custpage_bank_account",
          type: serverWidget.FieldType.SELECT,
          label: "Conta Banco",
        });

        account.addSelectOption({
          value: "",
          text: "",
        });

        account.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.MIDROW,
        });

        const accountSearchObj = search
          .create({
            type: "account",
            filters: [["type", "anyof", "Bank"]],
            columns: [
              search.createColumn({
                name: "name",
                sort: search.Sort.ASC,
                label: "Nome",
              }),
              search.createColumn({
                name: "displayname",
                label: "Nome de exibição (traduzido)",
              }),
              search.createColumn({ name: "type", label: "Tipo da conta" }),
              search.createColumn({ name: "description", label: "Descrição" }),
              search.createColumn({ name: "balance", label: "Saldo" }),
              search.createColumn({ name: "internalId", label: "ID Interno" }),
            ],
          })
          .run()
          .each(function (result) {
            account.addSelectOption({
              value: result.getValue({ name: "internalId" }),
              text: result.getValue({ name: "displayname" }),
            });

            return true;
          });

        /*
           accountSearchObj.id="customsearch1652729657629";
           accountSearchObj.title="Custom Busca de Conta (copy)";
           var newSearchId = accountSearchObj.save();
           */

        field.isMandatory = true;
        subsidiary.isMandatory = true;
        account.isMandatory = true;

        form.addSubmitButton({
          label: "Importar",
        });
        response.writePage(form);
        break;

      case "POST":
        log.debug("request", request);
        log.debug(
          "request.parameters.custpage_file",
          request.parameters.custpage_file
        );
        log.debug(
          "request.parameters.custpage_subsidiary",
          request.parameters.custpage_subsidiary
        );

        const serverRequest = context.request;
        const subsidiaryId = serverRequest.parameters.custpage_subsidiary;
        const accountBankId = serverRequest.parameters.custpage_bank_account;

        const returnFile = serverRequest.files.custpage_file; // para carregar o arquivo por url

        returnFile.getContents();

        log.debug("returnFile", returnFile);
        log.debug("returnFile.getContents", returnFile.getContents());

        const returnCreateFile = file.create({
          name: "STATEMENT " + new Date().getTime(),
          fileType: file.Type.PLAINTEXT,
          contents: returnFile.getContents(),
          encoding: file.Encoding.UTF8,
          folder: 1250,
        });

        const fileId = returnCreateFile.save();

        log.debug("fileId", fileId);

        callScheduled(fileId, subsidiaryId, accountBankId);
        response.write("Enviado com Sucesso!");
        break;
    }

    function callScheduled(fieldId, subsidiaryId, accountBankId) {
      log.debug("fieldId", fieldId);
      log.debug("subsidiaryId", subsidiaryId);
      log.debug("account", accountBankId);
      task
        .create({
          taskType: task.TaskType.SCHEDULED_SCRIPT,
          scriptId: "customscript_ps_sc_bank_statement_import",
          deploymentId: "customdeploy_ps_sc_bank_statement_import",
          params: {
            custscript_ps_bank_statement_file_id: fieldId,
            custscript_ps_bank_subsidiary_id: subsidiaryId,
            custscript_ps_bank_statement_account: accountBankId,
          },
        })
        .submit();
    }
  }
  return {
    onRequest: onRequest,
  };
});
