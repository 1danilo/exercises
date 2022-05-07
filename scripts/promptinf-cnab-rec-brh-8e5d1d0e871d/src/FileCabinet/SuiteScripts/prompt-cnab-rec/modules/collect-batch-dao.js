/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
  function (record, search) {
    /**
     * Record Type.
     *
     * @type {string}
     */
    const RECORD_TYPE = 'customrecord_ps_collect_batch'

    /**
     * Update task finished.
     *
     * @param id
     * @param isTaskFinished
     */
    function updateTaskFinished(id, isTaskFinished) {
      record.submitFields({
        type: RECORD_TYPE,
        id: id,
        values: {
          custrecord_ps_cob_task_finished: isTaskFinished
        }
      })
    }

    /**
     * Check if has a batch in progress.
     *
     * @returns {string}
     */
    function fetchInProgress() {
      return search.create({
        type: RECORD_TYPE,
        filters: [{
          name: 'custrecord_ps_cob_task_finished',
          operator: search.Operator.IS,
          values: false
        }]
      })
        .run()
        .getRange({
          start: 0,
          end: 1
        })
        .reduce(function (acc, result) {
          return result.id
        }, '')
    }

    /**
     * Fetch bank accounts by subsidiary.
     *
     * @param subsidiaryId
     * @returns {{name: string, id: number}[]}
     * @private
     */
    function fetchBankAccountsBySubsidiary(subsidiaryId) {
      return search.create({
        type: 'customrecord_ps_bank_account',
        filters: [{
          name: 'custrecord_ps_bac_subsidiary_owner',
          operator: search.Operator.ANYOF,
          values: subsidiaryId
        }, {
          name: 'custrecord_ps_bac_id_collect',
          operator: search.Operator.ISNOTEMPTY
        }, {
          name: 'isinactive',
          operator: search.Operator.IS,
          values: false
        }],
        columns: [{
          name: 'name'
        },
        {
          name: 'custrecord_ps_bac_account'
        }]
      })
        .run()
        .getRange({
          start: 0,
          end: 1000
        })
        .map(function (result) {
          return {
            id: result.id,
            name: result.getValue(result.columns[0]),
            account: result.getValue(result.columns[1])
          }
        })
    }

    return {
      RECORD_TYPE: RECORD_TYPE,
      updateTaskFinished: updateTaskFinished,
      fetchInProgress: fetchInProgress,
      fetchBankAccountsBySubsidiary: fetchBankAccountsBySubsidiary
    }
  })
