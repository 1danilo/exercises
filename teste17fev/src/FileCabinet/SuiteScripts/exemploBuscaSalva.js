require(["N/record", "N/search"], function (record, search) {
  window.record = record;
  window.search = search;
});
search
  .create({
    type: "invoice",
    filters: [["type", "anyof", "CustInvc"]],
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
  })
  .run()
  .each(function (result) {
    console.log(result.getAllValues());
    return true;
  });
