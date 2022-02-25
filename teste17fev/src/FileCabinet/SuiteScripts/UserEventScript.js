/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/record"], function (record) {
  function beforeLoad(context) {
    if (context.type !== context.UserEventType.CREATE) return;
    var customerRecord = context.newRecord;
    customerRecord.setValue("phone", "555-555-5555");
    if (!customerRecord.getValue("salesrep"))
      customerRecord.setValue("salesrep", 46); // replace '46'  with one specific to your account
  }
  function beforeSubmit(context) {
    if (context.type !== context.UserEventType.CREATE) return;
    var customerRecord = context.newRecord;
    customerRecord.setValue("comments", "Please follow up with this customer!");
  }
  function afterSubmit(context) {
    if (context.type !== context.UserEventType.CREATE) return;
    var customerRecord = context.newRecord;
    if (customerRecord.getValue("salesrep")) {
      var call = record.create({
        type: record.Type.PHONE_CALL,
        isDynamic: true,
      });
      call.setValue("title", "Make follow-up call to new customer");
      call.setValue("assigned", customerRecord.getValue("salesrep"));
      call.setValue("phone", customerRecord.getValue("phone"));
      try {
        var callId = call.save();
        log.debug("Call record created successfully", "Id: " + callId);
      } catch (e) {
        log.error(e.name);
      }
    }
  }
  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
