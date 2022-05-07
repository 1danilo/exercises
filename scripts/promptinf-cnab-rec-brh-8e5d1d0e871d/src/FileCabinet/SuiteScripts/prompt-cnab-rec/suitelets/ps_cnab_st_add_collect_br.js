/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/redirect', 'N/runtime', 'N/task', 'N/format', '../modules/collect-batch-dao', 'N/url'],
  function (serverWidget, search, record, redirect, runtime, task, format, collectBatchDAO, url) {
    /**
     * 
     * @param {*} context 
     */

    function onRequest(context) {
      const request = context.request
      const response = context.response
      const parameters = request.parameters

      const collectBatchInProgress = collectBatchDAO.fetchInProgress()

      if (collectBatchInProgress) {
        response.writePage({
          pageObject: _buildBatchInProgressMessage()
        })
        return
      }

      if (request.method === 'GET') {
        response.writePage({
          pageObject: _buildInstallmentsList(parameters)
        })
      } else { // POST
        const selectedInstallments = []
        const installmentsSublistId = 'installments_rec'
        const installmentSublistFields = [
          'custpage_transaction_rec_id',
          'custpage_installment_rec_number',
          'custpage_installment_rec_amount',
          'custpage_discount_rec',
          'custpage_interest',
          'custpage_installment_rec_due_date'
        ]
        const installmentsCount = request.getLineCount({ group: installmentsSublistId })
        for (var line = 0; line < installmentsCount; line++) {
          var isSelected = request.getSublistValue({ group: installmentsSublistId, name: 'custpage_selected_rec', line: line }) === 'T'
          if (isSelected) {
            var installmentValues = installmentSublistFields.map(function (fieldId) {
              return request.getSublistValue({ group: installmentsSublistId, name: fieldId, line: line })
            })
            selectedInstallments.push(installmentValues)
          }
        }

        if (!selectedInstallments.length) return

        const collectBatchRecordType = 'customrecord_ps_collect_batch'
        const collectBatch = record.create({ type: collectBatchRecordType })
        collectBatch.setValue({
          fieldId: 'custrecord_ps_cob_installments',
          value: JSON.stringify(selectedInstallments)
        })
        const collectBatchId = collectBatch.save()
          log.debug('collectBatchId', collectBatchId)
        const collectTask = task.create({
          taskType: task.TaskType.MAP_REDUCE,
          scriptId: 'customscript_ps_cnab_mr_add_collect', //'customscript_ps_cnab_mr_add_collect',
          deploymentId: 'customdeployps_cnab_mr_add_collect', //'customdeploy_ps_cnab_mr_add_collect',
          params: {
            custscriptcustscript_ps_collect_batch_to: collectBatchId
          }
        })

        const collectTaskId = collectTask.submit()

        record.submitFields({
          type: collectBatchRecordType,
          id: collectBatchId,
          values: {
            custrecord_ps_cob_task_id: collectTaskId
          }
        })

        redirect.toRecord({
          type: collectBatchRecordType,
          id: collectBatchId
        })
      }
    }

    const formTitle = 'Gerar Boleto'

    /**
     * Build batch in progress message.
     *
     * @returns {*}
     * @private
     */
    function _buildBatchInProgressMessage() {
      const form = serverWidget.createForm({ title: formTitle })

      form.addField({
        id: 'custpage_batch_in_rec_progress_msg',
        type: serverWidget.FieldType.INLINEHTML,
        label: 'Batch in progress message'
      })
        .defaultValue = 'Existe um lote de cobrança em processamento no momento. Tente novamente mais tarde.'

      return form
    }

    /**
* Build installments list.
*
* @returns {void}
* @private
*/
    function _buildInstallmentsList(parameters) {
      const form = serverWidget.createForm({ title: formTitle })

      // const amountRemainingFormula = '{custrecord_sit_parcela_l_transacao.custrecord_sit_parcela_n_valor} - NVL({custrecord_sit_parcela_l_transacao.custrecord_sit_parcela_n_vl_pago}, 0)'

      const searchFilters = [{
        name: 'mainline',
        operator: search.Operator.IS,
        values: true
      },
        // {
        //   name: 'status',
        //   operator: search.Operator.ANYOF,
        //   values: 'Invoice:A'
        // }
      ]

      const recordId = parameters.custparam_record_id //UserEvent vendor bill

      if (recordId) {
        searchFilters.push({
          name: 'internalid',
          operator: search.Operator.ANYOF,
          values: recordId
        })
      } else {
        const filtersFieldGroupId = 'filters'
        form.addFieldGroup({ id: filtersFieldGroupId, label: 'Filtros' })
        //-----------------------------------subsidiary---------------------------------------------
        const filterSubsidiaryFieldId = 'custpage_filter_rec_subsidiary'

        const filterSubsidiaryField = form.addField({
          id: filterSubsidiaryFieldId,
          type: serverWidget.FieldType.SELECT,
          label: 'Subsidiária',
          container: filtersFieldGroupId
        })

        var filterSubsidiaryFieldValue = parameters[filterSubsidiaryFieldId] || runtime.getCurrentUser().subsidiary

        const subsidiaries = _fetchSubsidiaries()


        subsidiaries.forEach(function (subsidiary) {
          const isSelected = subsidiary.id === filterSubsidiaryFieldValue
          filterSubsidiaryField.addSelectOption({ value: subsidiary.id, text: subsidiary.name, isSelected: isSelected })
        })

        filterSubsidiaryFieldValue = filterSubsidiaryFieldValue || subsidiaries[0].id

        searchFilters.push({
          name: 'subsidiary',
          operator: search.Operator.ANYOF,
          values: filterSubsidiaryFieldValue
        })
        //-----------------------------------entity (Client) ---------------------------------------------
        const filterEntityFieldId = 'custpage_filter_rec_entity'

        const filterEntityField = form.addField({
          id: filterEntityFieldId,
          type: serverWidget.FieldType.SELECT,
          label: 'Cliente',
          container: filtersFieldGroupId
        })

        var filterEntityFieldValue = parameters[filterEntityFieldId] // || runtime.getCurrentUser().entity
        const entities = _fetchEntities()

        filterEntityField.addSelectOption({ value: '', text: '', isSelected: true })

        entities.forEach(function (entity) {
          const isSelected = entity.id === filterEntityFieldValue
          filterEntityField.addSelectOption({ value: entity.id, text: entity.name, isSelected: isSelected })
        })

        // filterEntityFieldValue = filterEntityFieldValue ||'' // entities[0].id
        if (filterEntityFieldValue) {
          searchFilters.push({
            name: 'entity',
            operator: search.Operator.ANYOF,
            values: filterEntityFieldValue
          })
        }
        //------------------------------BANCO--------------------------------------------------------
        const filterRecBankAccountFieldId = 'custpage_filter_rec_bank_acc'

        const filterRecBankAccountField = form.addField({
          id: filterRecBankAccountFieldId,
          type: serverWidget.FieldType.SELECT,
          label: 'Conta Banco Cobrança',
          container: filtersFieldGroupId
        })

        var filterRecBankAccountFieldValue = parameters[filterRecBankAccountFieldId]

        filterRecBankAccountField.addSelectOption({ value: '', text: '', isSelected: true })
        const bankAccounts = collectBatchDAO.fetchBankAccountsBySubsidiary(filterSubsidiaryFieldValue)

        if (filterSubsidiaryFieldValue) {

          bankAccounts.forEach(function (bankAccount) {
            const isSelected = bankAccount.account === filterRecBankAccountFieldValue
            filterRecBankAccountField.addSelectOption({ value: bankAccount.account, text: bankAccount.name, isSelected: isSelected })
          })

          if (filterRecBankAccountFieldValue) {
            searchFilters.push({
              name: 'custbody_sit_transaction_l_conta_prev', //Verficar onde iremos retirar a informação
              operator: search.Operator.ANYOF,
              values: filterRecBankAccountFieldValue
            })
          }
        }
        //-------------------------------------data------------------------------------------------------------
        const filterDueDateFromFieldId = 'custpage_filter_rec_due_date_from'

        const filterDueDateFromField = form.addField({
          id: filterDueDateFromFieldId,
          type: serverWidget.FieldType.DATE,
          label: 'Data de emissão - DE',
          container: filtersFieldGroupId
        })

        var today = new Date()
        var filterDueDateFromFieldValue = parameters[filterDueDateFromFieldId]
        if (!filterDueDateFromFieldValue) {
          filterDueDateFromFieldValue = format.format({ type: format.Type.DATE, value: today })
        }

        filterDueDateFromField.defaultValue = filterDueDateFromFieldValue

        const filterDueDateToFieldId = 'custpage_filter_rec_due_date_to'

        const filterDueDateToField = form.addField({
          id: filterDueDateToFieldId,
          type: serverWidget.FieldType.DATE,
          label: 'Data de emissão - ATÉ',
          container: filtersFieldGroupId
        })

        var lastDayOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        var filterDueDateToFieldValue = parameters[filterDueDateToFieldId]
        if (!filterDueDateToFieldValue) {
          filterDueDateToFieldValue = format.format({ type: format.Type.DATE, value: lastDayOfThisMonth })
        }

        filterDueDateToField.defaultValue = filterDueDateToFieldValue

        searchFilters.push({
          name: 'trandate',
          operator: search.Operator.WITHIN,
          values: [filterDueDateFromFieldValue, filterDueDateToFieldValue]
        })

        // searchFilters.push({
        //   name: 'custrecord_o2s_cod_pagto_l_forma_pagto',
        //   join: 'custbody_sit_transaction_l_cond_pagto',
        //   operator: search.Operator.IS,
        //   values: 11 // Boleto
        // })

        //------------------------------------------ outros ----------------------------------------------

        const filtersFields = [
          filterSubsidiaryField,
          filterRecBankAccountField,
          filterDueDateFromField,
          filterDueDateToField,
          filterEntityField,
        ]

        form.addField({
          id: 'custpage_filter_rec_fields',
          type: serverWidget.FieldType.LONGTEXT,
          label: 'Filter Fields'
        })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
          })
          .defaultValue = JSON.stringify(filtersFields)

        form.addButton({ id: 'custpage_apply_rec_filters', label: 'Aplicar filtros', functionName: 'applyFilters' })
      }
      //--------------------------------------------Sublista--------------------------------------------------------------------
      const installmentsSublist = form.addSublist({ id: 'installments_rec', type: serverWidget.SublistType.LIST, label: 'Parcelas' })
      installmentsSublist.addMarkAllButtons()

      installmentsSublist.addField({ id: 'custpage_transaction_rec_id', type: serverWidget.FieldType.TEXT, label: 'Transação ID' })
        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })

      installmentsSublist.addField({ id: 'custpage_selected_rec', type: serverWidget.FieldType.CHECKBOX, label: 'Selecionar' })
      installmentsSublist.addField({ id: 'custpage_transaction_rec_entity', type: serverWidget.FieldType.TEXT, label: 'Entidade' })
      installmentsSublist.addField({ id: 'custpage_transaction_rec_number', type: serverWidget.FieldType.TEXT, label: 'Transação' })
      installmentsSublist.addField({ id: 'custpage_installment_rec_number', type: serverWidget.FieldType.TEXT, label: 'Parcela' })
      installmentsSublist.addField({ id: 'custpage_installment_rec_due_date', type: serverWidget.FieldType.DATE, label: 'Vencimento' })
      installmentsSublist.addField({ id: 'custpage_installment_rec_amount', type: serverWidget.FieldType.CURRENCY, label: 'Valor' })
      // installmentsSublist.addField({ id: 'custpage_installment_rec_due_amount', type: serverWidget.FieldType.CURRENCY, label: 'Valor (Em aberto)' })
      // installmentsSublist.addField({ id: 'custpage_installment_rec_payment_amount', type: serverWidget.FieldType.CURRENCY, label: 'Valor (Pagamento)' })
      installmentsSublist.addField({ id: 'custpage_discount_rec', type: serverWidget.FieldType.CURRENCY, label: 'Desconto' })
        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY })
      installmentsSublist.addField({ id: 'custpage_interest', type: serverWidget.FieldType.CURRENCY, label: 'Juros' })
        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY })

      var iline = 0
      search.create({
        type: search.Type.INVOICE,
        filters: searchFilters,
        columns: [
          { name: 'entity' },
          { name: 'invoicenum' },
          { name: 'custrecord_sit_parcela_i_numero', join: 'custrecord_sit_parcela_l_transacao' },
          { name: 'custrecord_sit_parcela_d_dt_vencimen', join: 'custrecord_sit_parcela_l_transacao' },
          { name: 'custrecord_sit_parcela_n_valor', join: 'custrecord_sit_parcela_l_transacao' },
          { name: 'subsidiary' },
          { name: 'custbody_sit_transaction_l_cond_pagto' },
        ]
      })
        .run()
        .getRange({
          start: 0,
          end: 1000
        })
        .forEach(function (result, line) {
          const columns = result.columns
          let urlInvoice = url.resolveRecord({
            recordType: 'invoice',
            recordId: result.id,
            isEditMode: false
          });
          let myUrl = '<a href="' + urlInvoice + '">"' + result.getValue(columns[1]) + '"</a>'
          const fields = [
            { id: 'custpage_transaction_rec_id', value: result.id },
            { id: 'custpage_transaction_rec_entity', value: result.getText(columns[0]) },
            { id: 'custpage_transaction_rec_number', value: myUrl },
            { id: 'custpage_installment_rec_number', value: result.getValue(columns[2]) },
            { id: 'custpage_installment_rec_due_date', value: result.getValue(columns[3]) },
            { id: 'custpage_installment_rec_amount', value: result.getValue(columns[4]) },
          ]

          const existCollect = search.create({
            type: 'customrecord_ps_collect',
            filters: [{
              name: 'custrecord_ps_collect_transaction',
              operator: search.Operator.ANYOF,
              values: result.id
            }],
            columns: [
              { name: 'internalid' },
            ]
          })
            .run()
            .getRange({
              start: 0,
              end: 1
            })
            .reduce(function (acc, result) {
              const columns = result.columns
              acc.collectTransactionId = result.getValue(columns[0])
              return acc
            }, {})

          if (existCollect.collectTransactionId) {
            return
          }

          // custrecord_o2s_cod_pagto_l_forma_pagto = 11
          // custbody_sit_transaction_l_cond_pagto

          const collectType = search.lookupFields({
            type: 'customrecord_sit_cod_pagto',
            id: result.getValue(columns[6]),
            columns: ['custrecord_o2s_cod_pagto_l_forma_pagto']
          }).custrecord_o2s_cod_pagto_l_forma_pagto[0].value
          log.debug('collectType', collectType)
          if (collectType !== '11') {  // Forma de pagamento = boleto
            return
          }
          fields.forEach(function (field) {
            var value = field.value
            if (!value) return
            installmentsSublist.setSublistValue({ id: field.id, value: value, line: iline })
          })
          iline += 1
          return true
        })

      //----------------------------------------------Seleção banco e botão enviar--------------------------------------

      form.clientScriptModulePath = '../clients/ps_cnab_cl_add_collect.js' //'../clients/ps_cnab_cl_add_payment.js'

      form.addField({
        id: 'custpage_server_rec_script',
        type: serverWidget.FieldType.LONGTEXT,
        label: 'Server Script'
      })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        })
        .defaultValue = JSON.stringify(runtime.getCurrentScript())

      form.addSubmitButton({ label: 'Enviar' })

      return form
    }

    /**
* Fetch subsidiaries.
*
* @returns {{name: string, id: number}[]}
* @private
*/
    function _fetchSubsidiaries() {
      return search.create({
        type: search.Type.SUBSIDIARY,
        columns: [
          { name: 'namenohierarchy' }
        ]
      })
        .run()
        .getRange({
          start: 0,
          end: 1000
        })
        .map(function (result) {
          const columns = result.columns
          return {
            id: result.id,
            name: result.getValue(columns[0])
          }
        })
    }


    /**
    * Fetch entities.
    *
    * @returns {{name: string, id: number}[]}
    * @private
    */
    function _fetchEntities() {
      return search.create({
        type: "customer",
        columns:
          [
            search.createColumn({
              name: "altname",
              sort: search.Sort.ASC,
              label: "Name"
            }),
          ]
      })
        .run()
        .getRange({
          start: 0,
          end: 1000
        })
        .map(function (result) {
          const columns = result.columns
          return {
            id: result.id,
            name: result.getValue(columns[0])
          }
        })
    }
    return {
      onRequest: onRequest
    }
  });
