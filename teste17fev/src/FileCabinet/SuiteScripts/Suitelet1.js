/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/search"], function (search) {
  function onRequest(context) {
    const mySearch = search.create({
      type: search.Type.CUSTOMER,
      filters: [
        {
          name: "phone",
          operator: search.Operator.STARTSWITH,
          values: "(031)",
        },
      ],
      columns: [
        {
          name: "firstname",
        },
      ],
    });

    const searchResultSet = mySearch.run();

    const results = searchResultSet.getRange({ start: 0, end: 1000 });

    // Limite 1000 resultados
    results.forEach(function (result) {
      //handle result
    });

    // Limite 4000 resultados
    searchResultSet.each(function (result) {
      //handle result
      return true;
    });

    context.response.write("Hello World!");
  }
  return {
    onRequest: onRequest,
  };
});
