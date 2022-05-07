/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(['N/runtime', 'N/search', 'N/record', 'N/util', '../modules/collect-batch-dao', '../modules/collect-dao', '../modules/tecnospeed/index', 'N/format'],
    function (runtime, search, record, util, collectBatchDAO, collectDAO, Tecnospeed, format) {
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
        function getInputData() {
            const collectBatchId = _getCollectBatchId()
            const collectBatchColumns = [
                'custrecord_ps_cob_installments'
            ]

            const collectBatchValues = search.lookupFields({
                type: 'customrecord_ps_collect_batch',
                id: collectBatchId,
                columns: collectBatchColumns
            })

            const installments = JSON.parse(collectBatchValues[collectBatchColumns[0]])

            return installments.map(function (installment) {
                return {
                    installment: installment,
                    collectBatchId: collectBatchId
                }
            })
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            const data = JSON.parse(context.value)
            const installment = data.installment
            const collectBatchId = data.collectBatchId
            const transactionId = installment[0]
            const installmentNumber = installment[1]
            const collectAmount = installment[2]
            const collectDiscount = installment[3]
            const collectInterest = installment[4]
            const cDate = new Date(installment[5])

            //fazer uma busca salva para buscar as informações de mensagem, nosso numero(pela cadatro de conta)
            const collect = search.create({
                type: search.Type.TRANSACTION,
                filters: [{
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: transactionId
                }, {
                    name: 'custrecord_sit_parcela_i_numero',
                    join: 'custrecord_sit_parcela_l_transacao',
                    operator: search.Operator.EQUALTO,
                    values: installmentNumber
                }, {
                    name: 'mainline',
                    operator: search.Operator.IS,
                    values: true
                }],
                columns: [
                    { name: 'formulatext', formula: "TO_CHAR({custrecord_sit_parcela_l_transacao.custrecord_sit_parcela_d_dt_vencimen}, 'YYYY-MM-DD')" }, //0
                    { name: 'formulatext', formula: "TO_CHAR({custrecord_sit_parcela_l_transacao.custrecord_sit_parcela_d_dt_vencimen}, 'YYYY-MM-DD')" }, //1
                    { name: 'entity' }, //2
                    { name: 'altname', join: 'customer' }, //3 sacado nome
                    { name: 'custentity_psg_br_cnpj', join: 'customer' }, //4
                    { name: 'email', join: 'customer' }, //5
                    { name: 'phone', join: 'customer' }, //6
                    { name: 'altphone', join: 'customer' }, //7
                    { name: 'country', join: 'customer' }, //8

                    { name: 'address1', join: 'billingaddress' }, //9 logradouro
                    { name: 'custrecord_sit_address_i_numero', join: 'billingaddress' }, //10
                    { name: 'custrecord_sit_address_complemento', join: 'billingaddress' }, //11
                    { name: 'custrecord_o2g_address_l_mun', join: 'billingaddress' }, //12 cidade
                    { name: 'custrecord_sit_address_t_bairro', join: 'billingaddress' }, //13
                    { name: 'state', join: 'billingaddress' }, //14 estado
                    { name: 'zip', join: 'billingaddress' }, //15

                    { name: 'trandate' }, //16
                    { name: 'custrecord_sit_parcela_d_dt_vencimen', join: 'custrecord_sit_parcela_l_transacao' }, //17
                    { name: 'tranid' }, //18
                    { name: 'custbody_sit_transaction_l_conta_prev' }, //19
                    { name: 'custrecord_sit_parcela_n_valor', join: 'custrecord_sit_parcela_l_transacao' }, //20
                    { name: 'custrecord_psg_br_cnpj', join: 'subsidiary' }, //21
                    { name: 'internalid', join: 'custrecord_sit_parcela_l_transacao' }, //22
                ]
            })
                .run()
                .getRange({
                    start: 0,
                    end: 1
                })
                .reduce(function (acc, result) {
                    const columns = result.columns

                    var idPsBank = search.create({
                        type: 'customrecord_ps_bank_account',
                        filters: [{
                            name: 'custrecord_ps_bac_account', // criado
                            operator: search.Operator.IS,
                            values: result.getValue(columns[19])
                        }],
                        columns: [{
                            name: 'internalid'
                        }]
                    })
                        .run()
                        .getRange({
                            start: 0,
                            end: 1
                        })
                        .reduce(function (acc, result) {
                            return result.getValue(result.columns[0])
                        }, '')

                    log.debug('idPsBank', idPsBank)

                    var bankAccount = search.lookupFields({
                        type: 'customrecord_ps_bank_account',
                        id: idPsBank,
                        columns: [
                            'custrecord_ps_bac_account_number',
                            'custrecord_ps_bac_account_digit',
                            'custrecord_ps_bac_bank_code',
                            'custrecord_ps_bac_instruction1',
                            'custrecord_ps_bac_instruction2',
                            'custrecord_ps_bac_instruction3',
                            'custrecord_ps_bac_instruction4',
                        ]
                    })

                    log.debug('bankAccount', bankAccount)
                    var covenant = search.create({
                        type: 'customrecord_ps_collect_covenant',
                        filters: [{
                            name: 'custrecord_ps_ccv_bank_account',
                            operator: search.Operator.IS,
                            values: idPsBank
                        }],
                        columns: [{
                            name: 'custrecord_ps_ccv_number'
                        }]
                    })
                        .run()
                        .getRange({
                            start: 0,
                            end: 1
                        })
                        .reduce(function (acc, result) {
                            return result.getValue(result.columns[0])
                        }, '')

                    acc.CedenteContaNumero = bankAccount.custrecord_ps_bac_account_number
                    acc.CedenteContaNumeroDV = bankAccount.custrecord_ps_bac_account_digit
                    acc.CedenteConvenioNumero = covenant
                    acc.CedenteContaCodigoBanco = bankAccount.custrecord_ps_bac_bank_code
                    acc.SacadoCpfCnpj = result.getValue(columns[4])
                    acc.SacadoEmail = result.getValue(columns[5])
                    acc.SacadoEnderecoNumero = result.getValue(columns[10])
                    acc.SacadoEnderecoCep = result.getValue(columns[15])
                    acc.SacadoEnderecoCidade = result.getValue(columns[12])
                    acc.SacadoEnderecoComplemento = result.getValue(columns[11])
                    acc.SacadoEnderecoLogradouro = result.getValue(columns[9])
                    acc.SacadoEnderecoPais = result.getValue(columns[8])
                    acc.SacadoEnderecoUF = result.getValue(columns[14])
                    acc.SacadoNome = result.getValue(columns[3])
                    acc.SacadoTelefone = result.getValue(columns[6])
                    acc.SacadoCelular = result.getValue(columns[7])
                    acc.TituloDataEmissao = result.getValue(columns[16])
                    acc.TituloDataVencimento = result.getValue(columns[17])
                    acc.TituloMensagem01 = bankAccount.custrecord_ps_bac_instruction1
                    acc.TituloMensagem02 = bankAccount.custrecord_ps_bac_instruction2
                    acc.TituloMensagem03 = bankAccount.custrecord_ps_bac_instruction3
                    acc.TituloNossoNumero = result.getValue(columns[22]) 
                    acc.TituloNumeroDocumento = result.getValue(columns[18])
                    acc.TituloValor = result.getValue(columns[20])
                    acc.TituloLocalPagamento = bankAccount.custrecord_ps_bac_bank_instruction4

                    acc.entityId = result.getValue(columns[2])
                    acc.subsidiaryCpfCnpj = result.getValue(columns[21])

                    return acc
                }, {})

            const entityId = collect.entityId
            const subsidiaryCpfCnpj = collect.subsidiaryCpfCnpj
            delete collect.entityId
            delete collect.subsidiaryCpfCnpj

            log.debug('collect', collect)

            const collectRecordType = 'customrecord_ps_collect'
            log.debug('antes do create record')

            const collectRecord = record.create({ type: collectRecordType })
            log.debug('depois do create record')

            collectRecord.setValue({ fieldId: 'custrecord_ps_collect_entity', value: entityId })
            collectRecord.setValue({ fieldId: 'custrecord_ps_collect_transaction', value: transactionId })
            collectRecord.setValue({ fieldId: 'custrecord_ps_collect_installment', value: installmentNumber })
            collectRecord.setValue({ fieldId: 'custrecord_ps_collect_amount', value: collectAmount })
            collectRecord.setValue({ fieldId: 'custrecord_ps_collect_discount', value: collectDiscount })
            collectRecord.setValue({ fieldId: 'custrecord_ps_collect_interest', value: collectInterest })
            collectRecord.setValue({ fieldId: 'custrecord_ps_collect_batch', value: collectBatchId })
            collectRecord.setValue({ fieldId: 'custrecord_ps_collect_duedate', value: cDate })
            const collectRecordId = collectRecord.save({ enableSourcing: true })

            const tecnospeedApi = new Tecnospeed()
            const collectApi = tecnospeedApi.Collect({ cpfCnpj: subsidiaryCpfCnpj })


            try {
                const collectApiResponse = collectApi.createCollect([collect])

                log.debug('collectApiResponse', collectApiResponse)

                if (collectApiResponse._dados._sucesso) {
                    record.submitFields({
                        type: collectRecordType,
                        id: collectRecordId,
                        values: {
                            custrecord_ps_collect_id: collectApiResponse._dados._sucesso[0].idintegracao,
                            custrecord_ps_collect_status: collectApiResponse._dados._sucesso[0].situacao
                        }
                    })
                }
            } catch (e) {
                log.error({ title: 'PROMPT_CREATE_COLLECT', details: e })
                record.submitFields({
                    type: collectRecordType,
                    id: collectRecordId,
                    values: {
                        custrecord_ps_collect_errors: JSON.stringify(e)
                    }
                })
            }
        }

        function summarize(summary) {
            const inputSummaryError = summary.inputSummary.error

            if (inputSummaryError) {
                log.error({ title: 'Input Error', details: inputSummaryError })
            }

            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error({ title: 'Map Error for key: ' + key, details: error })
                return true
            })

            const collectBatchId = _getCollectBatchId()

            collectBatchDAO.updateTaskFinished(collectBatchId, true)

        }

        /**
        * Get collect batch ID.
        *
        * @returns {string}
        * @private
        */
        function _getCollectBatchId() {
            return runtime.getCurrentScript().getParameter({ name: 'custscriptcustscript_ps_collect_batch_to' })
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        }
    });
