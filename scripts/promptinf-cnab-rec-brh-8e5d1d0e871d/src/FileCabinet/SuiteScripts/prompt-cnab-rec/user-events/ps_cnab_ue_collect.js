/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record', '../modules/tecnospeed/index'],
    function (search, record, Tecnospeed) {

        
        function afterSubmit(context) {

            log.debug('context.type', context.type)
            
            if (context.type !== context.UserEventType.DELETE) return

            const newRecord = context.newRecord

            const idIntegracao = newRecord.getValue({ fieldId: 'custrecord_ps_collect_id' })
            const idSubsidiary = newRecord.getValue({ fieldId: 'custrecord_ps_collect_subsidiary' })

            const subsidiaryCpfCnpj = search.lookupFields({
                type: 'subsidiary',
                id: idSubsidiary,
                columns: ['custrecord_psg_br_cnpj']
            }).custrecord_psg_br_cnpj

            log.debug('idIntegracao', idIntegracao)
            
            const tecnospeedApi = new Tecnospeed()
            const collectApi = tecnospeedApi.Collect({ cpfCnpj: subsidiaryCpfCnpj })
            
            collectApiResponse = collectApi.deleteCollect([idIntegracao])
            log.debug('collectApiResponse', collectApiResponse)
            
        }

        return {
            afterSubmit: afterSubmit
        }
    });
