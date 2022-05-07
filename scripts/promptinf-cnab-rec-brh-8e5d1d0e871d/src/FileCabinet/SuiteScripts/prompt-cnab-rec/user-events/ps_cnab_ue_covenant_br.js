/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/runtime', 'N/search', 'N/record', 'N/error', 'N/ui/serverWidget', '../modules/tecnospeed/index'],
    function (runtime, search, record, error, serverwidget, Tecnospeed) {

        function afterSubmit(context) {

            const newRecord = context.newRecord
            const type = context.type
            const UserEventType = context.UserEventType

            idBankAccount = newRecord.getValue({ fieldId: 'custrecord_ps_ccv_bank_account' })
            idCovenant = newRecord.getValue({ fieldId: 'custrecord_ps_ccv_id_covenant' })
            remNumber = newRecord.getValue({ fieldId: 'custrecord_ps_ccv_remnum' }) || 0 

            log.debug({
                title: 'idBankAccount',
                details: idBankAccount
            })

            collect = search.lookupFields({
                type: 'customrecord_ps_bank_account',
                id: idBankAccount,
                columns: ['custrecord_ps_bac_id_collect', 'custrecord_ps_bac_subsidiary_owner']
            })

            idAccount = parseInt(collect.custrecord_ps_bac_id_collect)
            idSubsidiary = collect.custrecord_ps_bac_subsidiary_owner[0].value

            log.debug('idSubsidiary', idSubsidiary)

            cnpj = search.lookupFields({
                type: 'subsidiary',
                id: idSubsidiary,
                columns: ['custrecord_psg_br_cnpj']
            }).custrecord_psg_br_cnpj

            log.debug('cnpj', cnpj)

            layout = '400'

            covenant = {
                "ConvenioNumero": newRecord.getValue({ fieldId: 'custrecord_ps_ccv_number' }),
                "ConvenioDescricao": newRecord.getValue({ fieldId: 'custrecord_ps_ccv_desc' }),
                "ConvenioCarteira": newRecord.getValue({ fieldId: 'custrecord_ps_ccv_paybook_code' }),
                "ConvenioEspecie": newRecord.getValue({ fieldId: 'custrecord_ps_ccv_convkind' }),
                "ConvenioPadraoCNAB": layout,
                "ConvenioNumeroRemessa": remNumber,
                "ConvenioDensidaDeRemessa": newRecord.getValue({ fieldId: 'custrecord_ps_ccv_remidens' }),
                "ConvenioReiniciarDiariamente": false,
                "Conta": idAccount
            }

            tecnospeedApi = new Tecnospeed()
            collectApi = tecnospeedApi.Collect({ cpfCnpj: cnpj })

            if (type === UserEventType.CREATE) { //  || !idCovenant
                log.debug('Entrou no Create', covenant)
                
                try {
                    collectApiResponse = collectApi.createCovenant(covenant)
                    log.debug('collectApiResponse-create', collectApiResponse)
                } catch (e) {
                    throw e
                }
                record.submitFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    values: {
                        custrecord_ps_ccv_id_covenant: collectApiResponse._dados.id,
                        custrecord_ps_ccv_remnum: collectApiResponse._dados.numero_remessa,
                    }
                })
            }
            if (type === UserEventType.EDIT && idCovenant) {
                log.debug('Entrou no Edit', covenant)
                try {
                    collectApiResponse = collectApi.updateCovenant(covenant, idCovenant)
                    log.debug('collectApiResponse-edit', collectApiResponse)
                } catch (e) {
                    throw e
                }
                record.submitFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    values: {
                        custrecord_ps_ccv_remnum: collectApiResponse._dados.numero_remessa   // Verficar necessidade após implementar script de remessa !!!!
                    }
                })

            }
        }

        return {
            afterSubmit: afterSubmit
        }
    });
