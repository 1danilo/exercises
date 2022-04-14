/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/search", "N/ui/serverWidget"], function (search, serverWidget) {
  function onRequest(context) {
    const serverRequest = context.request;

    if (serverRequest.method === "GET") {
      const form = _buildForm();
      context.response.writePage({ pageObject: form });
    } else {
      // POST
      const pessoa = serverRequest.parameters.custpage_pessoa;
      // log.error({ title: "pessoa" + pessoa });
      const customersCount = serverRequest.getLineCount({
        group: "sublist_customers",
      });
      const selectedCustomers = [];

      for (var i = 0; i < customersCount; i++) {
        var selected = serverRequest.getSublistValue({
          group: "sublist_customers",
          name: "custpage_selected",
          line: 1,
        });
        if (selected === "T") {
          selectedCustomers.push({
            name: serverRequest.getSublistValue({
              group: "sublist_customers",
              name: "custpage_name",
              line: 1,
            }),
            phone: serverRequest.getSublistValue({
              group: "sublist_customers",
              name: "custpage_phone",
              line: 1,
            }),
          });
        }
      }
      log.error({ title: "selectedCustomers", details: selectedCustomers });
    }
  }

  function _buildForm() {
    var form = serverWidget.createForm({ title: "Simple Form" });

    form.addButton({
      id: "custpage-button_example",
      label: "Test",
      functionName: "(function(){ window.open('www.google.com', '_blank'); })",
    });

    form.addSubmitButton({
      label: "Enviar",
    });

    const selectField = form.addField({
      id: "custpage_pessoa",
      type: serverWidget.FieldType.SELECT,
      label: "Pessoa",
    });

    selectField.addSelectOption({
      value: "",
      text: "",
    });

    selectField.addSelectOption({
      value: "a",
      text: "Albert",
    });

    var sublist = form.addSublist({
      id: "sublist_customers",
      type: serverWidget.SublistType.LIST,
      label: "Clientes",
    });

    sublist.addField({
      id: "custpage_selected",
      type: serverWidget.FieldType.CHECKBOX,
      label: "Selecionado",
    });

    sublist.addField({
      id: "custpage_name",
      type: serverWidget.FieldType.TEXT,
      label: "Nome",
    });

    sublist.addField({
      id: "custpage_phone",
      type: serverWidget.FieldType.TEXT,
      label: "Telefone",
    });

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
      .forEach(function (result, resultIndex) {
        const columns = result.columns;

        sublist.setSublistValue({
          id: "custpage_name",
          line: resultIndex,
          value: result.getValue(columns[0]),
        });

        sublist.setSublistValue({
          id: "custpage_phone",
          line: resultIndex,
          value: result.getValue(columns[1]),
        });
      });
    return form;
  }

  function exemploBuscaCustomer() {
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

    // limite 1000 resultados
    results.forEach(function (result) {
      //handle result
    });

    // limite 4000 resultados
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
