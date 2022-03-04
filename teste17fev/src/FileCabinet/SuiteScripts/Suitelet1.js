/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/search"], function (search) {
  function onRequest(context) {
    const results = search
      .create({
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
            name: "companyname",
          },
          {
            name: "phone",
          },
        ],
      })
      .run()
      .getRange({
        start: 0,
        end: 1000,
      })
      .map(function (result) {
        const columns = result.columns;
        const firstName = result.getValue(columns[0]);
        return {
          firstName: result.getValue(columns[0]),
          phone: result.getValue(columns[1]),
        };
      });

    context.response.write({ output: JSON.stringify(results) });
  }

  function exemploBuscas() {
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

    // sem limite de resultados
    var myPagedData = mySearch.runPaged();

    myPagedData.pageRanges.forEach(function (pageRange) {
      var myPage = myPagedData.fetch({ index: pageRange.index });

      myPage.data.forEach(function (result) {
        //handle result
      });
    });
  }

  return {
    onRequest: onRequest,
  };
});
