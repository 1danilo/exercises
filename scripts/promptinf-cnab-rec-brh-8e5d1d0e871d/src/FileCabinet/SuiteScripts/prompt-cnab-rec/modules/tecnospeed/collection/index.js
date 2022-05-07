/**
 * @NApiVersion 2.x
 */
define(['N/https', 'N/error', 'N/encode', '../helper', './helper', 'N/url'],
  function (https, error, encode, generalHelper, collectHelper, urlN) {
    /**
     * Pagamento API.
     */
    return function (config, options) {
      const url = config.isProduction
        ? 'https://plugboleto.com.br/api/v1'
        : 'https://homologacao.plugboleto.com.br/api/v1'

      const headers = {
        'cnpj-sh': config.cnpjSh,
        'token-sh': config.tokenSh,
        'cnpj-cedente': generalHelper.clearNonDigits(options.cpfCnpj),
        'Content-Type': 'application/json'
      }

      /**
       * Create Assignor.
       *
       * @param {object} payer
       * @returns {*}
       */
      this.createAssignor = function (payer) {
        collectHelper.validateAssignor(payer)
        const res = https.post({
          url: url + '/cedentes',
          headers: headers,
          body: JSON.stringify(payer)
        })

        if (res.code === 201 || res.code === 200) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            RESCODE: res.code,
            name: 'TNS_COLLECT_CREATE_ASSIGNOR',
            message: res.body,
            notifyOff: true
          })
        }
      }

      this.updateAssignor = function (payer, idAssignor) {
        collectHelper.validateAssignor(payer)
        const res = https.put({
          url: url + '/cedentes/' + idAssignor,
          headers: headers,
          body: JSON.stringify(payer)
        })

        if (res.code === 201 || res.code === 200) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            rescode: res.code,
            name: 'TNS_COLLECT_UPDATE_ASSIGNOR',
            message: res.body,
            notifyOff: true,
          })
        }
      }

      /**
       * Create webhook for returning.
       *
       * @param {object}
       * @returns {*}
       */
      this.createReturnHook = function () {
        const hookUrl = urlN.resolveScript({
          scriptId: 'customscriptps_cnab_st_hook_collec',
          deploymentId: 'customdeployps_cnab_st_hook_collect',
          returnExternalUrl: true
        })

        const tempBody = {
          ativo: true,
          url: hookUrl,
          eventos: {
            "registrou": true,
            "liquidou": true,
            "baixou": true,
            "alterou": true,
            "rejeitou": true,
            "protestou": true
          },
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }

        const res = https.post({
          url: url + '/webhooks',
          headers: headers,
          body: JSON.stringify(tempBody)
        })

        if (res.code === 201 || res.code === 200) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COLLECT_CREATE_RETURN_HOOK',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Create account.
       *
       * @param {object} accounts
       * @returns {*}
       */
      this.createAccount = function (accounts) {
        const res = https.post({
          url: url + '/cedentes/contas',
          headers: headers,
          body: JSON.stringify(accounts)
        })

        if (res.code === 201 || res.code === 200) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COLLECT_CREATE_ACCOUNT',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
 * Create account.
 *
 * @param {object} accounts
 * @returns {*}
 */
      this.updateAccount = function (id, accounts) {
        const res = https.put({
          url: url + '/cedentes/contas/' + id,
          headers: headers,
          body: JSON.stringify(accounts)
        })

        if (res.code === 201 || res.code === 200) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COLLECT_UPDATE_ACCOUNT',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Create covenant.
       *
       * @param {object} accounts
       * @returns {*}
       */
      this.createCovenant = function (accounts) {
        const res = https.post({
          url: url + '/cedentes/contas/convenios',
          headers: headers,
          body: JSON.stringify(accounts)
        })

        if (res.code === 201 || res.code === 200) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COLLECT_CREATE_COVENANT',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Create covenant.
       *
       * @param {object} accounts
       * @returns {*}
       */
      this.updateCovenant = function (accounts, idCovenant) {
        const res = https.put({
          url: url + '/cedentes/contas/convenios/' + idCovenant,
          headers: headers,
          body: JSON.stringify(accounts)
        })

        if (res.code === 201 || res.code === 200) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COLLECT_UPDATE_COVENANT',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Delete contas.
       *
       * @param {string} cpfCnpj
       * @param {object} contas
       * @returns {*}
       */
      this.deleteAccount = function (conta) {
        const res = https.delete({
          url: url + '/cedentes/contas/' + conta,
          headers: headers
        })

        if (res.code === 200 || res.code === 201) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COLLECT_DELETE_ACCOUNT',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Create Collect.
       *
       * @param {string} type
       * @param {object} collect
       * @returns {*}
       */
      this.createCollect = function (collect) {
        collectHelper.validateCollect(collect)

        const res = https.post({
          url: url + '/boletos/lote',
          headers: headers,
          body: JSON.stringify(collect)
        })

        if (res.code === 200 || res.code === 201) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COLLECT_CREATE_COLLECT',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Create Remittance.
       *
       * @param {object[]} collect
       * @return {object}
       */
      this.createRemittance = function (collect) {
        const res = https.post({
          url: url + '/remessas/lote',
          headers: headers,
          body: JSON.stringify(collect)
        })

        if (res.code === 200 || res.code === 201) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COB_CREATE_REMITTANCE',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
      * Delete Collect.
      *
      * @param {string} type
      * @param {object} collect
      * @returns {*}
      */
      this.deleteCollect = function (collect) {
        collectHelper.validateCollect(collect)
        const res = https.post({
          url: url + '/boletos/descarta/lote',
          headers: headers,
          body: JSON.stringify(collect)
        })

        if (res.code === 200 || res.code === 201) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COLLECT_DELETE_COLLECT',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Discharge Remittance.
       *
       * @param {object[]} collect
       * @return {object}
       */
      this.dischargeRemittance = function (collect) {
        const res = https.post({
          url: url + '/boletos/baixa/lote',
          headers: headers,
          body: JSON.stringify(collect)
        })

        if (res.code === 200 || res.code === 201) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COB_DISCHARGE_REMITTANCE',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Update Remittance.
       *
       * @param {object[]} collect
       * @return {object}
       */
      this.updateRemittance = function (collect) {
        var teste = JSON.stringify(collect)
        const res = https.post({
          url: url + '/boletos/altera/lote',
          headers: headers,
          body: JSON.stringify(collect)
        })

        if (res.code === 200 || res.code === 201) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COB_UPDATE_REMITTANCE',
            message: res.body,
            notifyOff: true,
            res: teste
          })
        }
      }

      /**
       * Fetch Collect.
       *
       * @param {string} parameters
       * @return {object}
       */
      this.fetchCollect = function (idIntegracao) {
        const res = https.get({
          url: url + '/boletos?IdIntegracao=' + idIntegracao,
          headers: headers
        })

        if (res.code === 200 || res.code === 201) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COB_FETCH_COLLECT',
            message: res.body,
            notifyOff: true
          })
        }
      }

      /**
       * Fetch Remittance.
       *
       * @param {string} id
       * @return {object}
       */
      this.fetchRemittance = function (id) {
        const res = https.get({
          url: url + '/remessas/' + id,
          headers: headers
        })

        if (res.code === 200 || res.code === 201) {
          return JSON.parse(res.body)
        } else {
          throw error.create({
            name: 'TNS_COB_FETCH_REMITTANCE',
            message: res.body,
            notifyOff: true
          })
        }
      }

    }
  })





