/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget"], function (serverWidget) {
  return {
    onRequest: function (context) {
      var assistant = serverWidget.createAssistant({
        title: "New Supervisor",
        hideNavBar: false,
      });
      var assignment = assistant.addStep({
        id: "assignment",
        label: "Select new supervisor",
      });
      var review = assistant.addStep({
        id: "review",
        label: "Review and Submit",
      });

      var writeAssignment = function () {
        assistant.addField({
          id: "newsupervisor",
          type: "select",
          label: "Name",
          source: "employee",
        });
        assistant.addField({
          id: "assignedemployee",
          type: "select",
          label: "Employee",
          source: "employee",
        });
      };

      var writeReview = function () {
        var supervisor = assistant.addField({
          id: "newsupervisor",
          type: "text",
          label: "Name",
        });
        supervisor.defaultValue = context.request.parameters.inpt_newsupervisor;

        var employee = assistant.addField({
          id: "assignedemployee",
          type: "text",
          label: "Employee",
        });
        employee.defaultValue =
          context.request.parameters.inpt_assignedemployee;
      };

      var writeResult = function () {
        var supervisor = context.request.parameters.newsupervisor;
        var employee = context.request.parameters.assignedemployee;
        context.response.write(
          "Supervisor: " + supervisor + "\nEmployee: " + employee
        );
      };

      var writeCancel = function () {
        context.response.write("Assistant was cancelled");
      };

      if (context.request.method === "GET") {
        //GET method means starting the assistant
        writeAssignment();
        assistant.currentStep = assignment;
        context.response.writePage(assistant);
      } //POST method - process step of the assistant
      else {
        if (context.request.parameters.next === "Finish")
          //Finish was clicked
          writeResult();
        else if (context.request.parameters.cancel)
          //Cancel was clicked
          writeCancel();
        else if (assistant.currentStep.stepNumber === 1) {
          //transition from step 1 to step 2
          writeReview();
          assistant.currentStep = assistant.getNextStep();
          context.response.writePage(assistant);
        } else {
          //transition from step 2 back to step 1
          writeAssignment();
          assistant.currentStep = assistant.getNextStep();
          context.response.writePage(assistant);
        }
      }
    },
  };
});
