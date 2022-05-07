/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/redirect', 'N/runtime', 'N/task', '../modules/tecnospeed/index', 'N/url', 'N/file', 'N/encode',],
  function (serverWidget, search, record, redirect, runtime, task, Tecnospeed, url, file, encode) {
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     */
    function onRequest(context) {
      const request = context.request
      const response = context.response
      const parameters = request.parameters

      if (request.method === 'GET') {
        response.writePage({
          pageObject: _buildCollectList(parameters)
        })
      } else { // POST
        const selectedCollectIds = []
        const selectedCollectExternalIds = []
        const collectSublistId = 'collect'
        const installmentsCount = request.getLineCount({ group: collectSublistId })
        for (var line = 0; line < installmentsCount; line++) {
          var isSelected = request.getSublistValue({ group: collectSublistId, name: 'custpage_selected', line: line }) === 'T'
          if (isSelected) {
            var id = request.getSublistValue({ group: collectSublistId, name: 'custpage_id', line: line })
            selectedCollectIds.push(id)
            var externalId = request.getSublistValue({ group: collectSublistId, name: 'custpage_external_id', line: line })
            selectedCollectExternalIds.push(externalId)
          }
        }

        if (!selectedCollectIds.length) return

        const subsidiaryId = parameters.custpage_filter_subsidiary
        const subsidiaryCpfCnpj = search.lookupFields({ type: search.Type.SUBSIDIARY, id: subsidiaryId, columns: ['custrecord_psg_br_cnpj'] }).custrecord_psg_br_cnpj

        const tecnospeedApi = new Tecnospeed()
        const collectApi = tecnospeedApi.Collect({ cpfCnpj: subsidiaryCpfCnpj })

        const remType = JSON.parse(parameters.custpage_filter_fields)[2].defaultValue

        var collectRemittanceId, collectApiResponse

        if (remType === 'REMESSA') {

          collectApiResponse = collectApi.createRemittance(selectedCollectExternalIds)
          log.debug('collectApiResponse Remessa', collectApiResponse)

          const collectRemittance = record.create({ type: 'customrecord_ps_collect_remit' })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_subsidiary', value: subsidiaryId })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_collect', value: JSON.stringify(selectedCollectIds) })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_typerem', value: 'REMESSA' })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_status', value: collectApiResponse._status })
          // collectRemittance.setValue({ fieldId: 'custrecord_ps_core_id', value: collectApiResponse... })
          collectRemittanceId = collectRemittance.save()

          const content = collectApiResponse._dados._sucesso[0].remessa
          log.debug('content', content)

          if (content) {

            const remittanceFileName = 'REM' + collectRemittanceId + '.txt'

            const remittanceFile = file.create({
              name: remittanceFileName,
              fileType: file.Type.PLAINTEXT,
              contents: encode.convert({
                string: content,
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
              }),
              encoding: file.Encoding.UTF8,
              folder: _getRemittanceFolderId()
            })

            log.debug('remittanceFile', remittanceFile)

            const remFile = remittanceFile.save()

            record.submitFields({
              type: 'customrecord_ps_collect_remit',
              id: collectRemittanceId,
              values: { 'custrecord_ps_core_file': remFile }
            })

            redirect.toRecord({
              type: 'customrecord_ps_collect_remit',
              id: collectRemittanceId
            })
          }

        } else if (remType === 'BAIXA') {
          collectApiResponse = collectApi.dischargeRemittance(selectedCollectExternalIds)

          log.debug('collectApiResponse Baixa', collectApiResponse)

          const collectRemittance = record.create({ type: 'customrecord_ps_collect_remit' })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_subsidiary', value: subsidiaryId })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_collect', value: JSON.stringify(selectedCollectIds) })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_typerem', value: 'BAIXA' })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_status', value: collectApiResponse._status })
          collectRemittanceId = collectRemittance.save()

        } else {  // 'ALTERA_VENCTO'

          var newBody = {
            "Tipo": "0",
            "Boletos": null
          }
          var collectList = []
          for (var line = 0; line < installmentsCount; line++) {
            var isSelected = request.getSublistValue({ group: collectSublistId, name: 'custpage_selected', line: line }) === 'T'
            if (isSelected) {
              var id = request.getSublistValue({ group: collectSublistId, name: 'custpage_id', line: line })
              selectedCollectIds.push(id)

              var externalId = request.getSublistValue({ group: collectSublistId, name: 'custpage_external_id', line: line })
              var newDate = request.getSublistValue({ group: collectSublistId, name: 'custpage_due_date', line: line })

              log.debug('newDate', newDate)

              collectList.push({
                "IdIntegracao": externalId,
                "TituloDataVencimento": newDate,
              })
            }
          }

          log.debug('collectList', collectList)

          newBody.Boletos = collectList

          log.debug('newBody', newBody)

          collectApiResponse = collectApi.updateRemittance(newBody)

          log.debug('collectApiResponse Atualiza', collectApiResponse)

          const collectRemittance = record.create({ type: 'customrecord_ps_collect_remit' })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_subsidiary', value: subsidiaryId })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_collect', value: JSON.stringify(selectedCollectIds) })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_typerem', value: 'ALTERA_VENCTO' })
          collectRemittance.setValue({ fieldId: 'custrecord_ps_core_status', value: collectApiResponse._status })
          collectRemittanceId = collectRemittance.save()

        }

        if (collectApiResponse) {
          const collectRemittanceTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: 'customscript_ps_cnab_mr_generate_collect',
            deploymentId: 'customdeploy_ps_cnab_mr_generate_collect',
            params: {
              custscript_ps_collect_remittance_to_gen: collectRemittanceId
            }
          })

          const collectRemittanceTaskId = collectRemittanceTask.submit()

          record.submitFields({
            type: 'customrecord_ps_collect_remit',
            id: collectRemittanceId,
            values: {
              custrecord_ps_core_task_id: collectRemittanceTaskId
            }
          })

        }

        redirect.toRecord({
          type: 'customrecord_ps_collect_remit',
          id: collectRemittanceId
        })
      }
    }

    /**
     * Build collect list.
     *
     * @param parameters
     * @returns {void}
     * @private
     */
    function _buildCollectList(parameters) {
      const form = serverWidget.createForm({ title: 'Gerar remessa de boletos' })

      const searchFilters = [{
        name: 'custrecord_ps_collect_id',
        operator: search.Operator.ISNOTEMPTY
      }]

      const filtersFieldGroupId = 'filters'
      form.addFieldGroup({ id: filtersFieldGroupId, label: 'Filtros' })
      //------------------------------------Subsidiary--------------------------------------
      const filterSubsidiaryFieldId = 'custpage_filter_subsidiary'

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
        name: 'custrecord_ps_collect_subsidiary',
        operator: search.Operator.ANYOF,
        values: filterSubsidiaryFieldValue
      })
      //-----------------------------------------------Batch----------------------------
      const filterBatchFieldId = 'custpage_filter_batch'

      const filterBatchField = form.addField({
        id: filterBatchFieldId,
        type: serverWidget.FieldType.SELECT,
        label: 'Lote',
        source: 'customrecord_ps_collect_batch',
        container: filtersFieldGroupId
      })

      const batchId = parameters.custparam_batch_id || parameters[filterBatchFieldId]
      filterBatchField.defaultValue = batchId

      if (batchId) {
        searchFilters.push({
          name: 'custrecord_ps_collect_batch',
          operator: search.Operator.ANYOF,
          values: batchId,
        })
      }
      // --------------------------------------------type-remittance------------------------------------------------

      const filterRemittanceFieldId = 'custpage_filter_remittance'

      const filterRemittanceField = form.addField({
        id: filterRemittanceFieldId,
        type: serverWidget.FieldType.SELECT,
        label: 'Tipo de Remessa',
        container: filtersFieldGroupId
      })

      filterRemittanceField.addSelectOption({
        value: 'REMESSA',
        text: 'Remessa',
        isSelected: true
      });
      filterRemittanceField.addSelectOption({
        value: 'BAIXA',
        text: 'Pedido de Baixa'
      });
      filterRemittanceField.addSelectOption({
        value: 'ALTERA_VENCTO',
        text: 'Alteração de Vencimento'
      });

      var remittanceId = parameters[filterRemittanceFieldId]
      filterRemittanceField.defaultValue = remittanceId

      // --------------------------------------------------------------------------------------------
      const filtersFields = [
        filterSubsidiaryField,
        filterBatchField,
        filterRemittanceField
      ]

      form.addButton({ id: 'custpage_apply_filters', label: 'Aplicar filtros', functionName: 'applyFilters' })

      const collectSublist = form.addSublist({ id: 'collect', type: serverWidget.SublistType.LIST, label: 'Boletos' })
      collectSublist.addMarkAllButtons()

      // -------------------------------------------Hidden Fields---------------------------
      form.addField({
        id: 'custpage_filter_fields',
        type: serverWidget.FieldType.LONGTEXT,
        label: 'Filter Fields'
      })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        })
        .defaultValue = JSON.stringify(filtersFields)

      collectSublist.addField({ id: 'custpage_id', type: serverWidget.FieldType.TEXT, label: 'ID' })
        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })

      collectSublist.addField({ id: 'custpage_external_id', type: serverWidget.FieldType.TEXT, label: 'ID Externo' })
        .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })

      // --------------------------------------------Sublist------------------------------------------------
      collectSublist.addField({ id: 'custpage_selected', type: serverWidget.FieldType.CHECKBOX, label: 'Selecionar' })
      collectSublist.addField({ id: 'custpage_entity', type: serverWidget.FieldType.TEXT, label: 'Entidade' })
      collectSublist.addField({ id: 'custpage_transaction', type: serverWidget.FieldType.TEXT, label: 'Transação' })
      collectSublist.addField({ id: 'custpage_installment', type: serverWidget.FieldType.TEXT, label: 'Parcela' })
      collectSublist.addField({ id: 'custpage_due_date', type: serverWidget.FieldType.DATE, label: 'Vencimento' })
      collectSublist.addField({ id: 'custpage_amount', type: serverWidget.FieldType.CURRENCY, label: 'Valor' })
      collectSublist.addField({ id: 'custpage_discount', type: serverWidget.FieldType.CURRENCY, label: 'Desconto' })
      collectSublist.addField({ id: 'custpage_interest', type: serverWidget.FieldType.CURRENCY, label: 'Juros' })
      collectSublist.addField({ id: 'custpage_batch', type: serverWidget.FieldType.TEXT, label: 'Lote' })
      collectSublist.addField({ id: 'custpage_remittance', type: serverWidget.FieldType.TEXT, label: 'Remessa' })

      var iline = 0
      search.create({
        type: 'customrecord_ps_collect',
        filters:
          searchFilters
        ,
        columns: [
          { name: 'custrecord_ps_collect_id' },
          { name: 'altname', join: 'custrecord_ps_collect_entity' },
          { name: 'custrecord_ps_collect_transaction' },
          { name: 'custrecord_ps_collect_installment' },
          { name: 'custrecord_ps_collect_duedate' },
          { name: 'custrecord_ps_collect_amount' },
          { name: 'custrecord_ps_collect_discount' },
          { name: 'custrecord_ps_collect_interest' },
          { name: 'custrecord_ps_collect_batch' },
          { name: 'custrecord_ps_collect_rem' },
          { name: 'custrecord_ps_collect_status' }
        ]
      })
        .run()
        .getRange({
          start: 0,
          end: 1000
        })
        .forEach(function (result, line) {
          let urlInvoice = url.resolveRecord({
            recordType: 'customrecord_ps_collect',
            recordId: result.id,
            isEditMode: false
          });
          let myUrl = '<a href="' + urlInvoice + '"> Boleto "' + result.id + '"</a>'
          const columns = result.columns
          const fields = [
            { id: 'custpage_id', value: result.id },
            { id: 'custpage_external_id', value: result.getValue(columns[0]) },
            { id: 'custpage_entity', value: result.getValue(columns[1]) },
            { id: 'custpage_transaction', value: myUrl },
            { id: 'custpage_installment', value: result.getValue(columns[3]) },
            { id: 'custpage_due_date', value: result.getValue(columns[4]) },
            { id: 'custpage_amount', value: result.getValue(columns[5]) },
            { id: 'custpage_discount', value: result.getValue(columns[6]) },
            { id: 'custpage_interest', value: result.getValue(columns[7]) },
            { id: 'custpage_batch', value: result.getText(columns[8]) },
            { id: 'custpage_remittance', value: result.getText(columns[9]) }
          ]

          const statusCollect = result.getValue(columns[10])

          const selectRemmitance = filtersFields[2].defaultValue

          if (selectRemmitance === 'REMESSA') {
            if (statusCollect !== 'EMITIDO') {
              return
            }
          } else if (selectRemmitance === 'BAIXA') {
            if (statusCollect !== 'REGISTRADO') {
              return
            }
          } else {
            if (statusCollect !== 'SALVO' && statusCollect !== 'REGISTRADO' && statusCollect !== 'EMITIDO') {
              log.debug('entrei no if')
              return
            }
          }

          fields.forEach(function (field) {
            var value = field.value
            if (!value) return
            collectSublist.setSublistValue({ id: field.id, value: value, line: iline })
          })
          iline++
          return true
        })

      form.clientScriptModulePath = '../clients/ps_cnab_cl_generate_collect_remittance.js'

      form.addField({
        id: 'custpage_server_rec_script',
        type: serverWidget.FieldType.LONGTEXT,
        label: 'Server Script'
      })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN
        })
        .defaultValue = JSON.stringify(runtime.getCurrentScript())

      form.addSubmitButton({ label: 'Gerar' })

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
    * Get remittance folder ID.
    *
    * @returns {number}
    * @private
    */
    function _getRemittanceFolderId() {
      const folderName = 'PS CNAB Collect Remittance'

      var folderId = search.create({
        type: search.Type.FOLDER,
        filters: [{
          name: 'name',
          operator: search.Operator.IS,
          values: folderName
        }]
      })
        .run()
        .getRange({
          start: 0,
          end: 1
        })
        .reduce(function (acc, result) {
          return acc + result.id
        }, '')

      if (!folderId) {
        const folder = record.create({ type: record.Type.FOLDER })
        folder.setValue({ fieldId: 'name', value: folderName })
        folderId = folder.save({ ignoreMandatoryFields: true })
      }

      return folderId
    }

    return {
      onRequest: onRequest
    }
  })

