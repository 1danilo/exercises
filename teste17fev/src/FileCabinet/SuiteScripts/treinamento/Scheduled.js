/**
 * @NApiVersion 2.x
 * @NScriptType scheduledscript
 * @NModuleScope SameAccount
 */
define(["N/runtime", "N/search", "N/record", "N/task"], function (
  runtime,
  search,
  record,
  task
) {
  function execute(context) {
    log.debug({ title: "executou" });

    /*var filter1 = search.createFilter({
       name: 'mainline',
       operator: search.Operator.IS,
       values: true
     });

     var filter2 = search.createFilter({
       name: 'custbody_processed_flag',
       operator: search.Operator.IS,
       values: false
     });

     var srch = search.create({
       type: search.Type.SALES_ORDER,
       filters: [filter1, filter2],
       columns: []
     });

     var pagedResults = srch.runPaged();

     pagedResults.pageRanges.forEach(function(pageRange){
       var currentPage = pagedResults.fetch({index: pageRange.index});
       currentPage.data.forEach(function(result){

         var scriptObj = runtime.getCurrentScript();
         log.debug('Remaining governance units: ' + scriptObj.getRemainingUsage());

         if (scriptObj.getRemainingUsage() < 100) {

           var thisScheduledScriptTask = task.create({
             taskType: task.TaskType.SCHEDULED_SCRIPT,
             scriptId: scriptObj.id,
             deploymentId: scriptObj.deploymentId,
             params: {
               doSomething: true
             }
           });

           thisScheduledScriptTask.submit();

         } else {
           var so = record.load({
             type: record.Type.SALES_ORDER,
             id: result.id
           });
           // UPDATE so FIELDS
           so.setValue({
             fieldID: 'custbody_processed_flag',
             value: true
           });
           so.save()
         }
       });
     });*/

    //  var script = runtime.getCurrentScript();
    //  var recordId = script.getParameter({ name: 'custscript_record_id' })

    //  log.debug({ title: 'recordId ' + recordId })

    // for (x = 0; x < 500; x++) {
    //
    //   script.percentComplete = (x * 100)/500;
    //
    // }
  }

  return {
    execute: execute,
  };
});
