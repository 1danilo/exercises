/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([], function () {
  function beforeLoad(context) {
    var transactionSearchObj = search.create({
      type: "transaction",
      filters: [["trandate", "on", "2/28/2022"]],
      columns: [
        search.createColumn({
          name: "ordertype",
          sort: search.Sort.ASC,
          label: "Order Type",
        }),
        search.createColumn({ name: "mainline", label: "*" }),
        search.createColumn({ name: "trandate", label: "Date" }),
        search.createColumn({ name: "asofdate", label: "As-Of Date" }),
        search.createColumn({ name: "postingperiod", label: "Period" }),
        search.createColumn({ name: "taxperiod", label: "Tax Period" }),
        search.createColumn({ name: "type", label: "Type" }),
        search.createColumn({ name: "tranid", label: "Document Number" }),
        search.createColumn({ name: "entity", label: "Name" }),
        search.createColumn({ name: "account", label: "Account" }),
        search.createColumn({ name: "memo", label: "Memo" }),
        search.createColumn({ name: "amount", label: "Amount" }),
        search.createColumn({
          name: "custbody_4599_sg_import_permit_num",
          label: "Import Permit No.",
        }),
        search.createColumn({
          name: "custbody_4599_mx_operation_type",
          label: "MX Operation Type",
        }),
        search.createColumn({
          name: "custbody_my_import_declaration_num",
          label: "Import Declaration No.",
        }),
      ],
    });
    var searchResultCount = transactionSearchObj.runPaged().count;
    log.debug("transactionSearchObj result count", searchResultCount);
    transactionSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      return true;
    });
  }

  function beforeSubmit(context) {}

  function afterSubmit(context) {}

  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
