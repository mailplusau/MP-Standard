/**
 * Module Description
 *
 * NSVersion    Date            			Author
 * 1.00       	2020-06-16 14:35:41   		Ankith
 *
 * Description: Create MP Standard Invoices at the end of every week
 *
 * @Last modified by:   ankithravindran
 * @Last modified time: 2022-06-14T09:12:55+10:00
 *
 */

function rescheduleScript(script_deployment_1, script_deployment_2, params) {

    var ctx = nlapiGetContext();
    var current_script_deployment = ctx.getDeploymentId();

    var next_script_deployment = null;

    if (current_script_deployment == script_deployment_1) {
        next_script_deployment = script_deployment_2;
    } else if (current_script_deployment == script_deployment_2) {
        next_script_deployment = script_deployment_1;
    } else {
        throw nlapiCreateError('NO MATCHING DEPLOYMENTS', current_script_deployment +
            'not defined in rescheduleScript', false);
        return false;
    }

    var status = nlapiScheduleScript(ctx.getScriptId(), next_script_deployment,
        params);

    if (status == 'QUEUED') {
        nlapiLogExecution('AUDIT', 'SWITCH from ' + current_script_deployment +
            ' --> ' + next_script_deployment + ': Usage', 10000 - ctx.getRemainingUsage()
        );
        return false;
    }
}

function main(type) {

    var ctx = nlapiGetContext();
    var recInvoice;
    var internal_id = [];
    var customer_ids;
    var new_invoice = true;
    var invCount = 0;

    var invoiceId = null;

    var item_rates = ['a', 'b', 'c', 'd', 'e', 'f', 'g']; // make sure to check the search
    var text = 'custrecord_ap_qty_';

    var todayDate = null;
    var tranDate = null;

    var usage_threshold = 500;
    var adhoc_inv_deploy = 'customdeploy2';
    var prev_inv_deploy = null;

    var usage_per_loop = 0;
    var usage_per_inv = 0;

    if (!isNullorEmpty(ctx.getSetting('SCRIPT', 'custscript_prev_inv_deploy'))) {
        prev_inv_deploy = ctx.getSetting('SCRIPT', 'custscript_prev_inv_deploy');
    } else {
        prev_inv_deploy = ctx.getDeploymentId();
    }


    todayDate = new Date();
    nlapiLogExecution('DEBUG', todayDate)

    todayDate.setHours(todayDate.getHours() + 17);
    nlapiLogExecution('DEBUG', todayDate)

    tranDate = nlapiDateToString(todayDate);
    nlapiLogExecution('DEBUG', tranDate)

    // SEARCH: MP Standard - Weekly Invoicing (List) - DO NOT DELETE
    var searchResults = nlapiSearchRecord('customrecord_mp_ap_product_order',
        'customsearch_mp_std_weekly_invoicing');

    if (!isNullorEmpty(searchResults)) {

        nlapiLogExecution('AUDIT', 'START --->', ctx.getRemainingUsage());

        for (var n = 0; n < searchResults.length; n++) {

            usage_per_loop = ctx.getRemainingUsage();

            if (ctx.getRemainingUsage() <= usage_threshold && (n + 1) < searchResults
                .length) {

                var params = {
                    custscript_invoicedate_list: tranDate,
                    custscript_prev_inv_deploy: ctx.getDeploymentId()
                }

                var reschedule = rescheduleScript(prev_inv_deploy, adhoc_inv_deploy,
                    params);
                if (reschedule == false) {
                    nlapiLogExecution('AUDIT', 'params: custscript_invoicedate_list',
                        params.custscript_invoicedate_list);
                    nlapiLogExecution('AUDIT', 'params: custscript_invoicedate_list',
                        params.custscript_prev_inv_deploy);
                    return false;
                }
            }

            var customer_po = searchResults[n].getValue('custentity11',
                'CUSTRECORD_AP_ORDER_CUSTOMER', "GROUP");
            var mpex_po = searchResults[n].getValue('custentity_mpex_po',
                'CUSTRECORD_AP_ORDER_CUSTOMER', "GROUP");
            var product_po = searchResults[n].getValue('custrecord_mp_ap_order_po',
                "GROUP");
            var ordered_by = searchResults[n].getValue(
                'custrecord_mp_ap_order_ordered_by', "GROUP");

            try {

                if (searchResults[n].getValue('custrecord_mp_ap_order_from_swap') !=
                    "T") {

                    if (customer_ids == searchResults[n].getValue(
                        'custrecord_ap_order_customer', null, "GROUP")) {
                        new_invoice = false;
                        internal_id[internal_id.length] = parseInt(searchResults[n].getValue(
                            'internalid', null, "GROUP"));
                    } else {
                        new_invoice = true;
                        invCount++;
                    }

                    //--------------- Submit/Init Invoice ---------------//
                    if (n == 0) {

                        //--------------- Init New Invoice ---------------//
                        usage_per_inv = ctx.getRemainingUsage();

                        internal_id[internal_id.length] = parseInt(searchResults[n].getValue(
                            'internalid', null, "GROUP"));

                        // recInvoice = nlapiCreateRecord('invoice', {
                        //     recordmode: 'dynamic'
                        // });


                        customer_ids = searchResults[n].getValue(
                            'custrecord_ap_order_customer', null, "GROUP");
                        recInvoice = nlapiCreateRecord('invoice', {
                            recordmode: 'dynamic'
                        });
                        recInvoice.setFieldValue('customform', 116);
                        recInvoice.setFieldValue('entity', searchResults[n].getValue(
                            'custrecord_ap_order_customer', null, "GROUP"));
                        recInvoice.setFieldValue('department', nlapiLoadRecord('partner',
                            435).getFieldValue('department'));
                        recInvoice.setFieldValue('location', nlapiLoadRecord('partner', 435)
                            .getFieldValue('location'));
                        recInvoice.setFieldValue('trandate', tranDate);
                        //                        recInvoice.setFieldValue('trandate', '22/08/2021');
                        recInvoice.setFieldValue('custbody_inv_date_range_from',
                            searchResults[n].getValue(
                                'custrecord_ap_order_fulfillment_date', null, "GROUP"));
                        recInvoice.setFieldValue('custbody_inv_date_range_to',
                            searchResults[n].getValue(
                                'custrecord_ap_order_fulfillment_date', null, "GROUP"));
                        // recInvoice.setFieldValues('custbody_ap_product_order', internal_id);
                        if (!isNullorEmpty(mpex_po) || (isNullorEmpty(product_po) &&
                            isNullorEmpty(customer_po))) {
                            recInvoice.setFieldValue('custbody6', mpex_po);
                        } else if (!isNullorEmpty(product_po)) {
                            var final_po_text = product_po;
                            recInvoice.setFieldValue('custbody6', final_po_text);
                        } else {
                            var final_po_text = customer_po;
                            recInvoice.setFieldValue('custbody6', final_po_text);
                        }
                        recInvoice.setFieldValue('custbody_dont_update_trandate', "T");
                        //recInvoice.setFieldValue('custbody_satchel_inv', "T");
                        recInvoice.setFieldValue('custbody_inv_type', 9);
                        recInvoice.setFieldValue('partner', 435);

                        recInvoice.setFieldValue('terms', 7);
                    }

                    if (new_invoice == true && n > 0) {

                        //--------------- Submit Current Invoice ---------------//
                        nlapiLogExecution('AUDIT', 'Loop: ' + invCount + '.' + n +
                            ' | Product IDS: ' + internal_id, usage_per_loop - ctx.getRemainingUsage()
                        );
                        internal_id = removeDups(internal_id);
                        nlapiLogExecution('AUDIT', 'Loop: ' + invCount + '.' + n +
                            ' | Product IDS: ' + internal_id, usage_per_loop - ctx.getRemainingUsage()
                        );
                        recInvoice.setFieldValues('custbody_mpex_product_order',
                            internal_id);
                        invoiceId = nlapiSubmitRecord(recInvoice);
                        nlapiLogExecution('AUDIT', 'InvID: ' + invoiceId + ' | Usage: ',
                            usage_per_inv - ctx.getRemainingUsage());

                        if (!isNullorEmpty(invoiceId)) {
                            for (var z = 0; z < internal_id.length; z++) {
                                var recOrder = nlapiLoadRecord(
                                    'customrecord_mp_ap_product_order', internal_id[z]);
                                recOrder.setFieldValue('custrecord_mp_ap_order_order_status', 6);
                                recOrder.setFieldValue('custrecord_mp_ap_order_invoicenum',
                                    invoiceId);
                                var submitted = nlapiSubmitRecord(recOrder);
                            }
                        }

                        //--------------- Init New Invoice ---------------//
                        usage_per_inv = ctx.getRemainingUsage();

                        internal_id = [];
                        internal_id[internal_id.length] = parseInt(searchResults[n].getValue(
                            'internalid', null, "GROUP"));

                        // internal_id[internal_id.length] = parseInt(searchResults[n].getValue('internalid', null, "GROUP"));
                        customer_ids = searchResults[n].getValue(
                            'custrecord_ap_order_customer', null, "GROUP");
                        recInvoice = nlapiCreateRecord('invoice', {
                            recordmode: 'dynamic'
                        });
                        recInvoice.setFieldValue('customform', 116);
                        recInvoice.setFieldValue('entity', searchResults[n].getValue(
                            'custrecord_ap_order_customer', null, "GROUP"));
                        recInvoice.setFieldValue('department', nlapiLoadRecord('partner',
                            435).getFieldValue('department'));
                        recInvoice.setFieldValue('location', nlapiLoadRecord('partner', 435)
                            .getFieldValue('location'));
                        recInvoice.setFieldValue('trandate', tranDate);
                        // recInvoice.setFieldValue('trandate', '22/08/2021');
                        recInvoice.setFieldValue('custbody_inv_date_range_from',
                            searchResults[n].getValue(
                                'custrecord_ap_order_fulfillment_date', null, "GROUP"));
                        recInvoice.setFieldValue('custbody_inv_date_range_to',
                            searchResults[n].getValue(
                                'custrecord_ap_order_fulfillment_date', null, "GROUP"));
                        // recInvoice.setFieldValues('custbody_ap_product_order', internal_id);
                        if (!isNullorEmpty(mpex_po) || (isNullorEmpty(product_po) &&
                            isNullorEmpty(customer_po))) {
                            recInvoice.setFieldValue('custbody6', mpex_po);
                        } else if (!isNullorEmpty(product_po)) {
                            var final_po_text = product_po;
                            recInvoice.setFieldValue('custbody6', final_po_text);
                        } else {
                            var final_po_text = customer_po;
                            recInvoice.setFieldValue('custbody6', final_po_text);
                        }
                        recInvoice.setFieldValue('custbody_dont_update_trandate', "T");
                        //recInvoice.setFieldValue('custbody_satchel_inv', "T");
                        recInvoice.setFieldValue('custbody_inv_type', 9);
                        recInvoice.setFieldValue('partner', 435);
                        recInvoice.setFieldValue('terms', 7);
                    }



                    var line_item = searchResults[n].getValue(
                        'custrecord_ap_stock_line_item', 'CUSTRECORD_AP_PRODUCT_ORDER',
                        "GROUP");
                    var line_qty = searchResults[n].getValue(
                        'custrecord_ap_stock_line_actual_qty',
                        'CUSTRECORD_AP_PRODUCT_ORDER', "SUM");

                    var inv_details = null;

                    var count = 0;

                    //--------------- Search AP Item Pricing Algorithm ---------------//
                    var fil_po = [];
                    fil_po[fil_po.length] = new nlobjSearchFilter('internalid', null,
                        'anyof', line_item);

                    var col_po = [];
                    col_po[col_po.length] = new nlobjSearchColumn('internalid');
                    col_po[col_po.length] = new nlobjSearchColumn(
                        'custrecord_ap_item_pricing_algorithm');
                    col_po[col_po.length] = new nlobjSearchColumn(
                        'custrecord_ap_item_qty_per_carton');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_qty_a');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_qty_b');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_qty_c');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_qty_d');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_qty_e');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_qty_f');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_item_a');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_item_b');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_item_c');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_item_d');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_item_e');
                    col_po[col_po.length] = new nlobjSearchColumn('custrecord_ap_item_f');

                    var poSearch = nlapiSearchRecord('customrecord_ap_item', null, fil_po,
                        col_po);

                    //--------------- Apply AP Item Pricing Algorithm ---------------//
                    if (poSearch[0].getValue('custrecord_ap_item_pricing_algorithm') == 1) { //IF PRICING ALGORITHM: PRICE LISTS

                        for (var x = 0; x < item_rates.length; x++) {
                            // uses dynamic column values from search (ie. custrecord_ap_qty_a)
                            var temp = text + item_rates[x];
                            var y = poSearch[0].getValue(temp);
                            if (y != '') {
                                if (parseInt(line_qty) < y) {

                                    var item_selected = 'custrecord_ap_item_' + item_rates[x];

                                    //Create Cusotm record - Custom Item Description List to store Invoice Details from the Product Order
                                    if (!isNullorEmpty(inv_details) || !isNullorEmpty(ordered_by)) {
                                        var inv_details_rec = nlapiCreateRecord('customrecord62');
                                        if (!isNullorEmpty(ordered_by)) {
                                            var new_inv_details = 'Order By - ' + ordered_by + '. ' +
                                                inv_details;
                                        } else {
                                            var new_inv_details = inv_details;
                                        }
                                        inv_details_rec.setFieldValue('name', new_inv_details);
                                        inv_details_rec.setFieldValue('custrecord57_2',
                                            searchResults[n].getValue(
                                                'custrecord_ap_order_customer', null, "GROUP"));
                                        inv_details_rec.setFieldValue('custrecord56_2', poSearch[0]
                                            .getValue(item_selected));
                                        var inv_details_rec_id = nlapiSubmitRecord(inv_details_rec);
                                    }

                                    recInvoice.selectNewLineItem('item');
                                    recInvoice.setCurrentLineItemValue('item', 'item', poSearch[0]
                                        .getValue(item_selected));
                                    recInvoice.setCurrentLineItemValue('item', 'quantity',
                                        line_qty);

                                    if (!isNullorEmpty(inv_details) || !isNullorEmpty(ordered_by)) {
                                        item_desc = nlapiLoadRecord('customrecord62',
                                            inv_details_rec_id);
                                        recInvoice.setCurrentLineItemValue('item', 'custcol1',
                                            inv_details_rec_id);
                                        recInvoice.setCurrentLineItemValue('item',
                                            'custcol1_display', item_desc.getFieldValue('name'));
                                    }

                                    recInvoice.commitLineItem('item');
                                    break;
                                }
                                // else if(x >= 1 && parseInt(line_qty) >= y){
                                //     var item_selected = 'custrecord_ap_item_' + item_rates[x];

                                //    if(!isNullorEmpty(inv_details)){
                                //         var inv_details_rec = nlapiCreateRecord('customrecord62');
                                //         inv_details_rec.setFieldValue('name', inv_details);
                                //         inv_details_rec.setFieldValue('custrecord57_2', searchResults[n].getValue('custrecord_ap_order_customer'));
                                //         inv_details_rec.setFieldValue('custrecord56_2', poSearch[0].getValue(item_selected));
                                //         var inv_details_rec_id = nlapiSubmitRecord(inv_details_rec);
                                //     }
                                //     recInvoice.selectNewLineItem('item');
                                //     recInvoice.setCurrentLineItemValue('item', 'item', poSearch[0].getValue(item_selected));
                                //     recInvoice.setCurrentLineItemValue('item', 'quantity', line_qty);

                                //      if(!isNullorEmpty(inv_details)){
                                //         item_desc = nlapiLoadRecord('customrecord62', inv_details_rec_id);
                                //         recInvoice.setCurrentLineItemValue('item', 'custcol1', inv_details_rec_id);
                                //         recInvoice.setCurrentLineItemValue('item', 'custcol1_display', item_desc.getFieldValue('name'));
                                //     }

                                //     recInvoice.commitLineItem('item');
                                //     break;
                                // }
                            } else {

                                var item_selected = 'custrecord_ap_item_' + item_rates[(x - 1)];

                                if (!isNullorEmpty(inv_details) || !isNullorEmpty(ordered_by)) {
                                    var inv_details_rec = nlapiCreateRecord('customrecord62');
                                    if (!isNullorEmpty(ordered_by)) {
                                        var new_inv_details = 'Order By - ' + ordered_by + '. ' +
                                            inv_details;
                                    } else {
                                        var new_inv_details = inv_details;
                                    }
                                    inv_details_rec.setFieldValue('name', new_inv_details);
                                    inv_details_rec.setFieldValue('custrecord57_2', searchResults[
                                        n].getValue('custrecord_ap_order_customer', null,
                                            "GROUP"));
                                    inv_details_rec.setFieldValue('custrecord56_2', poSearch[0].getValue(
                                        item_selected));
                                    var inv_details_rec_id = nlapiSubmitRecord(inv_details_rec);
                                }
                                recInvoice.selectNewLineItem('item');
                                recInvoice.setCurrentLineItemValue('item', 'item', poSearch[0].getValue(
                                    item_selected));
                                recInvoice.setCurrentLineItemValue('item', 'quantity', line_qty);

                                if (!isNullorEmpty(inv_details) || !isNullorEmpty(ordered_by)) {
                                    item_desc = nlapiLoadRecord('customrecord62',
                                        inv_details_rec_id);
                                    recInvoice.setCurrentLineItemValue('item', 'custcol1',
                                        inv_details_rec_id);
                                    recInvoice.setCurrentLineItemValue('item', 'custcol1_display',
                                        item_desc.getFieldValue('name'));
                                }

                                recInvoice.commitLineItem('item');
                                break;
                            }
                        }
                    } else {
                        /**
                         * SHOULD BE AN ERROR ???
                         */

                        var message = '';
                        message += 'AP Item: ' + searchResults[n].getText(
                            'custrecord_ap_stock_line_item', 'CUSTRECORD_AP_PRODUCT_ORDER',
                            "GROUP");
                        message += ' | LineID: ' + searchResults[n].getValue('internalid',
                            'CUSTRECORD_AP_PRODUCT_ORDER', "GROUP");
                        message += ' | OrderID:' + searchResults[n].getValue('internalid',
                            null, "GROUP");


                        nlapiCreateError('Pricing Algorithm Undefined', message);

                        return false;
                    }
                }
            } catch (err) {
                nlapiCreateError(err);
                nlapiLogExecution('ERROR', 'Error', err);
                nlapiLogExecution('ERROR', 'LineID :', searchResults[n].getValue(
                    'internalid', 'CUSTRECORD_AP_PRODUCT_ORDER', "GROUP"));
                nlapiLogExecution('ERROR', 'OrderID :', searchResults[n].getValue(
                    'internalid', null, "GROUP"));
                return false;
            }
            nlapiLogExecution('AUDIT', 'Loop: ' + invCount + '.' + n + ' | LineID: ' +
                searchResults[n].getValue('internalid', 'CUSTRECORD_AP_PRODUCT_ORDER',
                    "GROUP"), usage_per_loop - ctx.getRemainingUsage());
            nlapiLogExecution('AUDIT', 'Loop: ' + invCount + '.' + n +
                ' | Product IDS: ' + internal_id, usage_per_loop - ctx.getRemainingUsage()
            );
        }

        //--------------- Submit Current Invoice ---------------//
        internal_id = removeDups(internal_id);
        nlapiLogExecution('AUDIT', 'Loop: ' + invCount + '.' + n +
            ' | Product IDS: ' + internal_id, usage_per_loop - ctx.getRemainingUsage()
        );
        recInvoice.setFieldValues('custbody_mpex_product_order', internal_id);
        invoiceId = nlapiSubmitRecord(recInvoice);
        nlapiLogExecution('AUDIT', 'InvID: ' + invoiceId + ' | Usage: ',
            usage_per_inv - ctx.getRemainingUsage());

        if (!isNullorEmpty(invoiceId)) {
            for (var z = 0; z < internal_id.length; z++) {
                var recOrder = nlapiLoadRecord('customrecord_mp_ap_product_order',
                    internal_id[z]);
                recOrder.setFieldValue('custrecord_mp_ap_order_order_status', 6);
                recOrder.setFieldValue('custrecord_mp_ap_order_invoicenum', invoiceId);
                var submitted = nlapiSubmitRecord(recOrder);
            }

        }

        nlapiLogExecution('AUDIT', '---> END', ctx.getRemainingUsage());
    }
}

function removeDups(arr) {
    var unique_array = arr.filter(function (elem, index, self) {
        return index == self.indexOf(elem);
    });
    return unique_array;
}
