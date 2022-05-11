/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(["N/runtime", "N/search", "N/record", "N/file"], function (
  runtime,
  search,
  record,
  file
) {
  function _getValuesReturn() {
    return {
      fileId: runtime
        .getCurrentScript()
        .getParameter({ name: "custscript_ps_bank_statement_file_id" }),
      subsidiaryId: runtime
        .getCurrentScript()
        .getParameter({ name: "custscript_ps_bank_subsidiary_id" }),
    };
  }

  function execute(context) {
    const valuesReturn = _getValuesReturn();

    log.debug("valuesReturn", valuesReturn);

    var fileObj = file.load({
      fileId: fileId,
    });

    log.debug("fileObj", fileObj);

    fileObj.getContents();
  }

  return {
    _getValuesReturn: _getValuesReturn,
    execute: execute,
  };
});
