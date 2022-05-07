/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/url'],
  function (runtime, url) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     * @param {Form} context.form - Current form
     */
    function beforeLoad (context) {
      if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE ||
        context.type !== context.UserEventType.VIEW) return

      const newRecord = context.newRecord
      const statusId = newRecord.getValue({ fieldId: 'statusRef' })
      const status = { OPEN: 'open' }
      // const approvalStatusId = newRecord.getValue({ fieldId: 'approvalstatus' })
      // const approvalStatus = { APPROVED: '2' }

      if (statusId !== status.OPEN) return

      const recordType = newRecord.type
      const recordId = newRecord.id
      const form = context.form

      const addCollectSuiteletUrl = url.resolveScript({
        scriptId: 'customscript_ps_cnab_st_add_collect_br', 
        deploymentId: 'customdeploy_ps_cnab_st_add_collect_br', 
        params: {
          custparam_record_type: recordType,
          custparam_record_id: recordId
        }
      })

      form.addButton({
        id: 'custpage_add_collect',
        label: 'Gerar boleto',
        functionName: "(function(){window.open('" + addCollectSuiteletUrl + "', '_self')})"
      })
    }

    return {
      beforeLoad: beforeLoad
    }
  })
