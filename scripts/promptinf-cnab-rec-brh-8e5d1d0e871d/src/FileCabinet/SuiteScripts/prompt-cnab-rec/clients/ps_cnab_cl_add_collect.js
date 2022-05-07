/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/format', 'N/url', 'N/search', 'N/ui/dialog', '../modules/collect-batch-dao'],
    function (currentRecord, format, url, search, dialog, collectBatchDAO) {
        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {string} context.sublistId - Sublist name
         * @param {string} context.fieldId - Field name
         * @param {number} context.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} context.columnNum - Line number. Will be undefined if not a matrix field
         */

        function fieldChanged(context) {
            debugger
            const currentRecord = context.currentRecord
            const fieldId = context.fieldId

            if (fieldId === 'custpage_filter_rec_subsidiary') {
                const recBankAccountField = currentRecord.getField({ fieldId: 'custpage_filter_rec_bank_acc' })

                if (!recBankAccountField) return

                // Clean rec bank account field.
                var clean = recBankAccountField.getSelectOptions().forEach(function (option) {
                    // if (!option.value) return
                    if (option.value) recBankAccountField.removeSelectOption({ value: option.value })
                })

                // Get bank accounts.
                const subsidiaryId = currentRecord.getValue({ fieldId: fieldId })

                if (!subsidiaryId) return

                // Add new select options.
                const bankAccounts = collectBatchDAO.fetchBankAccountsBySubsidiary(subsidiaryId)

                bankAccounts.forEach(function (bankAccount) {
                    recBankAccountField.insertSelectOption({ value: bankAccount.account, text: bankAccount.name })
                })
            }
        }
        function saveRecord(context) {
            const form = context.currentRecord
            const installmentsCount = form.getLineCount({ sublistId: 'installments_rec' })

            var selectedInstallmentsCount = 0

            for (var line = 0; line < installmentsCount; line++) {
                var isSelected = form.getSublistValue({ sublistId: 'installments_rec', fieldId: 'custpage_selected_rec', line: line })
                if (!isSelected) continue
                selectedInstallmentsCount++
            }   

            if (selectedInstallmentsCount === 0) {
                dialog.alert({
                    title: 'Atenção',
                    message: 'Selecione ao menos uma parcela.'
                })
                return false
            }
            return true
        }

        function applyFilters(id) {
            const form = currentRecord.get()
            const filterFields = JSON.parse(form.getValue({ fieldId: 'custpage_filter_rec_fields' }))
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
            fieldChanged: fieldChanged,
            applyFilters: applyFilters
        }
    });
