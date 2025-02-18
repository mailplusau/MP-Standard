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
                        title: 'MP Product Scans Weekly Usage'
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
                        title: 'MP Product Scans Weekly Usage - ' + company_name
                    });
                }

                var inlineHtml =
                    '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/2.0.7/css/dataTables.dataTables.css"><link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/buttons/3.0.2/css/buttons.dataTables.css"><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/2.0.7/js/dataTables.js"></script><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/3.0.2/js/dataTables.buttons.js"></script><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.dataTables.js"></script><script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script><script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script><script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.html5.min.js"></script><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.print.min.js"></script><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script><script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA92XGDo8rx11izPYT7z2L-YPMMJ6Ih1s0&callback=initMap&libraries=places"></script><link rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/><script src="https://system.na2.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script><link type="text/css" rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css"><script src="https://cdn.datatables.net/searchpanes/1.2.1/js/dataTables.searchPanes.min.js"><script src="https://cdn.datatables.net/select/1.3.3/js/dataTables.select.min.js"></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/drilldown.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/export-data.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script>';
                inlineHtml +=
                    '<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" /><script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>';
                inlineHtml +=
                    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/css/bootstrap-select.min.css">';
                inlineHtml +=
                    '<script src="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/js/bootstrap-select.min.js"></script>';
                // Semantic Select
                inlineHtml +=
                    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.13/semantic.min.css">';
                inlineHtml +=
                    '<script src="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.13/semantic.min.js"></script>';

                inlineHtml += '<style>.mandatory{color:red;} .body{background-color: #CFE0CE !important;}.wrapper{position:fixed;height:2em;width:2em;overflow:show;margin:auto;top:0;left:0;bottom:0;right:0;justify-content: center; align-items: center; display: -webkit-inline-box;} .ball{width: 22px; height: 22px; border-radius: 11px; margin: 0 10px; animation: 2s bounce ease infinite;} .blue{background-color: #0f3d39; }.red{background-color: #095C7B; animation-delay: .25s;}.yellow{background-color: #387081; animation-delay: .5s}.green{background-color: #d0e0cf; animation-delay: .75s}@keyframes bounce{50%{transform: translateY(25px);}}.select2-selection__choice{ background-color: #095C7B !important; color: white !important}.select2-selection__choice__remove{color: red !important;}</style>'

                form.addField({
                    id: 'custpage_table_csv_monthly',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                });
                form.addField({
                    id: 'custpage_table_csv_weekly',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                });
                form.addField({
                    id: 'custpage_table_csv_daily',
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

                // Tabs headers
                inlineHtml +=
                    '<style>.nav > li.active > a, .nav > li.active > a:focus, .nav > li.active > a:hover { background-color: #095c7b; color: #fff }';
                inlineHtml +=
                    '.nav > li > a, .nav > li > a:focus, .nav > li > a:hover { margin-left: 5px; margin-right: 5px; border: 2px solid #095c7b; color: #095c7b; }';
                inlineHtml += '</style>';

                inlineHtml +=
                    '<div style="width: 95%; margin:auto; margin-bottom: 30px"><ul class="nav nav-pills nav-justified main-tabs-sections " style="margin:0%; ">';

                inlineHtml +=
                    '<li role="presentation" class="active"><a data-toggle="tab" href="#monthly_scans"><b>MONTHLY</b></a></li>';
                inlineHtml +=
                    '<li role="presentation" class=""><a data-toggle="tab" href="#weekly_scans"><b>WEEKLY</b></a></li>';
                inlineHtml +=
                    '<li role="presentation" class=""><a data-toggle="tab" href="#daily_scans"><b>DAILY</b></a></li>';

                inlineHtml += '</ul></div>';

                // Tabs content
                inlineHtml += '<div class="tab-content">';
                inlineHtml += '<div role="tabpanel" class="tab-pane active" id="monthly_scans">';
                inlineHtml += '<figure class="highcharts-figure">';
                inlineHtml += '<div id="container_monthly"></div>';
                inlineHtml += '</figure><br></br>';
                inlineHtml += dataTable('monthly_scans');
                inlineHtml += '</div>';

                inlineHtml += '<div role="tabpanel" class="tab-pane" id="weekly_scans">';

                inlineHtml += '<figure class="highcharts-figure">';
                inlineHtml += '<div id="container_weekly"></div>';
                inlineHtml += '</figure><br></br>';
                inlineHtml += dataTable('weekly_scans');
                inlineHtml += '</div>';

                inlineHtml += '<div role="tabpanel" class="tab-pane" id="daily_scans">';

                inlineHtml += '<figure class="highcharts-figure">';
                inlineHtml += '<div id="container_daily"></div>';
                inlineHtml += '</figure><br></br>';
                inlineHtml += dataTable('daily_scans');
                inlineHtml += '</div>';


                inlineHtml += '</div></div>';
                // inlineHtml += '<div id="container"></div>'
                // inlineHtml += tableFilter();
                // inlineHtml += dataTable();

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

                form.clientScriptFileId = 6068299;

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
            inlineHtml += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #095C7B;">DATE FILTER</span></h4></div>';
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
            inlineHtml += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #095C7B;">FRANCHISEE</span></h4></div>';
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
        function dataTable(name) {
            var inlineHtml = '<style>table#mpexusage-' +
                name +
                ' {color: #103D39 !important; font-size: 12px;text-align: center;border: none;}.dataTables_wrapper {font-size: 14px;}table#mpexusage-' +
                name +
                ' th{text-align: center;} .bolded{font-weight: bold;} .exportButtons{background-color: #045d7b !important;color: white !important;border-radius: 25px !important;}</style>';
            inlineHtml += '<table id="mpexusage-' +
                name +
                '" class="table table-responsive table-striped customer tablesorter" style="width: 100%;">';
            inlineHtml += '<thead style="color: white;background-color: #095c7b;">';
            inlineHtml += '<tr class="text-center">';

            inlineHtml += '</tr>';
            inlineHtml += '</thead>';

            inlineHtml += '<tbody id="result_usage_' + name + '" ></tbody>';

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