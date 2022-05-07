/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/record', 'N/format','../modules/tecnospeed/index',],
    function (search, record, format, Tecnospeed) {

        function onRequest(context) {

            const requestBody = JSON.parse(context.request.body)
            const statusReturn = requestBody.tipoWH
            const collect = requestBody.titulo
            const uniqueId = collect.idintegracao
           
            const psCollect = search.create({
                type: 'customrecord_ps_collect',
                filters: [{
                    name: 'custrecord_ps_collect_id',
                    operator: search.Operator.IS,
                    values: uniqueId
                }],
                columns: [
                    { name: 'internalid' },
                    { name: 'custrecord_ps_collect_transaction' },
                    { name: 'custrecord_ps_collect_installment' },
                    { name: 'custrecord_ps_collect_subsidiary' },
                ]
            })
                .run()
                .getRange({
                    start: 0,
                    end: 1
                })
                .reduce(function (acc, result) {
                    const columns = result.columns
                    acc.psCollectId = result.getValue(columns[0])
                    acc.transactionId = result.getValue(columns[1])
                    acc.installment = result.getValue(columns[2])
                    acc.subsidiaryId = result.getValue(columns[3])
                    return acc
                }, {})

            log.debug('psCollect', psCollect)

            const subsidiaryCpfCnpj = search.lookupFields({
                type: 'subsidiary',
                id: psCollect.subsidiaryId,
                columns: ['custrecord_psg_br_cnpj']
            }).custrecord_psg_br_cnpj

            const tecnospeedApi = new Tecnospeed()
            const collectApi = tecnospeedApi.Collect({ cpfCnpj: subsidiaryCpfCnpj })
            const collectApiResponse = collectApi.fetchCollect(uniqueId)

            log.debug('collectApiResponse',collectApiResponse._dados)
  
            if (statusReturn === "notifica_registrou") {

                record.submitFields({
                    type: 'customrecord_ps_collect',
                    id: psCollect.psCollectId,
                    values: {
                        custrecord_ps_collect_status: 'REGISTRADO',
                        // custrecord_ps_collect_pdf_file: collectApiResponse._dados[0].UrlBoleto
                    }
                })
            }

            if (statusReturn === "notifica_baixou") {

                record.submitFields({
                    type: 'customrecord_ps_collect',
                    id: psCollect.psCollectId,
                    values: {
                        custrecord_ps_collect_status: 'BAIXADO',
                    }
                })
            }

            if (statusReturn === "notifica_rejeitou") {

                record.submitFields({
                    type: 'customrecord_ps_collect',
                    id: psCollect.psCollectId,
                    values: {
                        custrecord_ps_collect_status: 'REJEITADO',
                    }
                })
            }

            if (statusReturn === "notifica_protestou") {

                record.submitFields({
                    type: 'customrecord_ps_collect',
                    id: psCollect.psCollectId,
                    values: {
                        custrecord_ps_collect_status: ' INCLUIDO_CARTORIO',
                    }
                })
            }

            if (statusReturn === "notifica_liquidou") {

                const paidDate = new Date(collect.PagamentoData)
                // const paidDate = new Date()

                log.debug('paidDate', paidDate)

                record.submitFields({
                    type: 'customrecord_ps_collect',
                    id: psCollect.psCollectId,
                    values: {
                        custrecord_ps_collect_status: 'LIQUIDADO',
                    }
                })

                const invoicePayment = record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: psCollect.transactionId,
                    toType: "customerpayment",
                    isDynamic: true
                })

                var paidParcel = search.create({
                    type: 'customrecord_sit_parcela',
                    filters: [
                        {
                            name: 'custrecord_sit_parcela_l_transacao',
                            operator: search.Operator.IS,
                            values: psCollect.transactionId
                        },
                        {
                            name: 'custrecord_sit_parcela_i_numero',
                            operator: search.Operator.IS,
                            values: psCollect.installment
                        },
                    ],
                    columns: [
                        { name: 'internalid' },
                        { name: 'custrecord_sit_parcela_l_conta_prev' },
                    ]
                })
                    .run()
                    .getRange({
                        start: 0,
                        end: 1
                    })
                    .reduce(function (acc, result) {
                        const columns = result.columns
                        acc.parcelId = result.getValue(columns[0])
                        acc.forecastBankAcc = result.getValue(columns[1])
                        return acc
                        }, '')

                const paidParcelRecordType = 'customrecord_sit_parcela_qui'
                const paidParcelBatch = record.create({ type: paidParcelRecordType })
                paidParcelBatch.setValue({ fieldId: 'custrecord_sit_parcela_qui_l_tran_pag', value: psCollect.transactionId })
                paidParcelBatch.setValue({ fieldId: 'custrecord_sit_parcela_qui_l_parcela', value: paidParcel.parcelId })

                paidParcelBatch.setValue({ fieldId: 'custrecord_sit_parcela_qui_n_valor_pago', value: parseFloat(collectApiResponse._dados[0].PagamentoValorPago )})
                paidParcelBatch.setValue({ fieldId: 'custrecord_sit_parcela_qui_d_data_pag', value: collectApiResponse._dados[0].PagamentoData })

                paidParcelBatch.setValue({ fieldId: 'custrecord_sit_parcela_qui_t_efetivado', value: 'S' })
                paidParcelBatch.setValue({ fieldId: 'custrecord_sit_parcela_qui_t_chave_tran', value: uniqueId })
                const paidParcelBatchId = paidParcelBatch.save()

                invoicePayment.setValue({ fieldId: 'account', value: paidParcel.forecastBankAcc })

                const applySublistId = 'apply'
                const applyCount = invoicePayment.getLineCount({ sublistId: applySublistId })

                for (var i = 0; i < applyCount; i++) {
                    invoicePayment.selectLine({ sublistId: applySublistId, line: i })
                    var applied = invoicePayment.getCurrentSublistValue({ sublistId: applySublistId, fieldId: 'apply' })

                    if (!applied) continue

                    invoicePayment.setCurrentSublistValue({ sublistId: applySublistId, fieldId: 'apply', value: true })
                    invoicePayment.setCurrentSublistValue({ sublistId: applySublistId, fieldId: 'amount', value:  parseFloat(collectApiResponse._dados[0].PagamentoValorPago) })

                }

                invoicePayment.setValue({ fieldId: 'trandate', value: paidDate })
                invoicePayment.setValue({ fieldId: 'approvalstatus', value: 2 }) // Approved

                invoicePayment.save({ ignoreMandatoryFields: true })
            }
        }
        return {
            onRequest: onRequest
        };
    });

