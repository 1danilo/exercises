/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(["N/runtime", "N/search", "N/record", "N/file"], function (
  runtime,
  search,
  record,
  file
) {
  const execute = (context) => {
    const valuesReturn = _getValuesReturn();

    const fileObj = file.load({
      id: valuesReturn.fileId,
    });
    fileObj.getContents();

    const statementObject = _csvFileToObject(fileObj);
    const description = descriptionList();
    const statementObjectFilter = statementObject.filter((a) =>
      description.includes(a.Memo)
    );

    for (var i = 0; i < statementObjectFilter.length; i++) {
      const memo = statementObjectFilter[i].Memo;

      const dataObject = searchRecord(valuesReturn.subsidiaryId, memo);
      dataObject.statement = statementObjectFilter[i];
      log.debug("dataObject", dataObject);
      createRecord(dataObject);
    }
  };

  const _getValuesReturn = () => {
    return {
      fileId: runtime.getCurrentScript().getParameter({
        name: "custscript_ps_bank_statement_file_id",
      }),
      subsidiaryId: runtime.getCurrentScript().getParameter({
        name: "custscript_ps_bank_subsidiary_id",
      }),
    };
  };

  const _csvFileToObject = (fileObject) => {
    const csvFileLines = fileObject.lines.iterator();
    const data = [];

    let headers;

    csvFileLines.each((line) => {
      const columns = line.value.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

      if (!headers) {
        headers = columns;
      } else {
        if (columns.length !== headers.length) return true;

        const obj = {};

        headers.forEach((header, headerIndex) => {
          if (header == "Memo") {
            obj[header] = columns[headerIndex]
              .replace(/[^a-zA-Z' ']/g, "")
              .trim();
          } else {
            obj[header] = columns[headerIndex];
          }
        });
        data.push(obj);
      }

      return true;
    });
    return data;
  };

  const searchRecord = (subsidiary, memo) => {
    const data = {};

    const _columns = {
      memorando: {
        name: "custrecord_ps_memo",
      },
      subsidiaria: {
        name: "custrecord_ps_subsidiary",
      },
      caso: {
        name: "custrecord_case",
      },
      carteira: {
        name: "custrecord_wallet",
      },
      processo: {
        name: "custrecord_ps_process",
      },
      quinta_classificacao: {
        name: "custrecord_ps_5_classification",
      },
      credito: {
        name: "custrecord_ps_credit_account",
      },
      debito: {
        name: "custrecord_ps_debit_account",
      },
    };

    const buscaLancamento = search.create({
      type: "customrecord_ps_insert_bank_fee",
      filters: [
        ["custrecord_ps_extract_description", "is", memo],
        "AND",
        ["custrecord_ps_subsidiary", "anyof", subsidiary],
      ],
      columns: [
        _columns.memorando,
        _columns.subsidiaria,
        _columns.caso,
        _columns.carteira,
        _columns.processo,
        _columns.quinta_classificacao,
        _columns.credito,
        _columns.debito,
      ],
    });
    buscaLancamento.run().each(function (result) {
      data.memorandoSearch = result.getValue(_columns.memorando);
      data.subsidiariaSearch = result.getValue(_columns.subsidiaria);
      data.casoSearch = result.getValue(_columns.caso);
      data.carteiraSearch = result.getValue(_columns.carteira);
      data.processoSearch = result.getValue(_columns.processo);
      data.quinta_classificacaoSearch = result.getValue(
        _columns.quinta_classificacao
      );
      data.creditoSearch = result.getValue(_columns.credito);
      data.debitoSearch = result.getValue(_columns.debito);

      return true;
    });

    return data;
  };
  const createRecord = (dataObject) => {
    const recordRegistro = record.create({
      type: "journalentry",
      isDynamic: true,
    });
    recordRegistro.setValue({
      fieldId: "memo",
      value: dataObject.memorandoSearch,
    });
    recordRegistro.setValue({
      fieldId: "subsidiary",
      value: dataObject.subsidiariaSearch,
    });
    recordRegistro.setValue({
      fieldId: "cseg_ppt_dim_caso",
      value: dataObject.casoSearch,
    });
    recordRegistro.setValue({
      fieldId: "cseg_ppt_dim_cart",
      value: dataObject.carteiraSearch,
    });
    recordRegistro.setValue({
      fieldId: "cseg_ppt_dim_proc",
      value: dataObject.processoSearch,
    });
    recordRegistro.setValue({
      fieldId: "cseg_ppt_5classific",
      value: dataObject.quinta_classificacaoSearch,
    });

    const sublistId = "line";

    recordRegistro.selectNewLine({
      sublistId: sublistId,
    });

    recordRegistro.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: "account",
      value: dataObject.creditoSearch,
    });
    var amount = parseFloat(dataObject.statement.Amount);
    if (amount < 0) {
      amount = amount * -1;
    }
    recordRegistro.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: "credit",
      value: amount,
    });

    recordRegistro.commitLine({
      sublistId: sublistId,
    });

    recordRegistro.selectNewLine({
      sublistId: sublistId,
    });

    recordRegistro.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: "account",
      value: dataObject.debitoSearch,
    });

    recordRegistro.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: "debit",
      value: amount,
    });

    recordRegistro.commitLine({
      sublistId: sublistId,
    });

    recordRegistro.save({
      enableSourcing: true,
      ignoreMandatoryFields: true,
    });
    log.debug("recordRegistro", recordRegistro);
  };

  const descriptionList = () => {
    const results = [];
    const searchInsert = search.load({
      id: "397",
      type: "customrecord_ps_insert_bank_fee",
    });
    searchInsert.run().each(function (result) {
      results.push(
        result.getValue({ name: "custrecord_ps_extract_description" })
      );
      return true;
    });
    return results;
  };

  return {
    execute: execute,
  };
});
