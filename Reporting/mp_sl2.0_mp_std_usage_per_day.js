/**
 
 *@NApiVersion 2.0
 *@NScriptType Suitelet

 */


define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/record', 'N/http', 'N/log', 'N/redirect'],
    function (ui, email, runtime, search, record, http, log, redirect) {
        var role = 0;
        var zee = 0;

        function onRequest(context) {
            var baseURL = 'https://system.na2.netsuite.com';
            if (runtime.EnvType == "SANDBOX") {
                baseURL = 'https://system.sandbox.netsuite.com';
            }
            zee = 0;
            role = runtime.getCurrentUser().role;

            if (role == 1000) {
                zee = runtime.getCurrentUser().id;
            } else if (role == 3) { //Administrator
                zee = 6; //test
            } else if (role == 1032) { // System Support
                zee = 425904; //test-AR
            }

            if (context.request.method === 'GET') {
                var start_date = context.request.parameters.start_date;
                var last_date = context.request.parameters.last_date;
                zee = context.request.parameters.zee;

                if (isNullorEmpty(start_date)) {
                    start_date = null;
                }

                if (isNullorEmpty(last_date)) {
                    last_date = null;
                }


                var stateID = context.request.parameters.state;
                if (isNullorEmpty(stateID)) {
                    stateID = null;
                }

                var customerID = context.request.parameters.custid;
                if (isNullorEmpty(customerID)) {
                    customerID = null;
                }


                if (isNullorEmpty(context.request.parameters.custid)) {
                    var form = ui.createForm({
                        title: 'MP Standard Daily Usage'
                    });
                } else {
                    var customer_record = record.load({
                        type: 'customer',
                        id: parseInt(context.request.parameters.custid)
                    });

                    company_name = customer_record.getValue({
                        fieldId: 'companyname'
                    });

                    var form = ui.createForm({
                        title: 'MP Standard Daily Usage - ' + company_name
                    });
                }

                var inlineHtml = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.16/css/jquery.dataTables.css"><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js"></script><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script><link rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/><script src="https://system.na2.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script><link type="text/css" rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css"><script src="https://cdn.datatables.net/searchpanes/1.2.1/js/dataTables.searchPanes.min.js"><script src="https://cdn.datatables.net/select/1.3.3/js/dataTables.select.min.js"></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/drilldown.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/export-data.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script><style>.mandatory{color:red;} .body{background-color: #CFE0CE !important;}</style>';

                form.addField({
                    id: 'custpage_table_csv',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                });

                var custInternalIDField = form.addField({
                    id: 'custpage_custid',
                    type: ui.FieldType.TEXT,
                    label: 'Customer Internal ID'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                });

                custInternalIDField.defaultValue = customerID

                // inlineHtml += stateDropdownSection();

                if (role != 1000) {
                    //Search: SMC - Franchisees
                    var searchZees = search.load({
                        id: 'customsearch_smc_franchisee'
                    });
                    var resultSetZees = searchZees.run();

                    inlineHtml += franchiseeDropdownSection(resultSetZees, context);
                }

                inlineHtml += dateFilterSection(start_date, last_date);
                // inlineHtml += invoiceTypeSelection();
                inlineHtml += loadingSection();
                inlineHtml += '<div id="container"></div>'
                // inlineHtml += tableFilter();
                inlineHtml += dataTable();

                form.addButton({
                    id: 'download_csv',
                    label: 'Export as CSV',
                    functionName: 'downloadCsv()'
                });


                form.addButton({
                    id: 'submit',
                    label: 'Submit Search'
                });

                form.addField({
                    id: 'preview_table',
                    label: 'inlinehtml',
                    type: 'inlinehtml'
                }).updateLayoutType({
                    layoutType: ui.FieldLayoutType.STARTROW
                }).defaultValue = inlineHtml;

                form.clientScriptFileId = 5963975;

                context.response.writePage(form);
            } else {
                // redirect.toSuitelet({
                //  scriptId: 750,
                //  deploymentId: 1,
                //  parameters: {
                //      'type': 'create'
                //  }
                // });
            }
        }

        /**
         * The date input fields to filter the invoices.
         * Even if the parameters `date_from` and `date_to` are defined, they can't be initiated in the HTML code.
         * They are initiated with jQuery in the `pageInit()` function.
         * @return  {String} `inlineHtml`
         */
        function dateFilterSection(start_date, last_date) {
            var inlineHtml = '<div class="form-group container date_filter_section">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #103D39;">DATE FILTER</span></h4></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';


            inlineHtml += periodDropdownSection(start_date, last_date);

            inlineHtml += '<div class="form-group container date_filter_section">';
            inlineHtml += '<div class="row">';
            // Date from field
            inlineHtml += '<div class="col-xs-6 date_from">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="date_from_text">From</span>';
            if (isNullorEmpty(start_date)) {
                inlineHtml += '<input id="date_from" class="form-control date_from" type="date" />';
            } else {
                inlineHtml += '<input id="date_from" class="form-control date_from" type="date" value="' + start_date + '"/>';
            }

            inlineHtml += '</div></div>';
            // Date to field
            inlineHtml += '<div class="col-xs-6 date_to">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="date_to_text">To</span>';
            if (isNullorEmpty(last_date)) {
                inlineHtml += '<input id="date_to" class="form-control date_to" type="date">';
            } else {
                inlineHtml += '<input id="date_to" class="form-control date_to" type="date" value="' + last_date + '">';
            }

            inlineHtml += '</div></div></div></div>';

            return inlineHtml;
        }

        /**
         * The period dropdown field.
         * @param   {String}    date_from
         * @param   {String}    date_to
         * @return  {String}    `inlineHtml`
         */
        function stateDropdownSection() {
            var inlineHtml = '<div class="form-group container state_section">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #103D39;">STATE</span></h4></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';

            inlineHtml += '<div class="form-group container state_section">';
            inlineHtml += '<div class="row">';
            // Period dropdown field
            inlineHtml += '<div class="col-xs-12 state_dropdown_div">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="state_dropdown_text">State</span>';
            inlineHtml += '<select id="state_dropdown" class="form-control">';
            inlineHtml += '<option value=""></option>'
            inlineHtml += '<option value="6">ACT</option>';
            inlineHtml += '<option value="1">NSW</option>';
            inlineHtml += '<option value="8">NT</option>';
            inlineHtml += '<option value="2">QLD</option>';
            inlineHtml += '<option value="4">SA</option>';
            inlineHtml += '<option value="5">TAS</option>';
            inlineHtml += '<option value="3">VIC</option>';
            inlineHtml += '<option value="7">WA</option>';
            inlineHtml += '</select>';
            inlineHtml += '</div></div></div></div>';

            return inlineHtml;

        }


        /**
         * The period dropdown field.
         * @param   {String}    date_from
         * @param   {String}    date_to
         * @return  {String}    `inlineHtml`
         */
        function franchiseeDropdownSection(resultSetZees, context) {
            var inlineHtml = '<div class="form-group container date_filter_section">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #103D39;">FRANCHISEE</span></h4></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';

            inlineHtml += '<div class="form-group container zee_dropdown_section">';
            inlineHtml += '<div class="row">';
            // Period dropdown field
            inlineHtml += '<div class="col-xs-12 zee_dropdown_div">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="zee_dropdown_text">Franchisee</span>';
            inlineHtml += '<select id="zee_dropdown" class="form-control">';
            inlineHtml += '<option value=""></option>'
            resultSetZees.each(function (searchResult_zee) {
                zee_id = searchResult_zee.getValue('internalid');
                zee_name = searchResult_zee.getValue('companyname');

                if (context.request.parameters.zee == zee_id) {
                    inlineHtml += '<option value="' + zee_id + '" selected="selected">' + zee_name + '</option>';
                } else {
                    inlineHtml += '<option value="' + zee_id + '">' + zee_name + '</option>';
                }

                return true;
            });
            inlineHtml += '</select>';
            inlineHtml += '</div></div></div></div>';

            return inlineHtml;

        }


        /**
         * The period dropdown field.
         * @param   {String}    date_from
         * @param   {String}    date_to
         * @return  {String}    `inlineHtml`
         */
        function periodDropdownSection(date_from, date_to) {
            var selected_option = (isNullorEmpty(date_from) && isNullorEmpty(date_to)) ? 'selected' : '';
            var inlineHtml = '<div class="form-group container period_dropdown_section">';
            inlineHtml += '<div class="row">';
            // Period dropdown field
            inlineHtml += '<div class="col-xs-12 period_dropdown_div">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="period_dropdown_text">Period</span>';
            inlineHtml += '<select id="period_dropdown" class="form-control">';
            if (selected_option == '') {
                inlineHtml += '<option selected></option>';
                inlineHtml += '<option value="this_week">This Week</option>';
                inlineHtml += '<option value="last_week">Last Week</option>';
                inlineHtml += '<option value="this_month" >This Month</option>';
                inlineHtml += '<option value="last_month" >Last Month</option>';
            } else {
                inlineHtml += '<option selected></option>';
                inlineHtml += '<option value="this_week">This Week</option>';
                inlineHtml += '<option value="last_week">Last Week</option>';
                inlineHtml += '<option value="this_month">This Month</option>';
                inlineHtml += '<option value="last_month" >Last Month</option>';
            }

            inlineHtml += '<option value="full_year">Full Year (1 Jan -)</option>';
            inlineHtml += '<option value="financial_year">Financial Year (1 Jul -)</option>';
            inlineHtml += '</select>';
            inlineHtml += '</div></div></div></div>';

            return inlineHtml;
        }
        /**
         * The period dropdown field.
         * @param   {String}    date_from
         * @param   {String}    date_to
         * @return  {String}    `inlineHtml`
         */
        function invoiceTypeSelection(invoiceType) {
            var inlineHtml = '<div class="form-group container date_filter_section">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #103D39;">INVOICE TYPE</span></h4></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';
            var selected_option = (isNullorEmpty(invoiceType)) ? 'selected' : '';
            inlineHtml += '<div class="form-group container invoice_type_dropdown_section">';
            inlineHtml += '<div class="row">';
            // Period dropdown field
            inlineHtml += '<div class="col-xs-12 invoice_type_dropdown_div">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="invoice_type_dropdown_text">Invoice Type</span>';
            inlineHtml += '<select id="invoice_type_dropdown" class="form-control" multiple>';
            inlineHtml += '<option ' + selected_option + ' value="0">All</option>';
            inlineHtml += '<option value="1">Services - Excluding NP</option>';
            inlineHtml += '<option value="4">NeoPost</option>';
            inlineHtml += '<option value="8">MPEX</option>';
            inlineHtml += '</select>';
            inlineHtml += '</div></div></div></div>';

            return inlineHtml;
        }


        /**
         * The table that will display the differents invoices linked to the franchisee and the time period.
         * @return  {String}    inlineHtml
         */
        function dataTable() {
            var inlineHtml = '<style>table#customer_benchmark_preview {color: #103D39 !important; font-size: 12px;text-align: center;border: none;}.dataTables_wrapper {font-size: 14px;}table#customer_benchmark_preview th{text-align: center;} .bolded{font-weight: bold;}</style>';
            inlineHtml += '<table id="customer_benchmark_preview" class="table table-responsive table-striped customer tablesorter hide" style="width: 100%;">';
            inlineHtml += '<thead style="color: white;background-color: #379E8F;>';
            inlineHtml += '<tr class="text-center">';
            // inlineHtml += '<th>Invoice Internal ID</th>';
            // inlineHtml += '<th>Transaction Type</th>';
            // inlineHtml += '<th>Transaction Date</th>';
            // inlineHtml += '<th>Posting Period</th>';
            // inlineHtml += '<th>Document Number</th>';
            // inlineHtml += '<th>Item</th>';
            // inlineHtml += '<th>Quantity</th>';
            // inlineHtml += '<th>Amount</th>';
            // inlineHtml += '<th>Tax Total</th>';
            // inlineHtml += '<th>Days Open</th>';
            // inlineHtml += '<th>Days Overdue</th>';
            // inlineHtml += '<th>Closed Date</th>';
            // inlineHtml += '<th>Partner</th>';
            // inlineHtml += '<th>Location</th>';
            // inlineHtml += '<th>Invoice Status</th>';
            // inlineHtml += '<th>Customer Internal ID</th>';
            // inlineHtml += '<th>Customer ID</th>';
            // inlineHtml += '<th>Customer Name</th>';
            // inlineHtml += '<th>Customer Status</th>';
            // inlineHtml += '<th>Customer Start Date</th>';
            inlineHtml += '</tr>';
            inlineHtml += '</thead>';

            inlineHtml += '<tbody id="result_customer_benchmark" class="result-customer_benchmark"></tbody>';

            inlineHtml += '</table>';
            return inlineHtml;
        }

        /**
         * The header showing that the results are loading.
         * @returns {String} `inlineQty`
         */
        function loadingSection() {
            var inlineHtml = '<div id="loading_section" class="form-group container loading_section " style="text-align:center">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 loading_div">';
            inlineHtml += '<h1>Loading...</h1>';
            inlineHtml += '</div></div></div>';

            return inlineHtml;
        }

        /**
         * The date input fields to filter the invoices.
         * Even if the parameters `date_from` and `date_to` are defined, they can't be initiated in the HTML code.
         * They are initiated with jQuery in the `pageInit()` function.
         * @return  {String} `inlineHtml`
         */
        function tableFilter() {
            var inlineHtml = '<div id="table_filter_section" class="table_filters_section hide">';
            inlineHtml += '<div class="form-group container">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12">TABLE FILTERS</span></h4></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';

            inlineHtml += '<div class="form-group container table_filter_section">';
            inlineHtml += '<div class="row">';

            inlineHtml += '<div class="col-sm-4 showMPTicket_box">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="showMPTicket_box">Show/Hide | MP Ticket Column</span>';
            inlineHtml += '<button type="button" id="showMPTicket_box" class="toggle-mp-ticket btn btn-success"><span class="span_class glyphicon glyphicon-plus"></span></button>'
            inlineHtml += '</div></div>';

            // // MAAP Allocation
            inlineHtml += '<div class="col-sm-5 showMAAP_box">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="showMAAP_box">Show/Hide | Matching MAAP Allocation</span>';
            inlineHtml += '<button type="button" id="showMAAP_box" class="toggle-maap btn btn-success"><span class="span_class glyphicon glyphicon-plus"></span></button>'
            inlineHtml += '<button type="button" id="showMAAP_box" class="toggle-maap-danger btn btn-danger"><span class="span_class glyphicon glyphicon-minus"></span></button>'
            inlineHtml += '</div></div>';

            //Toggle MAAP Bank Account
            inlineHtml += '<div class="col-sm-auto showMAAP_bank">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="showMAAP_bank">Show/Hide | MAAP Bank Account</span>';
            inlineHtml += '<button type="button" id="showMAAP_bank" class="toggle-maap-bank btn btn-danger"><span class="span_class glyphicon glyphicon-minus"></span></button>'
            inlineHtml += '</div></div>';

            inlineHtml += '</div></div>';

            inlineHtml += '</div>';

            return inlineHtml;
        }

        /**
         * Used to pass the values of `date_from` and `date_to` between the scripts and to Netsuite for the records and the search.
         * @param   {String} date_iso       "2020-06-01"
         * @returns {String} date_netsuite  "1/6/2020"
         */
        function dateISOToNetsuite(date_iso) {
            var date_netsuite = '';
            if (!isNullorEmpty(date_iso)) {
                var date_utc = new Date(date_iso);
                // var date_netsuite = nlapiDateToString(date_utc);
                var date_netsuite = format.format({
                    value: date_utc,
                    type: format.Type.DATE
                });
            }
            return date_netsuite;
        }

        function isNullorEmpty(val) {
            if (val == '' || val == null) {
                return true;
            } else {
                return false;
            }
        }
        return {
            onRequest: onRequest
        };
    });