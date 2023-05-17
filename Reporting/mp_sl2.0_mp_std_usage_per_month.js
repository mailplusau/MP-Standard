/**
 *@NApiVersion 2.0
 * @NScriptType Suitelet
 * @Author: Ankith Ravindran <ankithravindran>
 * @Date:   2021-10-29T09:36:21+11:00
 * @Filename: mp_sl2.0_mpex_usage_per_month_v2.js
 * @Last modified by:   ankithravindran
 * @Last modified time: 2021-11-02T16:16:11+11:00
 */



define(
    ['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/record',
        'N/http', 'N/log', 'N/redirect'
    ],
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

                var customerID = context.request.parameters.customerid;
                if (isNullorEmpty(customerID)) {
                    customerID = null;
                }


                if (!isNullorEmpty(customerID)) {

                    var customer_record = record.load({
                        type: 'customer',
                        id: parseInt(context.request.parameters.customerid)
                    });

                    var customer_name = customer_record.getValue({
                        fieldId: 'companyname'
                    });

                    var customer_entityid = customer_record.getValue({
                        fieldId: 'entityid'
                    });

                    zee = customer_record.getValue({
                        fieldId: 'partner'
                    });

                    var form = ui.createForm({
                        title: 'MP Standard Monthly Usage - ' + customer_entityid + ' ' +
                            customer_name
                    });

                } else if (isNullorEmpty(context.request.parameters.zee)) {
                    var form = ui.createForm({
                        title: 'MP Standard Usage Overview'
                    });
                } else {
                    var partner_record = record.load({
                        type: 'partner',
                        id: parseInt(context.request.parameters.zee)
                    });

                    zee_name = partner_record.getValue({
                        fieldId: 'companyname'
                    });

                    var form = ui.createForm({
                        title: zee_name + 'MP Standard Usage Overview'
                    });
                }

                var inlineHtml =
                    '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.16/css/jquery.dataTables.css"><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js"></script><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script><link rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/><script src="https://system.na2.netsuite.com/core/media/media.nl?id=2060797&c=1048';
                inlineHtml +=
                    '144&h=ef2cda20731d146b5e98&_xt=.js"></script><link type="text/css" rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css"><script src="https://cdn.datatables.net/searchpanes/1.2.1/js/dataTables.searchPanes.min.js"><script src="https://cdn.datatables.net/select/1.3.3/js/dataTables.select.min.js"></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/drilldown.js"></script><script src="https://code.highcharts.com/modules/exporting.js">';
                inlineHtml +=
                    '</script><script src="https://code.highcharts.com/modules/export-data.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script><style>.mandatory{color:red;} .body{background-color: #CFE0CE !important;}</style>';

                form.addField({
                    id: 'custpage_table_csv',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                });

                // inlineHtml += stateDropdownSection();

                if (role != 1000) {
                    // Search: SMC - Franchisees
                    var searchZees = search.load({
                        id: 'customsearch_smc_franchisee'
                    });
                    var resultSetZees = searchZees.run();

                    inlineHtml += franchiseeDropdownSection(resultSetZees,
                        context);
                }

                if (zee != 0 && !isNullorEmpty(zee)) {
                    inlineHtml += customerDropdownSection(context)
                }

                inlineHtml += dateFilterSection(start_date, last_date);
                // inlineHtml += invoiceTypeSelection();
                inlineHtml += loadingSection();
                inlineHtml += tabsSection();
                // inlineHtml += '<div id="container"></div>'
                // inlineHtml += tableFilter();
                // inlineHtml += dataTable();

                // form.addButton({
                //     id: 'download_csv',
                //     label: 'Export as CSV',
                //     functionName: 'downloadCsv()'
                // });
                // form.addButton({
                //     id: 'exp_vs_act_usage',
                //     label: 'New Customer List - Last 4 Months',
                //     functionName: 'expActWeeklyUsage()'
                // });

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

                form.clientScriptFileId = 5964274;

                context.response.writePage(form);
            } else {
                // redirect.toSuitelet({
                // scriptId: 750,
                // deploymentId: 1,
                // parameters: {
                // 'type': 'create'
                // }
                // });
            }
        }

        /**
         * The customer dropdown field.
         * @param   {String}    date_from
         * @param   {String}    date_to
         * @return  {String}    `inlineHtml`
         */
        function customerDropdownSection(context) {

            var searchCustomers = search.load({
                id: 'customsearch_smc_customer'
            });

            searchCustomers.filters.push(search.createFilter({
                name: 'partner',
                join: null,
                operator: search.Operator.IS,
                values: zee
            }));

            var inlineHtml = '<div class="form-group container cust_filter_section">';
            inlineHtml += '<div class="row">';
            inlineHtml +=
                '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #103D39;">CUSTOMER</span></h4></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';

            inlineHtml += '<div class="form-group container cust_dropdown_section">';
            inlineHtml += '<div class="row">';
            // Period dropdown field
            inlineHtml += '<div class="col-xs-12 cust_dropdown_div">';
            inlineHtml += '<div class="input-group">';
            inlineHtml +=
                '<span class="input-group-addon" id="cust_dropdown_text">Customer</span>';
            inlineHtml += '<select id="cust_dropdown" class="form-control">';
            inlineHtml += '<option value=""></option>'
            searchCustomers.run().each(function (searchResult_cust) {
                cust_id = searchResult_cust.getValue({
                    name: 'internalid',
                    summary: "GROUP"
                });
                cust_name = searchResult_cust.getValue({
                    name: 'companyname',
                    summary: "GROUP"
                });

                if (context.request.parameters.customerid == cust_id) {
                    inlineHtml += '<option value="' + cust_id + '" selected="selected">' +
                        cust_name + '</option>';
                } else {
                    inlineHtml += '<option value="' + cust_id + '">' + cust_name +
                        '</option>';
                }

                return true;
            });
            inlineHtml += '</select>';
            inlineHtml += '</div></div></div></div>';

            return inlineHtml;

        }

        function tabsSection() {
            var inlineHtml = '<div >';

            // Tabs headers
            inlineHtml +=
                '<style>.nav > li.active > a, .nav > li.active > a:focus, .nav > li.active > a:hover { background-color: #095C7B; color: #fff }';
            inlineHtml +=
                '.nav > li > a, .nav > li > a:focus, .nav > li > a:hover { margin-left: 5px; margin-right: 5px; border: 2px solid #095C7B; color: #095C7B; }';
            inlineHtml += '</style>';

            inlineHtml +=
                '<div style="width: 95%; margin:auto; margin-bottom: 30px"><ul class="nav nav-pills nav-justified main-tabs-sections " style="margin:0%; ">';

            inlineHtml +=
                '<li role="presentation" class="active"><a data-toggle="tab" href="#overview"><b>OVERVIEW</b></a></li>';
            inlineHtml +=
                '<li role="presentation" class=""><a data-toggle="tab" href="#customer"><b>CUSTOMERS</b></a></li>';
            inlineHtml +=
                '<li role="presentation" class=""><a data-toggle="tab" href="#zee"><b>FRANCHISEES</b></a></li>';
            inlineHtml +=
                '<li role="presentation" class=""><a data-toggle="tab" href="#source"><b>SOURCE</b></a></li>';
            inlineHtml +=
                '<li role="presentation" class=""><a data-toggle="tab" href="#type"><b>PRODUCT TYPE</b></a></li>';

            inlineHtml += '</ul></div>';

            // Tabs content
            inlineHtml += '<div class="tab-content">';
            inlineHtml += '<div role="tabpanel" class="tab-pane active" id="overview">';
            inlineHtml += '<figure class="highcharts-figure">';
            inlineHtml += '<div id="container"></div>';
            inlineHtml += '</figure><br></br>';
            inlineHtml += dataTable('preview');
            inlineHtml += '</div>';

            inlineHtml += '<div role="tabpanel" class="tab-pane" id="customer">';
            inlineHtml += '<div class="form-group container">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-3 heading1"></div>';
            inlineHtml += '<div class="col-xs-3 heading1">';
            inlineHtml += '<div class="input-group">';
            inlineHtml +=
                '<span class="input-group-addon" id="top_range_text">TOP</span>';
            inlineHtml += '<select id="top_range" class="form-control">';
            inlineHtml += '<option value="0">All</option>';
            inlineHtml += '<option value="1" selected>25</option>';
            inlineHtml += '<option value="2">50</option>';
            inlineHtml += '<option value="4">75</option>';
            inlineHtml += '<option value="3">100</option>';
            inlineHtml += '</select>';
            inlineHtml += '</div></div>';
            inlineHtml += '<div class="col-xs-3 heading1">';
            inlineHtml += '<div class="input-group">';
            inlineHtml +=
                '<span class="input-group-addon" id="bottom_range_text">BOTTOM</span>';
            inlineHtml += '<select id="bottom_range" class="form-control">';
            inlineHtml += '<option value="0" selected></option>';
            inlineHtml += '<option value="1">25</option>';
            inlineHtml += '<option value="2">50</option>';
            inlineHtml += '<option value="3">75</option>';
            inlineHtml += '<option value="4">100</option>';
            inlineHtml += '</select>';
            inlineHtml += '</div></div>';
            inlineHtml += '<div class="col-xs-3 heading1"></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';
            inlineHtml += '';
            inlineHtml += '';
            inlineHtml += '<figure class="highcharts-figure">';

            inlineHtml += '<div id="container2"></div>';
            inlineHtml += '</figure><br></br>';
            inlineHtml += dataTable('customer');
            inlineHtml += '</div>';

            inlineHtml += '<div role="tabpanel" class="tab-pane" id="zee">';

            inlineHtml += '<figure class="highcharts-figure">';
            inlineHtml += '<div id="container3"></div>';
            inlineHtml += '</figure><br></br>';
            inlineHtml += dataTable('zee');
            inlineHtml += '</div>';

            inlineHtml += '<div role="tabpanel" class="tab-pane" id="source">';
            inlineHtml += '<figure class="highcharts-figure">';
            inlineHtml += '<div id="container4"></div>';
            inlineHtml += '</figure><br></br>';
            inlineHtml += dataTable('source');
            inlineHtml += '</div>';

            inlineHtml += '<div role="tabpanel" class="tab-pane" id="type">';
            inlineHtml += '<figure class="highcharts-figure">';
            inlineHtml += '<div id="container5"></div>';
            inlineHtml += '</figure><br></br>';
            inlineHtml += dataTable('type');
            inlineHtml += '</div>';

            inlineHtml += '</div></div>';

            return inlineHtml;
        }

        /**
         * The date input fields to filter the invoices. Even if the
         * parameters `date_from` and `date_to` are defined, they can't be
         * initiated in the HTML code. They are initiated with jQuery in the
         * `pageInit()` function.
         *
         * @return {String} `inlineHtml`
         */
        function dateFilterSection(start_date, last_date) {
            var inlineHtml = '<div class="form-group container date_filter_section">';
            inlineHtml += '<div class="row">';
            inlineHtml +=
                '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #103D39;">DATE FILTER</span></h4></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';

            inlineHtml += periodDropdownSection(start_date, last_date);

            inlineHtml += '<div class="form-group container date_filter_section">';
            inlineHtml += '<div class="row">';
            // Date from field
            inlineHtml += '<div class="col-xs-6 date_from">';
            inlineHtml += '<div class="input-group">';
            inlineHtml +=
                '<span class="input-group-addon" id="date_from_text">From</span>';
            if (isNullorEmpty(start_date)) {
                inlineHtml +=
                    '<input id="date_from" class="form-control date_from" type="date" />';
            } else {
                inlineHtml +=
                    '<input id="date_from" class="form-control date_from" type="date" value="' +
                    start_date + '"/>';
            }

            inlineHtml += '</div></div>';
            // Date to field
            inlineHtml += '<div class="col-xs-6 date_to">';
            inlineHtml += '<div class="input-group">';
            inlineHtml += '<span class="input-group-addon" id="date_to_text">To</span>';
            if (isNullorEmpty(last_date)) {
                inlineHtml +=
                    '<input id="date_to" class="form-control date_to" type="date">';
            } else {
                inlineHtml +=
                    '<input id="date_to" class="form-control date_to" type="date" value="' +
                    last_date + '">';
            }

            inlineHtml += '</div></div></div></div>';

            return inlineHtml;
        }

        /**
         * The period dropdown field.
         *
         * @param {String}
         *            date_from
         * @param {String}
         *            date_to
         * @return {String} `inlineHtml`
         */
        function franchiseeDropdownSection(resultSetZees, context) {
            var inlineHtml = '<div class="form-group container date_filter_section">';
            inlineHtml += '<div class="row">';
            inlineHtml +=
                '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #103D39;">FRANCHISEE</span></h4></div>';
            inlineHtml += '</div>';
            inlineHtml += '</div>';

            inlineHtml += '<div class="form-group container zee_dropdown_section">';
            inlineHtml += '<div class="row">';
            // Period dropdown field
            inlineHtml += '<div class="col-xs-12 zee_dropdown_div">';
            inlineHtml += '<div class="input-group">';
            inlineHtml +=
                '<span class="input-group-addon" id="zee_dropdown_text">Franchisee</span>';
            inlineHtml += '<select id="zee_dropdown" class="form-control">';
            inlineHtml += '<option value=""></option>'
            resultSetZees.each(function (searchResult_zee) {
                zee_id = searchResult_zee.getValue('internalid');
                zee_name = searchResult_zee.getValue('companyname');

                if (zee == zee_id) {
                    inlineHtml += '<option value="' + zee_id +
                        '" selected="selected">' + zee_name +
                        '</option>';
                } else {
                    inlineHtml += '<option value="' + zee_id + '">' +
                        zee_name + '</option>';
                }

                return true;
            });
            inlineHtml += '</select>';
            inlineHtml += '</div></div></div></div>';

            return inlineHtml;

        }

        /**
         * The period dropdown field.
         *
         * @param {String}
         *            date_from
         * @param {String}
         *            date_to
         * @return {String} `inlineHtml`
         */
        function periodDropdownSection(date_from, date_to) {
            var selected_option = (isNullorEmpty(date_from) && isNullorEmpty(date_to)) ?
                'selected' :
                '';
            var inlineHtml =
                '<div class="form-group container period_dropdown_section">';
            inlineHtml += '<div class="row">';
            // Period dropdown field
            inlineHtml += '<div class="col-xs-12 period_dropdown_div">';
            inlineHtml += '<div class="input-group">';
            inlineHtml +=
                '<span class="input-group-addon" id="period_dropdown_text">Period</span>';
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
            inlineHtml +=
                '<option value="financial_year">Financial Year (1 Jul -)</option>';
            inlineHtml += '</select>';
            inlineHtml += '</div></div></div></div>';

            return inlineHtml;
        }

        /**
         * The table that will display the differents invoices linked to the
         * franchisee and the time period.
         *
         * @return {String} inlineHtml
         */
        function dataTable(name) {
            var inlineHtml = '<style>table#mpexusage-' +
                name +
                ' {color: #103D39 !important; font-size: 12px;text-align: center;border: none;}.dataTables_wrapper {font-size: 14px;}table#mpexusage-' +
                name +
                ' th{text-align: center;} .bolded{font-weight: bold;}</style>';
            inlineHtml += '<table id="mpexusage-' +
                name +
                '" class="table table-responsive table-striped customer tablesorter" style="width: 100%;">';
            inlineHtml += '<thead style="color: white;background-color: #095C7B;">';
            inlineHtml += '<tr class="text-center">';

            inlineHtml += '</tr>';
            inlineHtml += '</thead>';

            inlineHtml += '<tbody id="result_usage_' + name + '" ></tbody>';

            inlineHtml += '</table>';
            return inlineHtml;
        }

        /**
         * The header showing that the results are loading.
         *
         * @returns {String} `inlineHtml`
         */
        function loadingSection() {
            var inlineHtml =
                '<div id="loading_section" class="form-group container loading_section " style="text-align:center">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 loading_div">';
            inlineHtml += '<h1>Loading...</h1>';
            inlineHtml += '</div></div></div>';

            return inlineHtml;
        }

        /**
         * Used to pass the values of `date_from` and `date_to` between the
         * scripts and to Netsuite for the records and the search.
         *
         * @param {String}
         *            date_iso "2020-06-01"
         * @returns {String} date_netsuite "1/6/2020"
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
