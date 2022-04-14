/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(["N/runtime", "N/search", "N/record"], function (
  runtime,
  search,
  record
) {
  function execute(context) {
    var scriptObj = runtime.getCurrentScript();
    log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());

    const search1 = search
      .create({
        type: "vendorbill",
        filters: [
          {
            name: "trandate",
            operator: search.Operator.ON,
            values: ["09/03/2022"],
          },
          { name: "mainline", operator: "is", values: true },
        ],
        columns: [
          { name: "subsidiary" },
          { name: "taxamount" },
          { name: "custbody_o2s_parcela_l_tp_servico" },
          { name: "externalid" },
          { name: "custbody_jive_sn_number_fin" },
          { name: "internalid", join: "vendor" },
          { name: "custbody_o2s_transaction_l_meio_pgto" },
          { name: "internalId" },
        ],
      })
      .run()
      .each((result) => {
        var vendorpaymentField = search
          .create({
            type: "vendorpayment",
            filters: [
              {
                name: "appliedtotransaction",
                operator: "is",
                values: result.getValue({ name: "internalId" }),
              },
            ],
            columns: [{ name: "trandate" }],
          })
          .run()
          .getRange({
            start: 0,
            end: 1,
          })
          .map(function (result) {
            return {
              trandate: result.getValue(result.columns[0]),
            };
          });

        log.debug("vendorpaymentField", vendorpaymentField);
        log.debug("vendorpaymentField", vendorpaymentField[0]);
        log.debug("vendorpaymentField", vendorpaymentField[0].trandate);

        const alreadyExist = search
          .create({
            type: "customrecord_ps_cnab_pay_proof",
            filters: [
              {
                name: "custrecord_ps_cnab_pay_transaction",
                operator: "is",
                values: result.getValue({ name: "internalId" }),
              },
            ],
            columns: [{ name: "internalid" }],
          })
          .run()
          .getRange({
            start: 0,
            end: 1,
          })
          .reduce(function (acc, result) {
            return result.getValue(result.columns[0]);
          }, "");

        log.debug("alreadyExist", alreadyExist === "");
        if (alreadyExist === "") {
          log.debug("entrei no if do alreadyExist");
          const subsidiaryCpfCnpj = search.lookupFields({
            type: search.Type.SUBSIDIARY,
            id: result.getValue({ name: "subsidiary" }),
            columns: ["custrecord_psg_br_cnpj", "legalname"],
          });
          const taxamount = result.getValue({ name: "taxamount" });
          const serviceTypeBill = result.getText({
            name: "custbody_o2s_parcela_l_tp_servico",
          });
          const externalidBill = result.getValue({ name: "externalid" });
          const numberFinBill = result.getValue({
            name: "custbody_jive_sn_number_fin",
          });
          const entityBill = result.getValue({
            name: "internalid",
            join: "vendor",
          });
          const paymentMethod = result.getValue({
            name: "custbody_o2s_transaction_l_meio_pgto",
          });
          const vendorBillId = result.getValue({ name: "internalId" });

          const ticketList = {
            pgtContCodBarra: "49",
            pgtConcess: "73",
            liquidTituPropBanc: "62",
            pgtTituOtrBanc: "63",
          };
          const trasnferList = {
            credContCor: "1",
            docTed: "3",
            tedOtrTlr: "65",
            tedMesTlr: "66",
          };

          // var cDate = new Date(vendorpaymentField[0].trandate)
          //  log.debug('cDate', cDate)
          // const cDate2 = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate())

          // const d1 = vendorpaymentField[0].trandate
          //"24/02/2022" pega assim
          //"02/24/2022" retorna assim

          let d1 = vendorpaymentField[0].trandate;
          d1 = d1.split("/");
          d1 = d1[1] + "/" + d1[0] + "/" + d1[2];
          const cDate2 = new Date(d1);
          log.debug("cDate2", cDate2);

          const entityFields = _fetchVendorBankAccount(entityBill);
          const parcelFields = _fetchSitParcelFields(vendorBillId);
          log.debug("parcelFields", parcelFields);
          log.debug("parcelFields.numberAccount", parcelFields.numberAccount);
          const bankAccountFields = _fetchBankAccountByNumberAccount(
            parcelFields.numberAccount
          );

          const cnpjWithoutMaskVendor =
            subsidiaryCpfCnpj.custrecord_psg_br_cnpj.replace(/[^\d]+/g, "");
          const cnpjWithoutMaskBeneficiary = entityFields.cpfcnpj.replace(
            /[^\d]+/g,
            ""
          );
          const serviceType = serviceTypeBill;
          const externalId = externalidBill;
          const bankCodePayer = bankAccountFields[0].bank.substr(0, 3);
          var paymentProof;

          for (let [key, value] of Object.entries(ticketList)) {
            if (paymentMethod === value) {
              paymentProof = {
                custrecord_ps_cnab_pay_payer_cnpj: cnpjWithoutMaskVendor,
                custrecord_ps_cnab_pay_payer_legalname:
                  subsidiaryCpfCnpj.legalname,
                custrecord_ps_cnab_pay_payer_bank: bankCodePayer, //Campo que aparece no registro
                custrecord_ps_cnab_pay_payer_agency:
                  bankAccountFields[0].agency,
                custrecord_ps_cnab_pay_payer_agencydigit:
                  bankAccountFields[0].agencyDigit,
                custrecord_ps_cnab_pay_payer_chec_acc:
                  bankAccountFields[0].account,
                custrecord_ps_cnab_payer_account_digit:
                  bankAccountFields[0].accountDigit,
                custrecord_ps_cnab_pay_payment_type:
                  bankAccountFields[0].accountType,
                custrecord_ps_cnab_beneficiary_cpfcnpj:
                  cnpjWithoutMaskBeneficiary,
                custrecord_ps_cnab_pay_beneficiary_name: entityFields.legalName,
                custrecord_ps_cnab_pay_payment_form: "BOLETO",
                custrecord_ps_cnab_pay_ticket_type: serviceType, //ajustar
                custrecord_ps_cnab_pay_digitable_line:
                  parcelFields.barcode || null, //Pego
                custrecord_ps_cnab_pay_paydate:
                  parcelFields.paymentDate || null, // Pego
                custrecord_ps_cnab_pay_discount:
                  parcelFields.discountAmount || null, // pego
                custrecord_ps_cnab_pay_amount_paid: parcelFields.amount || null, // pego
                custrecord_ps_cnab_pay_interest_fine: String(taxamount) || null, // pego
                custrecord_ps_cnab_pay_external_id: externalId,
                custrecord_ps_cnab_pay_transaction: vendorBillId,
                custrecord_jive_sn_number_fin: numberFinBill,
                custrecord_ps_cnab_pay_payer_cnpj_mask:
                  subsidiaryCpfCnpj.custrecord_psg_br_cnpj,
                custrecord_ps_cnab_bene_cpfcnpj_mask: entityFields.cpfcnpj,
                custrecord_ps_cnab_pay_payer_bank_hidden:
                  bankAccountFields[0].bank, //Campo para popular o pdf
              };
            } else {
              for (let [key, value] of Object.entries(trasnferList)) {
                if (paymentMethod === value) {
                  if (entityFields.bankCode === "") return true;
                  log.debug("entityFields.bankCode", entityFields.bankCode);
                  const bank = _fetchNameBankByCode(entityFields.bankCode);
                  let bankCodeBene = bank[0].bank.substr(0, 3);
                  paymentProof = {
                    custrecord_ps_cnab_pay_payer_cnpj: cnpjWithoutMaskVendor,
                    custrecord_ps_cnab_pay_payer_legalname:
                      subsidiaryCpfCnpj.legalname,
                    custrecord_ps_cnab_pay_payer_bank: bankCodePayer, //Campo que aparece no registro,
                    custrecord_ps_cnab_pay_payer_agency:
                      bankAccountFields[0].agency,
                    custrecord_ps_cnab_pay_payer_agencydigit:
                      bankAccountFields[0].agencyDigit,
                    custrecord_ps_cnab_pay_payer_chec_acc:
                      bankAccountFields[0].account,
                    custrecord_ps_cnab_payer_account_digit:
                      bankAccountFields[0].accountDigit,
                    custrecord_ps_cnab_beneficiary_cpfcnpj:
                      cnpjWithoutMaskBeneficiary,
                    custrecord_ps_cnab_pay_beneficiary_name:
                      entityFields.legalName,
                    custrecord_ps_cnab_pay_payment_form: "TRANSFERÊNCIA",
                    custrecord_ps_cnab_pay_ticket_type: serviceType, //ajustar
                    custrecord_ps_cnab_pay_payment_type:
                      bankAccountFields[0].accountType,
                    custrecord_ps_cnab_pay_paydate:
                      parcelFields.paymentDate || null,
                    custrecord_ps_cnab_pay_discount:
                      parcelFields.discountAmount || null,
                    custrecord_ps_cnab_pay_amount_paid:
                      parcelFields.amount || null,
                    custrecord_ps_cnab_pay_interest_fine:
                      String(taxamount) || null,
                    custrecord_ps_cnab_pay_bank: bankCodeBene || "", //Campo que aparece no registro,
                    custrecord_ps_cnab_pay_bene_agency:
                      entityFields.agency || null,
                    custrecord_ps_cnab_pay_agency_digit:
                      entityFields.agencyDigit || null,
                    custrecord_ps_cnab_pay_account:
                      entityFields.accountNumber || null,
                    custrecord_ps_cnab_pay_account_digit:
                      entityFields.accountNumberDigit || null,
                    custrecord_ps_cnab_pay_external_id: externalId,
                    custrecord_ps_cnab_pay_transaction: vendorBillId,
                    custrecord_jive_sn_number_fin: numberFinBill,
                    custrecord_ps_cnab_pay_payer_cnpj_mask:
                      subsidiaryCpfCnpj.custrecord_psg_br_cnpj,
                    custrecord_ps_cnab_bene_cpfcnpj_mask: entityFields.cpfcnpj,
                    custrecord_ps_cnab_pay_payer_bank_hidden:
                      bankAccountFields[0].bank, //Campo para popular o pdf
                    custrecord_ps_cnab_pay_bank_hidden: bank[0].bank || "", // Campo para popular o pdf
                  };
                }
              }
            }
          }

          const recordPaymentProof = record.create({
            type: "customrecord_ps_cnab_pay_proof",
            isDynamic: true,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payer_cnpj",
            value: paymentProof.custrecord_ps_cnab_pay_payer_cnpj,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payer_legalname",
            value: paymentProof.custrecord_ps_cnab_pay_payer_legalname,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payer_bank",
            value: paymentProof.custrecord_ps_cnab_pay_payer_bank,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payer_agency",
            value: paymentProof.custrecord_ps_cnab_pay_payer_agency,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payer_agencydigit",
            value: paymentProof.custrecord_ps_cnab_pay_payer_agencydigit,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payer_chec_acc",
            value: paymentProof.custrecord_ps_cnab_pay_payer_chec_acc,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_payer_account_digit",
            value: paymentProof.custrecord_ps_cnab_payer_account_digit,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_beneficiary_cpfcnpj",
            value: paymentProof.custrecord_ps_cnab_beneficiary_cpfcnpj,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_beneficiary_name",
            value: paymentProof.custrecord_ps_cnab_pay_beneficiary_name,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payment_form",
            value: paymentProof.custrecord_ps_cnab_pay_payment_form,
          });
          // recordPaymentProof.setValue({ fieldId: 'custrecord_ps_cnab_pay_ticket_type', value: paymentProof.custrecord_ps_cnab_pay_ticket_type })
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payment_type",
            value: paymentProof.custrecord_ps_cnab_pay_payment_type,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_digitable_line",
            value: paymentProof.custrecord_ps_cnab_pay_digitable_line,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_paydate",
            value: cDate2,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_discount",
            value: 0,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_amount_paid",
            value: paymentProof.custrecord_ps_cnab_pay_amount_paid,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_interest_fine",
            value: paymentProof.custrecord_ps_cnab_pay_interest_fine,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_bank",
            value: paymentProof.custrecord_ps_cnab_pay_bank,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_bene_agency",
            value: paymentProof.custrecord_ps_cnab_pay_bene_agency,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_agency_digit",
            value: paymentProof.custrecord_ps_cnab_pay_agency_digit,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_account",
            value: paymentProof.custrecord_ps_cnab_pay_account,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_account_digit",
            value: paymentProof.custrecord_ps_cnab_pay_account_digit,
          });
          // recordPaymentProof.setValue({ fieldId: 'custrecord_ps_cnab_pay_aut_register', value: paymentProof.custrecord_ps_cnab_pay_aut_register })
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_external_id",
            value: paymentProof.custrecord_ps_cnab_pay_external_id,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_transaction",
            value: paymentProof.custrecord_ps_cnab_pay_transaction,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_jive_sn_number_fin",
            value: paymentProof.custrecord_jive_sn_number_fin,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payer_cnpj_mask",
            value: paymentProof.custrecord_ps_cnab_pay_payer_cnpj_mask,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_bene_cpfcnpj_mask",
            value: paymentProof.custrecord_ps_cnab_bene_cpfcnpj_mask,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_payer_bank_hidden",
            value: paymentProof.custrecord_ps_cnab_pay_payer_bank_hidden,
          });
          recordPaymentProof.setValue({
            fieldId: "custrecord_ps_cnab_pay_bank_hidden",
            value: paymentProof.custrecord_ps_cnab_pay_bank_hidden,
          });
          recordPaymentProof.save();

          // log.debug('paymentProof', paymentProof)
          log.debug("recordPaymentProof", recordPaymentProof);
          return true;
        }
      });
    //      return true
    //  })
  }

  /**
   * Fetch bank accounts by subsidiary.
   *
   * @param numberAccount
   * @returns {{name: string, id: number}[]}
   * @private
   */
  function _fetchBankAccountByNumberAccount(numberAccount) {
    return search
      .create({
        type: "customrecord_ps_bank_account",
        filters: [
          {
            name: "custrecord_ps_bac_account",
            operator: search.Operator.IS,
            values: numberAccount,
          },
          {
            name: "isinactive",
            operator: search.Operator.IS,
            values: false,
          },
        ],
        columns: [
          { name: "custrecord_ps_bac_bank" },
          { name: "custrecord_ps_bac_agency_number" },
          { name: "custrecord_ps_bac_account_number" },
          { name: "custrecord_ps_bac_acctype" },
          { name: "custrecord_ps_bac_agency_digit" },
          { name: "custrecord_ps_bac_account_digit" },
        ],
      })
      .run()
      .getRange({
        start: 0,
        end: 1,
      })
      .map(function (result) {
        return {
          id: result.id,
          bank: result.getText(result.columns[0]),
          agency: result.getValue(result.columns[1]),
          account: result.getValue(result.columns[2]),
          accountType: result.getText(result.columns[3]),
          agencyDigit: result.getValue(result.columns[4]),
          accountDigit: result.getValue(result.columns[5]),
        };
      });
  }

  /**
   * Fetch parcel fields by vendorBillId and installmentNumber
   *
   * @param vendorBillId, installmentNumber
   * @returns {{name: string, id: number}[]}
   * @private
   */
  function _fetchSitParcelFields(vendorBillId) {
    return search
      .create({
        type: "customrecord_sit_parcela",
        filters: [
          {
            name: "custrecord_sit_parcela_l_transacao",
            operator: search.Operator.IS,
            values: vendorBillId,
          },
        ],
        columns: [
          { name: "custrecord_sit_parcela_n_valor" },
          { name: "custrecord_o2s_parcela_n_val_desconto" },
          { name: "custrecord_o2s_parcela_t_lin_dig_boleto" },
          { name: "custrecord_sit_parcela_d_dt_vencimen" },
          { name: "custrecord_sit_parcela_l_conta_prev" },
        ],
      })
      .run()
      .getRange({
        start: 0,
        end: 1,
      })
      .reduce(function (acc, result) {
        return {
          amount: result.getValue(result.columns[0]),
          discountAmount: result.getValue(result.columns[1]),
          barcode: result.getValue(result.columns[2]),
          paymentDate: result.getValue(result.columns[3]),
          numberAccount: result.getValue(result.columns[4]),
        };
      }, "");
  }

  /**
   * Fetch vendor bank account.
   *
   * @param vendorId
   * @returns object
   * @private
   */
  function _fetchVendorBankAccount(vendorId) {
    return search
      .create({
        type: "vendor",
        filters: [
          {
            name: "internalid",
            operator: search.Operator.IS,
            values: vendorId,
          },
        ],
        columns: [
          {
            name: "custrecord_o2s_cnab_t_bancos",
            join: "custentity_o2s_l_banco_favorecido",
          },
          { name: "custentity_o2s_t_cod_agencia_favor" },
          { name: "custentity_o2s_t_dig_verfic_agencia_cont" },
          { name: "custentity_o2s_t_conta_corrente_favor" },
          { name: "custentity_o2s_t_digito_verfic_conta" },
          { name: "custentity_psg_br_cnpj" },
          { name: "companyname" },
        ],
      })
      .run()
      .getRange({
        start: 0,
        end: 1,
      })
      .reduce(function (acc, result) {
        const columns = result.columns;
        acc.bankCode = result.getValue(columns[0]);
        acc.agency = result.getValue(columns[1]);
        acc.agencyDigit = result.getValue(columns[2]);
        acc.accountNumber = result.getValue(columns[3]);
        acc.accountNumberDigit = result.getValue(columns[4]);
        acc.cpfcnpj = result.getValue(columns[5]);
        acc.legalName = result.getValue(columns[6]);
        return acc;
      }, {});
  }

  /**
   * Fetch name bank by code.
   *
   * @param codeBank
   * @returns {{name: string}}
   * @private
   */
  function _fetchNameBankByCode(codeBank) {
    return search
      .create({
        type: "customrecord_ps_bank",
        filters: [
          {
            name: "custrecord_ps_ban_code",
            operator: search.Operator.IS,
            values: codeBank,
          },
        ],
        columns: [{ name: "name" }],
      })
      .run()
      .getRange({
        start: 0,
        end: 1,
      })
      .map(function (result) {
        return {
          bank: result.getValue(result.columns[0]),
        };
      });
  }

  return {
    execute: execute,
  };
});
