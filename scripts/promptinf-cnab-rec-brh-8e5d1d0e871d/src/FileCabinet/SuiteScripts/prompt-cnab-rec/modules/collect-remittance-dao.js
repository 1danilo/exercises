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
    const RECORD_TYPE = 'customrecord_ps_collect_remit'
    /**
     * Update task finished.
     *
     * @param id
     * @param isTaskFinished
     */
    function updateTaskFinished (id, isTaskFinished) {
      record.submitFields({
        type: RECORD_TYPE,
        id: id,
        values: {
          custrecord_ps_core_task_finished: isTaskFinished
        }
      })
    }

    return {
      RECORD_TYPE: RECORD_TYPE,
      updateTaskFinished: updateTaskFinished
    }
  })
