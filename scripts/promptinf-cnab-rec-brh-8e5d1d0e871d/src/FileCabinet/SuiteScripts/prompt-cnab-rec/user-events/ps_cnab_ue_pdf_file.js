/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record', '../modules/tecnospeed/index'],
    function (search, record, Tecnospeed) {

        function beforeLoad(context) {
            if (context.type !== context.UserEventType.VIEW) return
            const newRecord = context.newRecord

            // const pdfFile = newRecord.getValue({ fieldId: 'custrecord_ps_collect_pdf_file' })

            // if (pdfFile) return

            const idIntegracao = newRecord.getValue({ fieldId: 'custrecord_ps_collect_id' })
            const idSubsidiary = newRecord.getValue({ fieldId: 'custrecord_ps_collect_subsidiary' })

            const subsidiaryCpfCnpj = search.lookupFields({
                type: 'subsidiary',
                id: idSubsidiary,
                columns: ['custrecord_psg_br_cnpj']
            }).custrecord_psg_br_cnpj

            const tecnospeedApi = new Tecnospeed()
            const collectApi = tecnospeedApi.Collect({ cpfCnpj: subsidiaryCpfCnpj })
            const collectApiResponse = collectApi.fetchCollect(idIntegracao)
            log.debug('antes do if', collectApiResponse._dados)
            if (collectApiResponse._dados.length !== 0) {
                log.debug('depois do if')
                if (collectApiResponse._dados[0].UrlBoleto) {
                    record.submitFields({
                        type: newRecord.type,
                        id: newRecord.id,
                        values: { custrecord_ps_collect_pdf_file: collectApiResponse._dados[0].UrlBoleto }
                    })
                }
                record.submitFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    values: { custrecord_ps_collect_status: collectApiResponse._dados[0].situacao }
                })
            }
        }

        return {
            beforeLoad: beforeLoad
        }
    });
