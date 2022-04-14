/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/search", "N/record"], function (search, record) {
  /**
   * Function called upon sending a GET request to the RESTlet.
   *
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.1
   */
  function doGet(requestParams) {
    log.debug({ title: "requestParams", details: requestParams });
    return search
      .create({
        type: search.Type.CUSTOMER,
        /*filters: [{
               name: 'phone',
               operator: search.Operator.STARTSWITH,
               values: '(031)'
             }, {
               name: 'firstname',
               operator: search.Operator.STARTSWITH,
               values: 'Angela'
             }],*/
        filters: [
          ["phone", "startswith", "(031)"],
          "OR",
          ["firstname", "startswith", "Fulano"],
        ],
        columns: [
          {
            name: "companyname",
          },
          {
            name: "phone",
          },
          {
            name: "salesrep",
          },
          {
            name: "phone",
            join: "salesrep",
          },
          {
            name: "email",
            join: "salesrep",
          },
          {
            name: "formulatext",
            formula: "REGEXP_REPLACE({phone}, '[^0-9]', '', 1, 0)",
          },
          {
            name: "formulatext",
            formula: "REGEXP_REPLACE({phone}, '[^0-9]', '', 1, 0)",
          },
          {
            name: "internalid",
            summary: search.Summary.COUNT,
          },
        ],
      })
      .run()
      .getRange({
        start: 0,
        end: 1,
      })
      .map(function (result) {
        const columns = result.columns;
        return {
          companyname: result.getValue(columns[0]),
          phone: result.getValue(columns[1]),
          salesrep: {
            id: result.getValue(columns[2]),
            name: result.getText(columns[2]),
            phone: result.getValue(columns[3]),
            email: result.getValue(columns[4]),
          },
        };
      });
  }

  /**
   * Function called upon sending a POST request to the RESTlet.
   *
   * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
   * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doPost(requestBody) {
    log.debug({ title: "requestBody", details: requestBody });
    var scriptObj = runtime.getCurrentScript();
    log.debug(
      "Remaining governance units (INICIO): " + scriptObj.getRemainingUsage()
    );
    if (!requestBody.firstname) {
      throw error.create({
        name: "FIRSTNAME_EMPTY",
        message: "Firstname empty",
        notifyOff: true,
      });
    }

    const customer = record.create({ type: record.Type.CUSTOMER });

    log.debug(
      "Remaining governance units (DEPOIS CREATE): " +
        scriptObj.getRemainingUsage()
    );

    customer.setValue({ fieldId: "isperson", value: "T" });
    customer.setValue({ fieldId: "firstname", value: requestBody.firstname });
    customer.setValue({ fieldId: "lastname", value: requestBody.lastname });

    const customerId = customer.save({ ignoreMandatoryFields: true });

    log.debug(
      "Remaining governance units (DEPOIS SAVE): " +
        scriptObj.getRemainingUsage()
    );

    return {
      id: customerId,
    };
  }

  /**
   * Function called upon sending a PUT request to the RESTlet.
   *
   * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
   * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doPut(requestBody) {}

  /**
   * Function called upon sending a DELETE request to the RESTlet.
   *
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doDelete(requestParams) {}

  return {
    get: doGet,
    post: doPost,
    put: doPut,
    delete: doDelete,
  };
});
