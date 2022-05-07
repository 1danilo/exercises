/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/currentRecord', 'N/format', 'N/url', 'N/ui/dialog'],
    function (currentRecord, format, url, dialog) {
        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         */
        function saveRecord(context) {
            const form = context.currentRecord
            const collectCount = form.getLineCount({ sublistId: 'collect' })

            var selectedCollectCount = 0

            for (var line = 0; line < collectCount; line++) {
                var isSelected = form.getSublistValue({ sublistId: 'collect', fieldId: 'custpage_selected', line: line })
                if (!isSelected) continue
                selectedCollectCount++
            }

            if (selectedCollectCount === 0) {
                dialog.alert({
                    title: 'Atenção',
                    message: 'Selecione ao menos uma cobrança.'
                })
                return false
            }

            return true
        }

        /**
         * Apply filters.
         */
        function applyFilters() {
            const form = currentRecord.get()
            const filterFields = JSON.parse(form.getValue({ fieldId: 'custpage_filter_fields' }))
            const params = filterFields.reduce(function (acc, field) {
                const fieldId = field.id
                var fieldValue = form.getValue({ fieldId: fieldId })
                const fieldType = field.type
                if (fieldType === 'date' && fieldValue) {
                    fieldValue = format.format({ type: format.Type.DATE, value: fieldValue })
                } else if (fieldType === 'multiselect') {
                    fieldValue = fieldValue.join()
                }
                if (fieldValue) {
                    acc[fieldId] = fieldValue
                }
                return acc
            }, {})
            const serverScript = JSON.parse(form.getValue({ fieldId: 'custpage_server_rec_script' }))
            window.onbeforeunload = function () { }
            window.location.replace(url.resolveScript({
                scriptId: serverScript.id,
                deploymentId: serverScript.deploymentId,
                params: params
            }))
        }

        return {
            saveRecord: saveRecord,
            applyFilters: applyFilters
        }
    })
