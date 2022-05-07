/**
 * @NApiVersion 2.x
 */
define(['../helper'],
  function (generalHelper) {
    /**
     * Validate payer.
     *
     * @param {object[]} data
     */
    function validateAssignor (data) {
      data.cpfCnpj = generalHelper.clearNonDigits(data.cpfCnpj)
      data.CedenteEnderecoCEP = generalHelper.clearNonDigits(data.CedenteEnderecoCEP)
    }

    /**
     * Validate payment.
     *
     * @param {object} data
     */
    function validateCollect (data) {
      data.cpfCnpj = generalHelper.clearNonDigits(data.cpfCnpj)
    }

    return {
      validateAssignor: validateAssignor,
      validateCollect: validateCollect
    }
  })
