/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["N/task", "N/runtime", "N/ui/serverWidget"], function (
  task,
  runtime,
  serverWidget
) {
  function onRequest(context) {
    const request = context.request;
    const response = context.response;
    const parameters = request.parameters;

    if (request.method === "GET") {
      const form = serverWidget.createForm({
        title: "Importação Extrato Bancário",
      });
      const field = form.addField({
        id: "custpage_file",
        type: serverWidget.FieldType.FILE,
        label: "Arquivo",
        source: "file",
      });

      const subsidiary = form.addField({
        id: "custpage_subsidiary",
        type: serverWidget.FieldType.SELECT,
        label: "Subsidiaria",
        source: "subsidiary",
      });

      form.addSubmitButton({ label: "Importar" });
      response.writePage(form);
    } else {
      // POST
      // response.writePage({})
    }
  }
  return {
    onRequest: onRequest,
  };
});
