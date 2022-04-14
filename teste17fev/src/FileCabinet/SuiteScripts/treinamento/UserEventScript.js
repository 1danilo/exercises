/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/redirect", "N/ui/serverWidget"], function (redirect, serverWidget) {
  function beforeLoad(context) {
    //  const type = context.type

    // if (type !== 'view') return;

    const form = context.form;

    // form.addButton({
    //   id: "custpage_button_example",
    //   label: "Test",
    //   functionName: "test",
    // });

    // redirect.redirect({
    //   url: "http://www.google.com",
    // });

    // var selectField = form.addField({
    //   id: "custpage_selectfield",
    //   type: serverWidget.FieldType.SELECT,
    //   label: "Campo Select",
    // });

    // selectField.addSelectOption({
    //   value: " ",
    //   text: " ",
    // });

    // selectField.addSelectOption({
    //   value: "a",
    //   text: "Albert",
    // });

    // selectField.addSelectOption({
    //   value: "b",
    //   text: "Bernard",
    // });

    // if (context.type !== context.UserEventType.CREATE) return;
    // var customerRecord = context.newRecord;
    // customerRecord.setValue("phone", "555-555-5555");
    // if (!customerRecord.getValue("salesrep"))
    //   customerRecord.setValue("salesrep", 46); // replace '46'  with one specific to your account
  }

  function beforeSubmit(context) {
    log.debug({ title: "log de debug", details: "log debug details" });
    log.audit({ title: "log de audit", details: "log audit details" });
    log.error({ title: "log de error", details: "log error details" });
    log.emergency({
      title: "log de emergency",
      details: "log emergency details",
    });

    if (runtime.executionContext === runtime.ContextType.RESTLET) {
      // executa acao somente para context restlet
    }

    // if (context.type !== context.UserEventType.CREATE) return;
    // var customerRecord = context.newRecord;
    // customerRecord.setValue("comments", "Please follow up with this customer!");
  }

  function afterSubmit(context) {
    // if (context.type !== context.UserEventType.CREATE) return;
    // var customerRecord = context.newRecord;
    // if (customerRecord.getValue("salesrep")) {
    //   var call = record.create({
    //     type: record.Type.PHONE_CALL,
    //     isDynamic: true,
    //   });
    //   call.setValue("title", "Make follow-up call to new customer");
    //   call.setValue("assigned", customerRecord.getValue("salesrep"));
    //   call.setValue("phone", customerRecord.getValue("phone"));
    //   try {
    //     var callId = call.save();
    //     log.debug("Call record created successfully", "Id: " + callId);
    //   } catch (e) {
    //     log.error(e.name);
    //   }
    // }
  }
  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
