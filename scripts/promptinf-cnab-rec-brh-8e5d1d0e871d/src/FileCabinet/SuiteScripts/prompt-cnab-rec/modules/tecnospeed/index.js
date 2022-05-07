/**
 * @NApiVersion 2.x
 */
define(['N/runtime', './collection/index'],
  function (runtime, Collect) {
    /**
     * Tecnospeed API.
     */
    return function () {
      const config = {
        isProduction: runtime.envType === runtime.EnvType.PRODUCTION,
        cnpjSh: '72190085000129',
        tokenSh: '763429ad672f3fe0e6b3656a301f5426'
      }

      /**
       * Collect API.
       *
       * @returns {*|exports}
       * @constructor
       */
      this.Collect = function (options) {
        return new Collect(config, options)
      }
    }
  })
