/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
 define(['N/runtime', 'N/search', 'N/record', 'N/util', '../modules/collect-remittance-dao', '../modules/tecnospeed/index'],
 function (runtime, search, record, util, collectRemittanceDAO, Tecnospeed) {
   /**
    * Marks the beginning of the Map/Reduce process and generates input data.
    *
    * @typedef {Object} ObjectRef
    * @property {number} id - Internal ID of the record instance
    * @property {string} type - Record type id
    *
    * @return {Array|Object|Search|RecordRef} inputSummary
    * @since 2015.1
    */
   function getInputData () {
     log.debug('entrei')
     const collectRemittanceId = _getCollectRemittanceId()

     const collectRemittanceColumns = [
       'custrecord_ps_core_collect'
     ]

     const collectRemittanceValues = search.lookupFields({
       type: 'customrecord_ps_collect_remit',
       id: collectRemittanceId,
       columns: collectRemittanceColumns
     })

     const collect = JSON.parse(collectRemittanceValues[collectRemittanceColumns[0]])

     return collect.map(function (id) {
       return {
         id: id,
         collectRemittanceId: collectRemittanceId
       }
     })
   }

   /**
    * Executes when the map entry point is triggered and applies to each key/value pair.
    *
    * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
    * @since 2015.1
    */
   function map (context) {
     const collect = JSON.parse(context.value)

     log.debug('context', context)
     log.debug('collect', collect)

     record.submitFields({
       type: 'customrecord_ps_collect',
       id: collect.id,
       values: {
         custrecord_ps_collect_rem: collect.collectRemittanceId
       }
     })
   }

   /**
    * Executes when the summarize entry point is triggered and applies to the result set.
    *
    * @param {Summary} context - Holds statistics regarding the execution of a map/reduce script
    * @since 2015.1
    */
   function summarize (context) {
     const inputSummaryError = context.inputSummary.error

     if (inputSummaryError) {
       log.error({ title: 'Input Error', details: inputSummaryError })
     }

     context.mapSummary.errors.iterator().each(function (key, error) {
       log.error({ title: 'Map Error for key: ' + key, details: error })
       return true
     })

     const collectRemittanceId = _getCollectRemittanceId()

     collectRemittanceDAO.updateTaskFinished(collectRemittanceId, true)
   }

   /**
    * Get payment remittance ID.
    *
    * @returns {string}
    * @private
    */
   function _getCollectRemittanceId () {
     return runtime.getCurrentScript().getParameter({ name: 'custscript_ps_collect_remittance_to_gen' })
   }

   return {
     getInputData: getInputData,
     map: map,
     summarize: summarize
   }
 })
