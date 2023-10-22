/**
 * Module Description
 *
 * NSVersion    Date                        Author
 * 1.00         2022-09-21 12:30:18         Ankith
 *
 * Description: Create Product Orders for MP Standard Products weekly.
 *
 * @Last modified by:   ankithravindran
 *
 */

var usage_threshold = 200; //20
var usage_threshold_invoice = 1000; //1000
var adhoc_inv_deploy = 'customdeploy2';
var prev_inv_deploy = null;
var ctx = nlapiGetContext();

var reschedule = null;

function main() {

    nlapiLogExecution('AUDIT', 'prev_deployment', ctx.getSetting('SCRIPT',
        'custscript_prev_deploy_create_prod_order'));

    prev_inv_deploy = ctx.getDeploymentId();


    /**
     * MP Standard - Create Product Order (For Weekly Invoicing)
     */
    var createProdOrderSearch = nlapiLoadSearch(
        'customrecord_customer_product_stock',
        'customsearch_mp_std_create_prod_order');

    var resultCreateProdOrder = createProdOrderSearch.runSearch();

    var old_customer_id = null;
    var product_order_id;
    var count = 0;

    /**
     * Go through each line item from the search.
     */
    resultCreateProdOrder.forEachResult(function (searchResult) {

        var usage_loopstart_cust = ctx.getRemainingUsage();

        var cust_prod_stock_id = searchResult.getValue("internalid")
        var barcode = searchResult.getValue("name")
        var connote_number = searchResult.getValue("custrecord_connote_number")
        var reference_id = searchResult.getValue("custrecord_ext_reference_id")
        var external_job_id = searchResult.getValue("custrecord_job_id")
        var cust_prod_customer = searchResult.getValue(
            "custrecord_cust_prod_stock_customer")
        var cust_prod_zee = searchResult.getValue(
            "custrecord_cust_prod_stock_zee")
        var cust_prod_integration = searchResult.getValue(
            "custrecord_integration")
        var cust_prod_date_stock_used = searchResult.getValue(
            "custrecord_cust_date_stock_used")
        var product_name = searchResult.getValue(
            "custrecord_cust_stock_prod_name")
        var cust_prod_stock_status = searchResult.getValue(
            "custrecord_cust_prod_stock_status")

        var week_of_usage = searchResult.getValue(
            "formuladate");

        nlapiLogExecution('DEBUG', 'week_of_usage', week_of_usage);


        var z1 = cust_prod_date_stock_used.split('/');
        var date = (parseInt(z1[0]) < 10 ? '0' : '') + parseInt(z1[0]);
        var month = (parseInt(z1[1]) < 10 ? '0' : '') + parseInt(z1[1]);

        var new_date = date + '/' + month + '/' + z1[2];

        nlapiLogExecution('DEBUG', 'Barcode', barcode);


        if (cust_prod_customer != old_customer_id) {

            /**
             * Reschedule script after creating product order for each customer
             */
            if (count != 0) {

                var params = {
                    custscript_prev_deploy_create_prod_order: ctx.getDeploymentId(),
                }

                reschedule = rescheduleScript(prev_inv_deploy, adhoc_inv_deploy,
                    params);
                nlapiLogExecution('AUDIT', 'Reschedule Return', reschedule);
                if (reschedule == false) {

                    return false;
                }
            }

            /**
             * Create Product Order
             */
            nlapiLogExecution('DEBUG', 'New Prod Order');

            var product_order_rec = nlapiCreateRecord(
                'customrecord_mp_ap_product_order');
            product_order_rec.setFieldValue('custrecord_ap_order_customer',
                cust_prod_customer);
            product_order_rec.setFieldValue('custrecord_mp_ap_order_franchisee',
                cust_prod_zee);
            product_order_rec.setFieldValue('custrecord_mp_ap_order_order_status',
                4); //Order Fulfilled
            product_order_rec.setFieldValue('custrecord_mp_ap_order_date',
                getDate());
            product_order_rec.setFieldValue(
                'custrecord_ap_order_fulfillment_date', getDate());
            product_order_rec.setFieldValue('custrecord_mp_ap_order_source', 6);
            product_order_rec.setFieldValue('custrecord_fuel_surcharge_applied',
                1);
            product_order_id = nlapiSubmitRecord(product_order_rec);


            /**
             * Update Customer record
             */
            var customer_record = nlapiLoadRecord(
                'customer', cust_prod_customer);
            if (isNullorEmpty(customer_record.getFieldValue(
                'custentity_mp_std_date_first_usage'))) {
                customer_record.setFieldValue(
                    'custentity_mp_std_date_first_usage', week_of_usage);
            }
            customer_record.setFieldValue(
                'custentity_mp_std_date_last_usage', week_of_usage);

            var weeks_used = customer_record.getFieldValue(
                'custentity_mp_std_weeks_used');

            weeks_used = parseInt(weeks_used) + 1;
            customer_record.setFieldValue(
                'custentity_mp_std_weeks_used', weeks_used);
            nlapiSubmitRecord(customer_record);

            /**
             * Create Line Items associated to the product order.
             */
            var ap_stock_line_item = nlapiCreateRecord(
                'customrecord_ap_stock_line_item');
            ap_stock_line_item.setFieldValue('custrecord_ap_product_order',
                product_order_id);
            ap_stock_line_item.setFieldValue('custrecord_ap_stock_line_item', product_name);

            if (!isNullorEmpty(connote_number)) {
                inv_details = 'Used:' + new_date + '-' + connote_number;
            }

            ap_stock_line_item.setFieldValue(
                'custrecord_ap_line_item_inv_details', inv_details);
            ap_stock_line_item.setFieldValue(
                'custrecord_ap_stock_line_actual_qty', 1);
            nlapiSubmitRecord(ap_stock_line_item);


            /**
             * Update Customer Product Stock record with the product order ID
             */
            var cust_prod_stock_record = nlapiLoadRecord(
                'customrecord_customer_product_stock', cust_prod_stock_id);
            cust_prod_stock_record.setFieldValue(
                'custrecord_prod_stock_prod_order', product_order_id)
            cust_prod_stock_record.setFieldValue(
                'custrecord_cust_prod_stock_status', 7)
            nlapiSubmitRecord(cust_prod_stock_record);


        } else {

            /**
             * Create Line Items associated to the product order.
             */
            var ap_stock_line_item = nlapiCreateRecord(
                'customrecord_ap_stock_line_item');
            ap_stock_line_item.setFieldValue('custrecord_ap_product_order',
                product_order_id);
            ap_stock_line_item.setFieldValue('custrecord_ap_stock_line_item', product_name);

            if (!isNullorEmpty(connote_number)) {
                inv_details = 'Used:' + new_date + '-' + connote_number;
            }

            ap_stock_line_item.setFieldValue(
                'custrecord_ap_line_item_inv_details', inv_details);
            ap_stock_line_item.setFieldValue(
                'custrecord_ap_stock_line_actual_qty', 1);
            nlapiSubmitRecord(ap_stock_line_item);


            /**
             * Update Customer Product Stock record with the product order ID
             */
            var cust_prod_stock_record = nlapiLoadRecord(
                'customrecord_customer_product_stock', cust_prod_stock_id);
            cust_prod_stock_record.setFieldValue(
                'custrecord_prod_stock_prod_order', product_order_id)
            cust_prod_stock_record.setFieldValue(
                'custrecord_cust_prod_stock_status', 7)
            nlapiSubmitRecord(cust_prod_stock_record);


            /**
             * Reschedule script after updating product order with AP Line Item an the count of line items created is 150
             */
            if (count > 450) {
                nlapiLogExecution('DEBUG', 'Count', count)
                var params = {
                    custscript_prev_deploy_create_prod_order: ctx.getDeploymentId(),
                }

                reschedule = rescheduleScript(prev_inv_deploy, adhoc_inv_deploy,
                    params);
                nlapiLogExecution('AUDIT', 'Reschedule Return', reschedule);
                if (reschedule == false) {

                    return false;
                }
            }
        }


        old_customer_id = cust_prod_customer;
        count++;

        return true;
    });

    if (count > 0 && reschedule == null) {

    }
}

/**
 * Return today's date
 * @return {[String]} today's date
 */
function getDate() {
    var date = new Date();
    if (date.getHours() > 6) {
        date = nlapiAddDays(date, 1);
    }
    date = nlapiDateToString(date);

    return date;
}
