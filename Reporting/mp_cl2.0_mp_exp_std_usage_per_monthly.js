/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @Author: Ankith Ravindran <ankithravindran>
 * @Date:   2021-10-29T09:36:21+11:00
 * @Filename: mp_cl2.0_mpex_usage_per_day_v2.js
 * @Last modified by:   ankithravindran
 * @Last modified time: 2021-11-09T14:47:48+11:00
 */


define(['N/email', 'N/runtime', 'N/search', 'N/record', 'N/http', 'N/log',
    'N/error', 'N/url', 'N/format', 'N/currentRecord'
],
    function (email, runtime, search, record, http, log, error, url, format,
        currentRecord) {
        var zee = 0;
        var role = 0;
        // var custid = 0;

        var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://1048144-sb3.app.netsuite.com';
        }

        role = runtime.getCurrentUser().role;
        var userName = runtime.getCurrentUser().name;
        var userId = runtime.getCurrentUser().id;
        var currRec = currentRecord.get();

        var invoiceType = null;

        var no_of_working_days = [];
        var invoiceTypeServices = [];
        var invoiceTypeMPEX = [];
        var invoiceTypeNeoPost = [];

        var total_revenue_per_state = [];

        var month;
        var weekdays_current_month;

        var express_speed = 0;
        var standard_speed = 0;
        var sendle_au_express = 0;
        var total_usage = 0;

        var express_speed_monthly = 0;
        var standard_speed_monthly = 0;
        var sendle_au_express_monthly = 0;
        var total_usage_monthly = 0;

        var express_speed_cust_usage = 0;
        var standard_speed_cust_usage = 0;
        var sendle_au_express_cust_usage = 0;
        var total_usage_cust_usage = 0;

        var express_speed_zee_usage = 0;
        var standard_speed_zee_usage = 0;
        var sendle_au_express_zee_usage = 0;
        var total_usage_zee_usage = 0;

        var source_manual = 0;
        var source_portal = 0;
        var source_bulk = 0;
        var source_shopify = 0;
        var total_source_usage = 0;

        var exp_dl = 0;
        var exp_c5 = 0;
        var exp_b4 = 0;
        var exp_500g = 0;
        var exp_1kg = 0;
        var exp_3kg = 0;
        var exp_5kg = 0;
        var std_250g = 0;
        var std_500g = 0;
        var std_1kg = 0;
        var std_3kg = 0;
        var std_5kg = 0;
        var std_10kg = 0;
        var std_20kg = 0;
        var std_25kg = 0;
        var total_weight_usage = 0;

        var total_months = 14;

        var custid = null;

        var today = new Date();
        var today_day_in_month = today.getDate();
        var today_day_in_week = today.getDay();
        var today_month = today.getMonth() + 1;
        var today_year = today.getFullYear();

        if (today_day_in_month < 10) {
            today_day_in_month = '0' + today_day_in_month;
        }

        if (today_month < 10) {
            today_month = '0' + (today_month);
        }

        var todayString = today_day_in_month + '/' + today_month + '/' +
            today_year;
        // console.log('Todays Date: ' + todayString);

        var current_year_month = today_year + '-' + today_month;
        // console.log('Current Year-Month: ' + current_year_month);

        var difference_months = total_months - parseInt(today_month);



        if (role == 1000) {
            zee = runtime.getCurrentUser().id;
        } else if (role == 3) { //Administrator
            zee = 6; //test
        } else if (role == 1032) { // System Support
            zee = 425904; //test-AR
        }


        function isWeekday(year, month, day) {
            var day = new Date(year, month, day).getDay();
            return day != 0 && day != 6;
        }

        function getWeekdaysInMonth(month, year) {
            var days = daysInMonth(month, year);
            var weekdays = 0;
            for (var i = 0; i < days; i++) {
                if (isWeekday(year, month, i + 1)) weekdays++;
            }
            return weekdays;
        }

        function daysInMonth(iMonth, iYear) {
            return 32 - new Date(iYear, iMonth, 32).getDate();
        }

        function pageLoad() {
            $('.range_filter_section').addClass('hide');
            $('.range_filter_section_top').addClass('hide');
            $('.date_filter_section').addClass('hide');
            $('.period_dropdown_section').addClass('hide');

            $('.loading_section').removeClass('hide');
        }

        function beforeSubmit() {
            $('#customer_benchmark_preview').hide();
            $('#customer_benchmark_preview').addClass('hide');
            $('#customer_benchmark_preview').addClass('hide');

            $('.loading_section').removeClass('hide');
        }

        function afterSubmit() {
            $('.tabs_div').removeClass('hide');
            $('.date_filter_section').removeClass('hide');
            $('.date_filter_div').removeClass('hide');
            $('.filter_buttons_section').removeClass('hide');
            $('.zee_label_section').removeClass('hide');
            $('.zee_dropdown_div').removeClass('hide');
            $('.cust_label_section').removeClass('hide');
            $('.cust_dropdown_div').removeClass('hide');
            $('.period_dropdown_section').removeClass('hide');
            $('.datatable_div').removeClass('hide');
            $('.instruction_div').removeClass('hide');
            $('.show_buttons_section').removeClass('hide');

            $('.source_label_section').removeClass('hide');
            $('.source_dropdown_div').removeClass('hide');

            $('.loading_section').addClass('hide');

            $('#customer_benchmark_preview').show();
        }

        function pageInit() {
            // selectRangeOptions();

            $("#NS_MENU_ID0-item0").css("background-color", "#CFE0CE");
            $("#NS_MENU_ID0-item0 a").css("background-color", "#CFE0CE");
            $("#body").css("background-color", "#CFE0CE");

            debtDataSet = [];
            debt_set = [];


            debtDataSet2 = [];
            debt_set2 = [];

            debtDataSet3 = [];
            debt_set3 = [];

            debtDataSet4 = [];
            debt_set4 = [];

            debtDataSet5 = [];
            debt_set5 = [];

            debtDataSet6 = [];
            debt_set6 = [];

            $("#showGuide").click(function () {

                if ($('#show_filter').val() == 'HIDE FILTERS') {
                    $('#show_filter').trigger('click');
                }
                $("#myModal").show();

                return false;

            })

            $('.close').click(function () {
                $("#myModal").hide();
            });

            $("#show_filter").click(function () {
                if ($('#show_filter').val() == 'SHOW FILTERS') {
                    $('#show_filter').val('HIDE FILTERS');
                    $('#show_filter').css("background-color", "#F0AECB");
                    $('#show_filter').css("color", "#103d39");
                } else {
                    $('#show_filter').val('SHOW FILTERS');
                    $('#show_filter').css("background-color", "#EAF044 !important");
                    $('#show_filter').css("color", "#103d39");
                }

            });

            if (!isNullorEmpty($('#period_dropdown option:selected').val())) {
                selectDate();
            }
            $('#period_dropdown').change(function () {
                selectDate();
            });

            $('#invoice_type_dropdown').change(function () {
                invoiceType = $('#invoice_type_dropdown option:selected').val();
                // selectInvoiceType();
            });

            $("#applyFilter").click(function () {

                var date_from = $('#date_from').val();
                var date_to = $('#date_to').val();
                zee = $('#zee_dropdown option:selected').val();
                var barcodeSource = $('#source_dropdown option:selected').val();

                var custid = $('#cust_dropdown option:selected').val();

                if (isNullorEmpty(custid)) {
                    custid = "";
                }

                var currRec = currentRecord.get();
                var freq = currRec.getValue({
                    fieldId: 'custpage_freq',
                });

                var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1712&deploy=1&start_date=" + date_from + '&last_date=' + date_to + '&zee=' + zee + '&custid=' + custid + '&freq=' + freq + '&source=' + barcodeSource;


                window.location.href = url;

            });

            $("#clearFilter").click(function () {

                var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1712&deploy=1";


                window.location.href = url;

            });

            /**
             *  Submit Button Function
             */
            $('#submit').click(function () {
                // Ajax request
                var fewSeconds = 10;
                var btn = $(this);
                btn.addClass('disabled');
                // btn.addClass('')
                setTimeout(function () {
                    btn.removeClass('disabled');
                }, fewSeconds * 1000);

                debtDataSet = [];
                debt_set = [];

                debtDataSet2 = [];
                debt_set2 = [];

                debtDataSet3 = [];
                debt_set3 = [];

                debtDataSet4 = [];
                debt_set4 = [];

                debtDataSet5 = [];
                debt_set5 = [];

                debtDataSet6 = [];
                debt_set6 = [];

                beforeSubmit();
                submitSearch();

                return true;
            });


            /**
             *  Auto Load Submit Search and Load Results on Page Initialisation
             */

            submitSearch();
            var dataTable = $('#mpexusage-weekly_scans').DataTable();
            var dataTable2 = $('#mpexusage-monthly_scans').DataTable();
            var dataTable2 = $('#mpexusage-weekly_scans').DataTable();


            var today = new Date();
            var today_year = today.getFullYear();
            var today_month = today.getMonth();
            var today_day = today.getDate();

            /**
             *  Click for Instructions Section Collapse
             */
            $('.collapse').on('shown.bs.collapse', function () {
                $(".range_filter_section_top").css("padding-top", "500px");
            })
            $('.collapse').on('hide.bs.collapse', function () {
                $(".range_filter_section_top").css("padding-top", "0px");
            })
        }

        function adhocNewCustomers() {
            if (isNullorEmpty(invoiceType)) {
                var url = baseURL +
                    "/app/site/hosting/scriptlet.nl?script=1226&deploy=1";
            } else {
                var url = baseURL +
                    "/app/site/hosting/scriptlet.nl?script=1226&deploy=1&invoicetype=" +
                    invoiceType;
            }

            window.location.href = url;
        }


        function submitSearch() {
            // duringSubmit();

            dataTable = $('#mpexusage-monthly_scans').DataTable({
                destroy: true,
                data: debtDataSet,
                pageLength: 1000,
                order: [
                    [1, 'asc']
                ],
                columns: [{
                    title: 'View'
                }, {
                    title: 'Period'
                }, {
                    title: 'Express Usage'
                    // }, {
                    //     title: 'Sendle AU Express Usage'
                }, {
                    title: 'Standard Usage'
                }, {
                    title: 'Total Usage'
                }],
                columnDefs: [{
                    targets: [1, 4],
                    className: 'bolded'
                }]

            });

            dataTable2 = $('#mpexusage-customer_list').DataTable({
                destroy: true,
                data: debtDataSet2,
                pageLength: 1000,
                order: [
                    [5, 'desc']
                ],
                columns: [{
                    title: 'View'
                }, {
                    title: 'Customer'
                }, {
                    title: 'Franchisee'
                }, {
                    title: 'Express Usage'
                    // }, {
                    //     title: 'Sendle AU Express Usage'
                }, {
                    title: 'Standard Usage'
                }, {
                    title: 'Total Usage'
                }],
                columnDefs: [{
                    targets: [1, 2, 5],
                    className: 'bolded'
                }]

            });

            dataTable3 = $('#mpexusage-zee_list').DataTable({
                destroy: true,
                data: debtDataSet3,
                pageLength: 1000,
                order: [
                    [3, 'desc']
                ],
                columns: [{
                    title: 'Franchisee'
                }, {
                    title: 'Express Usage'
                    // }, {
                    //     title: 'Sendle AU Express Usage'
                }, {
                    title: 'Standard Usage'
                }, {
                    title: 'Total Usage'
                }],
                columnDefs: [{
                    targets: [0, 3],
                    className: 'bolded'
                }]

            });

            dataTable4 = $('#mpexusage-source').DataTable({
                destroy: true,
                data: debtDataSet4,
                pageLength: 1000,
                order: [
                    [0, 'asc']
                ],
                columns: [{
                    title: 'Period'
                }, {
                    title: 'Manual'
                }, {
                    title: 'Shopify'
                }, {
                    title: 'Customer Portal'
                }, {
                    title: 'Bulk'
                }, {
                    title: 'Total Usage'
                }],
                columnDefs: [{
                    targets: [0, 5],
                    className: 'bolded'
                }]

            });

            dataTable5 = $('#mpexusage-weights').DataTable({
                destroy: true,
                data: debtDataSet5,
                pageLength: 1000,
                order: [
                    [0, 'asc']
                ],
                columns: [{
                    title: 'Period'
                }, {
                    title: 'Express - DL'
                }, {
                    title: 'Express - C5'
                }, {
                    title: 'Express - B4'
                }, {
                    title: 'Express - 500g'
                }, {
                    title: 'Express - 1kg'
                }, {
                    title: 'Express - 3kg'
                }, {
                    title: 'Express - 5kg'
                }, {
                    title: 'Standard - 250g'
                }, {
                    title: 'Standard - 500g'
                }, {
                    title: 'Standard - 1kg'
                }, {
                    title: 'Standard - 3kg'
                }, {
                    title: 'Standard - 5kg'
                }, {
                    title: 'Standard - 10kg'
                }, {
                    title: 'Standard - 20kg'
                }, {
                    title: 'Standard - 25kg'
                }, {
                    title: 'Total Usage'
                }],
                columnDefs: [{
                    targets: [0, 16],
                    className: 'bolded'
                }]

            });



            // var range = $('#range_filter').val();
            // var state_id = $('#state_dropdown option:selected').val();
            // var invoiceType = $('#invoice_type_dropdown option:selected').val();
            zee = $('#zee_dropdown option:selected').val();
            var date_from = $('#date_from').val();
            var date_to = $('#date_to').val();
            date_from = dateISOToNetsuite(date_from);
            date_to = dateISOToNetsuite(date_to);
            var barcodeSource = $('#source_dropdown option:selected').val();

            console.log('Load DataTable Params: ' + date_from + ' | ' + date_to +
                ' | ' + zee);

            loadDebtRecord(date_from, date_to, zee, barcodeSource);

            console.log('Loaded Results');


            afterSubmit();
        }

        function loadDebtRecord(date_from, date_to, zee_id, barcodeSource) {

            var currRec = currentRecord.get();
            var freq = currRec.getValue({
                fieldId: 'custpage_freq',
            });

            console.log('freq: ' + freq);
            console.log('barcodeSource: ' + barcodeSource);

            if (freq == 'weekly') {
                console.log('inside weekly search')
                // All MP Products Usage - All Scans (Weekly)
                var mpScanMonthlyUsage = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch7114'
                });
            } else if (freq == 'daily') {
                console.log('inside daily search')
                // Customer Product Usage - All Scans (Daily)
                var mpScanMonthlyUsage = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch7117'
                });
            } else {
                console.log('inside monthly search')
                // All MP Products Usage - All Scans (Monthly)
                var mpScanMonthlyUsage = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch7108'
                });
            }


            var custID = currRec.getValue({
                fieldId: 'custpage_custid',
            });

            console.log('custID ' + custID);

            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpScanMonthlyUsage.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpScanMonthlyUsage.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpScanMonthlyUsage.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpScanMonthlyUsage.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            if (!isNullorEmpty(barcodeSource)) {
                mpScanMonthlyUsage.filters.push(search.createFilter({
                    name: 'custrecord_barcode_source',
                    join: null,
                    operator: search.Operator.IS,
                    values: barcodeSource
                }));
            }

            var count2 = 0;
            var oldDate2 = null;
            var oldIntegration2 = null;
            var oldIntegrationText = null;

            mpScanMonthlyUsage.run().each(function (mpScanMonthlyUsageSet) {

                var dateUsed = mpScanMonthlyUsageSet.getValue({
                    name: 'custrecord_cust_date_stock_used',
                    summary: 'GROUP'
                });


                var deliverySpeed = mpScanMonthlyUsageSet.getValue({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });
                var deliverySpeedText = mpScanMonthlyUsageSet.getText({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });

                var integration = mpScanMonthlyUsageSet.getValue({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });
                var integrationText = mpScanMonthlyUsageSet.getText({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });


                var mpexUsage = parseInt(mpScanMonthlyUsageSet.getValue({
                    name: 'name',
                    summary: 'COUNT'
                }));

                if (count2 == 0) {

                    if (integrationText == '- None -') {
                        express_speed_monthly = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_monthly = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_monthly = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly = mpexUsage;
                        }
                    }


                    total_usage_monthly = express_speed_monthly + standard_speed_monthly + sendle_au_express_monthly;

                } else if (oldDate2 != null &&
                    oldDate2 == dateUsed) {

                    if (integrationText == '- None -') {
                        express_speed_monthly += mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_monthly += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly += mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_monthly += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly += mpexUsage;
                        }
                    }

                    total_usage_monthly = express_speed_monthly + standard_speed_monthly + sendle_au_express_monthly;


                } else if (oldDate2 != null &&
                    oldDate2 != dateUsed) {

                    debt_set.push({
                        dateUsed: oldDate2,
                        express_speed: express_speed_monthly,
                        sendle_au_express: sendle_au_express_monthly,
                        standard_speed: standard_speed_monthly,
                        total_usage: total_usage_monthly
                    });

                    express_speed_monthly = 0;
                    standard_speed_monthly = 0;
                    sendle_au_express_monthly = 0;
                    total_usage_monthly = 0;

                    if (integrationText == '- None -') {
                        express_speed_monthly = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_monthly = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_monthly = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly = mpexUsage;
                        }
                    }

                    total_usage_monthly = express_speed_monthly + standard_speed_monthly + sendle_au_express_monthly;


                }

                count2++;
                oldDate2 = dateUsed;
                oldIntegration2 = integration;
                return true;
            });

            if (count2 > 0) {
                debt_set.push({
                    dateUsed: oldDate2,
                    express_speed: express_speed_monthly,
                    sendle_au_express: sendle_au_express_monthly,
                    standard_speed: standard_speed_monthly,
                    total_usage: total_usage_monthly
                });

            }

            console.log('debt_set: ' + debt_set)

            // All MP Products - Total Customer Usage
            var mpProdsScansPerCustomerSearch = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch_prod_stock_usage_report___4'
            });

            var custID = currRec.getValue({
                fieldId: 'custpage_custid',
            });

            console.log('custID ' + custID);

            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpProdsScansPerCustomerSearch.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpProdsScansPerCustomerSearch.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpProdsScansPerCustomerSearch.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpProdsScansPerCustomerSearch.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            if (!isNullorEmpty(barcodeSource)) {
                mpProdsScansPerCustomerSearch.filters.push(search.createFilter({
                    name: 'custrecord_barcode_source',
                    join: null,
                    operator: search.Operator.IS,
                    values: barcodeSource
                }));
            }

            var count3 = 0;
            var oldCustomerId = null;
            var oldCustomerName = null;
            var oldFranchiseeName = null;
            var oldIntegrationText = null;

            mpProdsScansPerCustomerSearch.run().each(function (mpProdsScansPerCustomerSearchSet) {

                var customerId = mpProdsScansPerCustomerSearchSet.getValue({
                    name: "custrecord_cust_prod_stock_customer",
                    summary: "GROUP",
                });

                var customerName = mpProdsScansPerCustomerSearchSet.getText({
                    name: "custrecord_cust_prod_stock_customer",
                    summary: "GROUP",
                });

                var franchiseeName = mpProdsScansPerCustomerSearchSet.getText({
                    name: "partner",
                    join: "CUSTRECORD_CUST_PROD_STOCK_CUSTOMER",
                    summary: "GROUP",
                });


                var deliverySpeed = mpProdsScansPerCustomerSearchSet.getValue({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });
                var deliverySpeedText = mpProdsScansPerCustomerSearchSet.getText({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });

                var integration = mpProdsScansPerCustomerSearchSet.getValue({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });
                var integrationText = mpProdsScansPerCustomerSearchSet.getText({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });


                var mpexUsage = parseInt(mpProdsScansPerCustomerSearchSet.getValue({
                    name: 'name',
                    summary: 'COUNT'
                }));

                if (count3 == 0) {

                    if (integrationText == '- None -') {
                        express_speed_cust_usage = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_cust_usage = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_cust_usage = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_cust_usage = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_cust_usage = mpexUsage;
                        }
                    }


                    total_usage_cust_usage = express_speed_cust_usage + standard_speed_cust_usage + sendle_au_express_cust_usage;

                } else if (oldCustomerName != null &&
                    oldCustomerName == customerName) {

                    if (integrationText == '- None -') {
                        express_speed_cust_usage += mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_cust_usage += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_cust_usage += mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_cust_usage += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_cust_usage += mpexUsage;
                        }
                    }

                    total_usage_cust_usage = express_speed_cust_usage + standard_speed_cust_usage + sendle_au_express_cust_usage;


                } else if (oldCustomerName != null &&
                    oldCustomerName != customerName) {

                    debt_set2.push({
                        customerId: oldCustomerId,
                        customerName: oldCustomerName,
                        franchiseeName: oldFranchiseeName,
                        express_speed: express_speed_cust_usage,
                        sendle_au_express: sendle_au_express_cust_usage,
                        standard_speed: standard_speed_cust_usage,
                        total_usage: total_usage_cust_usage
                    });

                    express_speed_cust_usage = 0;
                    standard_speed_cust_usage = 0;
                    sendle_au_express_cust_usage = 0;
                    total_usage_cust_usage = 0;

                    if (integrationText == '- None -') {
                        express_speed_cust_usage = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_cust_usage = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_cust_usage = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_cust_usage = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_cust_usage = mpexUsage;
                        }
                    }

                    total_usage_cust_usage = express_speed_cust_usage + standard_speed_cust_usage + sendle_au_express_cust_usage;


                }

                count3++;
                oldCustomerName = customerName;
                oldCustomerId = customerId;
                oldFranchiseeName = franchiseeName;
                return true;
            });

            if (count3 > 0) {
                debt_set2.push({
                    customerId: oldCustomerId,
                    customerName: oldCustomerName,
                    franchiseeName: oldFranchiseeName,
                    express_speed: express_speed_cust_usage,
                    sendle_au_express: sendle_au_express_cust_usage,
                    standard_speed: standard_speed_cust_usage,
                    total_usage: total_usage_cust_usage
                });

            }

            console.log('debt_set2: ' + debt_set2)


            // All MP Products - Total Zees Usage
            var mpProdsScansPerZeeSearch = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch_prod_stock_usage_report___5'
            });

            var custID = currRec.getValue({
                fieldId: 'custpage_custid',
            });

            console.log('custID ' + custID);

            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpProdsScansPerZeeSearch.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpProdsScansPerZeeSearch.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpProdsScansPerZeeSearch.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpProdsScansPerZeeSearch.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            if (!isNullorEmpty(barcodeSource)) {
                mpProdsScansPerZeeSearch.filters.push(search.createFilter({
                    name: 'custrecord_barcode_source',
                    join: null,
                    operator: search.Operator.IS,
                    values: barcodeSource
                }));
            }

            var count4 = 0;
            var oldFranchiseeName = null;

            mpProdsScansPerZeeSearch.run().each(function (mpProdsScansPerZeeSearchSet) {


                var franchiseeName = mpProdsScansPerZeeSearchSet.getText({
                    name: "partner",
                    join: "CUSTRECORD_CUST_PROD_STOCK_CUSTOMER",
                    summary: "GROUP",
                });


                var deliverySpeed = mpProdsScansPerZeeSearchSet.getValue({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });
                var deliverySpeedText = mpProdsScansPerZeeSearchSet.getText({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });

                var integration = mpProdsScansPerZeeSearchSet.getValue({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });
                var integrationText = mpProdsScansPerZeeSearchSet.getText({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });


                var mpexUsage = parseInt(mpProdsScansPerZeeSearchSet.getValue({
                    name: 'name',
                    summary: 'COUNT'
                }));

                if (count4 == 0) {

                    if (integrationText == '- None -') {
                        express_speed_zee_usage = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_zee_usage = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_zee_usage = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_zee_usage = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_zee_usage = mpexUsage;
                        }
                    }


                    total_usage_zee_usage = express_speed_zee_usage + standard_speed_zee_usage + sendle_au_express_zee_usage;

                } else if (oldFranchiseeName != null &&
                    oldFranchiseeName == franchiseeName) {

                    if (integrationText == '- None -') {
                        express_speed_zee_usage += mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_zee_usage += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_zee_usage += mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_zee_usage += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_zee_usage += mpexUsage;
                        }
                    }

                    total_usage_zee_usage = express_speed_zee_usage + standard_speed_zee_usage + sendle_au_express_zee_usage;


                } else if (oldFranchiseeName != null &&
                    oldFranchiseeName != franchiseeName) {

                    debt_set3.push({
                        franchiseeName: oldFranchiseeName,
                        express_speed: express_speed_zee_usage,
                        sendle_au_express: sendle_au_express_zee_usage,
                        standard_speed: standard_speed_zee_usage,
                        total_usage: total_usage_zee_usage
                    });

                    express_speed_zee_usage = 0;
                    standard_speed_zee_usage = 0;
                    sendle_au_express_zee_usage = 0;
                    total_usage_zee_usage = 0;

                    if (integrationText == '- None -') {
                        express_speed_zee_usage = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_zee_usage = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_zee_usage = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            // sendle_au_express_zee_usage = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_zee_usage = mpexUsage;
                        }
                    }

                    total_usage_zee_usage = express_speed_zee_usage + standard_speed_zee_usage + sendle_au_express_zee_usage;


                }

                count4++;
                oldFranchiseeName = franchiseeName;
                return true;
            });

            if (count4 > 0) {
                debt_set3.push({
                    franchiseeName: oldFranchiseeName,
                    express_speed: express_speed_zee_usage,
                    sendle_au_express: sendle_au_express_zee_usage,
                    standard_speed: standard_speed_zee_usage,
                    total_usage: total_usage_zee_usage
                });

            }

            console.log('debt_set3: ' + debt_set3)

            if (freq == 'weekly') {
                // All MP Products - Source/Weekly
                var mpProdScansSourceUsageResults = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch_prod_stock_usage_report___6'
                });

            } else if (freq == 'daily') {
                // All MP Products - Source/Daily
                var mpProdScansSourceUsageResults = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch_prod_stock_usage_report___7'
                });

            } else {
                // All MP Products - Source/Month
                var mpProdScansSourceUsageResults = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch_prod_stock_usage_report__13'
                });

            }


            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpProdScansSourceUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpProdScansSourceUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpProdScansSourceUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpProdScansSourceUsageResults.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            if (!isNullorEmpty(barcodeSource)) {
                mpProdScansSourceUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_barcode_source',
                    join: null,
                    operator: search.Operator.IS,
                    values: barcodeSource
                }));
            }

            var old_date = null;
            var count4 = 0;

            mpProdScansSourceUsageResults
                .run()
                .each(
                    function (mpProdScansSourceUsageResultsSet) {

                        var dateUsed = mpProdScansSourceUsageResultsSet
                            .getValue({
                                name: 'custrecord_cust_date_stock_used',
                                summary: 'GROUP'
                            });

                        var sourceId = parseInt(mpProdScansSourceUsageResultsSet
                            .getValue({
                                name: 'custrecord_barcode_source',
                                summary: 'GROUP'
                            }));

                        var sourceText = mpProdScansSourceUsageResultsSet
                            .getText({
                                name: 'custrecord_barcode_source',
                                summary: 'GROUP'
                            });

                        var mpexUsage = parseInt(mpProdScansSourceUsageResultsSet
                            .getValue({
                                name: 'name',
                                summary: 'COUNT'
                            }));

                        // 1 - Manual
                        // 2 - Shopify
                        // 3 - Customer Portal
                        // 4 - Bulk

                        if (old_date == null) {
                            if (sourceId == 1 ||
                                sourceText == '- None -') {
                                source_manual = mpexUsage;
                            } else if (sourceId == 2) {
                                source_shopify = mpexUsage;
                            } else if (sourceId == 3) {
                                source_portal = mpexUsage;
                            } else if (sourceId == 4) {
                                source_bulk = mpexUsage;
                            }

                            total_source_usage = source_manual +
                                source_shopify +
                                source_portal + source_bulk;

                        } else if (old_date != null &&
                            old_date == dateUsed) {
                            if (sourceId == 1 ||
                                sourceText == '- None -') {
                                source_manual += mpexUsage;
                            } else if (sourceId == 2) {
                                source_shopify += mpexUsage;
                            } else if (sourceId == 3) {
                                source_portal += mpexUsage;
                            } else if (sourceId == 4) {
                                source_bulk += mpexUsage;
                            }
                            total_source_usage = source_manual +
                                source_shopify +
                                source_portal + source_bulk;
                        } else if (old_date != null &&
                            old_date != dateUsed) {
                            debt_set4.push({
                                dateUsed: old_date,
                                source_manual: source_manual,
                                source_shopify: source_shopify,
                                source_portal: source_portal,
                                source_bulk: source_bulk,
                                total_usage: total_source_usage
                            });

                            source_manual = 0;
                            source_shopify = 0;
                            source_portal = 0;
                            source_bulk = 0;
                            total_source_usage = 0;

                            if (sourceId == 1 ||
                                sourceText == '- None -') {
                                source_manual += mpexUsage;
                            } else if (sourceId == 2) {
                                source_shopify += mpexUsage;
                            } else if (sourceId == 3) {
                                source_portal += mpexUsage;
                            } else if (sourceId == 4) {
                                source_bulk += mpexUsage;
                            }
                            total_source_usage = source_manual +
                                source_shopify +
                                source_portal + source_bulk;
                        }

                        old_date = dateUsed;
                        count4++;
                        return true;
                    });

            if (count4 > 0) {
                debt_set4.push({
                    dateUsed: old_date,
                    source_manual: source_manual,
                    source_shopify: source_shopify,
                    source_portal: source_portal,
                    source_bulk: source_bulk,
                    total_usage: total_source_usage
                });
            }

            console.log('debt_set4: ' + debt_set4);


            if (freq == 'weekly') {
                console.log('All MP Products - Prod Weights/Weekly')
                // All MP Products - Prod Weights/Weekly
                var mpProdScansWeights = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch_prod_stock_usage_report___9'
                });

            } else if (freq == 'daily') {
                console.log('All MP Products - Prod Weights/Daily')
                // All MP Products - Prod Weights/Daily
                var mpProdScansWeights = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch_prod_stock_usage_report__14'
                });

            } else {
                console.log('All MP Products - Prod Weights/Monthly')
                // All MP Products - Prod Weights/Monthly
                var mpProdScansWeights = search.load({
                    type: 'customrecord_customer_product_stock',
                    id: 'customsearch_prod_stock_usage_report___8'
                });

            }

            var custID = currRec.getValue({
                fieldId: 'custpage_custid',
            });

            console.log('custID ' + custID);



            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpProdScansWeights.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpProdScansWeights.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpProdScansWeights.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpProdScansWeights.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            if (!isNullorEmpty(barcodeSource)) {
                mpProdScansWeights.filters.push(search.createFilter({
                    name: 'custrecord_barcode_source',
                    join: null,
                    operator: search.Operator.IS,
                    values: barcodeSource
                }));
            }

            var old_date = null;
            var oldIntegration3 = null;
            var count5 = 0;

            mpProdScansWeights
                .run()
                .each(
                    function (mpProdScansWeightsSet) {

                        var dateUsed = mpProdScansWeightsSet
                            .getValue({
                                name: 'custrecord_cust_date_stock_used',
                                summary: 'GROUP'
                            });

                        var sourceId = parseInt(mpProdScansWeightsSet
                            .getValue({
                                name: 'custrecord_barcode_source',
                                summary: 'GROUP'
                            }));

                        var sourceText = mpProdScansWeightsSet
                            .getText({
                                name: 'custrecord_barcode_source',
                                summary: 'GROUP'
                            });

                        var mpexUsage = parseInt(mpProdScansWeightsSet
                            .getValue({
                                name: 'name',
                                summary: 'COUNT'
                            }));

                        var deliverySpeed = mpProdScansWeightsSet.getValue({
                            name: 'custrecord_delivery_speed',
                            summary: 'GROUP'
                        });
                        var deliverySpeedText = mpProdScansWeightsSet.getText({
                            name: 'custrecord_delivery_speed',
                            summary: 'GROUP'
                        });

                        var integration = mpProdScansWeightsSet.getValue({
                            name: 'custrecord_integration',
                            summary: 'GROUP'
                        });
                        var integrationText = mpProdScansWeightsSet.getText({
                            name: 'custrecord_integration',
                            summary: 'GROUP'
                        });

                        var prodWeight = mpProdScansWeightsSet.getValue({
                            name: "custrecord_ap_item_prod_weight",
                            join: "CUSTRECORD_CUST_STOCK_PROD_NAME",
                            summary: "GROUP"
                        })
                        /*	
                            5kg	        1
                            3kg	        2
                            1kg	        3
                            500g	    4
                            B4	        5
                            C5	        6
                            DL	        7
                            10kg	    8
                            25kg	    9
                            250g	    10
                            20kg	    11
                        */

                        if (old_date == null) {

                            if (integrationText == '- None -') {
                                if (deliverySpeed == 2 ||
                                    deliverySpeedText == '- None -') {
                                    if (prodWeight == 1) {
                                        exp_5kg = mpexUsage;
                                    } else if (prodWeight == 2) {
                                        exp_3kg = mpexUsage
                                    } else if (prodWeight == 3) {
                                        exp_1kg = mpexUsage
                                    } else if (prodWeight == 4) {
                                        exp_500g = mpexUsage
                                    } else if (prodWeight == 5) {
                                        exp_b4 = mpexUsage
                                    } else if (prodWeight == 6) {
                                        exp_c5 = mpexUsage
                                    } else if (prodWeight == 7) {
                                        exp_dl = mpexUsage
                                    }
                                }

                            } else if (integrationText == 'Sendle') {
                                if (deliverySpeed == 1) {
                                    if (prodWeight == 1) {
                                        std_5kg = mpexUsage;
                                    } else if (prodWeight == 2) {
                                        std_3kg = mpexUsage
                                    } else if (prodWeight == 3) {
                                        std_1kg = mpexUsage
                                    } else if (prodWeight == 4) {
                                        std_500g = mpexUsage
                                    } else if (prodWeight == 8) {
                                        std_10kg = mpexUsage
                                    } else if (prodWeight == 9) {
                                        std_25kg = mpexUsage
                                    } else if (prodWeight == 10) {
                                        std_250g = mpexUsage
                                    } else if (prodWeight == 11) {
                                        std_20kg = mpexUsage
                                    }
                                }
                            } else if (integrationText == 'API Integration') {
                                if (deliverySpeed == 2 ||
                                    deliverySpeedText == '- None -') {
                                    if (prodWeight == 1) {
                                        exp_5kg = mpexUsage;
                                    } else if (prodWeight == 2) {
                                        exp_3kg = mpexUsage
                                    } else if (prodWeight == 3) {
                                        exp_1kg = mpexUsage
                                    } else if (prodWeight == 4) {
                                        exp_500g = mpexUsage
                                    } else if (prodWeight == 5) {
                                        exp_b4 = mpexUsage
                                    } else if (prodWeight == 6) {
                                        exp_c5 = mpexUsage
                                    } else if (prodWeight == 7) {
                                        exp_dl = mpexUsage
                                    }
                                }
                            }
                            total_weight_usage = exp_dl + exp_c5 + exp_b4 + exp_500g + exp_1kg + exp_3kg + exp_5kg + std_250g + std_500g + std_1kg + std_3kg + std_5kg + std_10kg + std_20kg + std_25kg;

                        } else if (old_date != null &&
                            old_date == dateUsed) {
                            if (integrationText == '- None -') {
                                if (deliverySpeed == 2 ||
                                    deliverySpeedText == '- None -') {
                                    if (prodWeight == 1) {
                                        exp_5kg += mpexUsage;
                                    } else if (prodWeight == 2) {
                                        exp_3kg += mpexUsage
                                    } else if (prodWeight == 3) {
                                        exp_1kg += mpexUsage
                                    } else if (prodWeight == 4) {
                                        exp_500g += mpexUsage
                                    } else if (prodWeight == 5) {
                                        exp_b4 += mpexUsage
                                    } else if (prodWeight == 6) {
                                        exp_c5 += mpexUsage
                                    } else if (prodWeight == 7) {
                                        exp_dl += mpexUsage
                                    }
                                }

                            } else if (integrationText == 'Sendle') {
                                if (deliverySpeed == 1) {
                                    if (prodWeight == 1) {
                                        std_5kg += mpexUsage;
                                    } else if (prodWeight == 2) {
                                        std_3kg += mpexUsage
                                    } else if (prodWeight == 3) {
                                        std_1kg += mpexUsage
                                    } else if (prodWeight == 4) {
                                        std_500g += mpexUsage
                                    } else if (prodWeight == 8) {
                                        std_10kg += mpexUsage
                                    } else if (prodWeight == 9) {
                                        std_25kg += mpexUsage
                                    } else if (prodWeight == 10) {
                                        std_250g += mpexUsage
                                    } else if (prodWeight == 11) {
                                        std_20kg += mpexUsage
                                    }
                                }
                            } else if (integrationText == 'API Integration') {
                                if (deliverySpeed == 2 ||
                                    deliverySpeedText == '- None -') {
                                    if (prodWeight == 1) {
                                        exp_5kg += mpexUsage;
                                    } else if (prodWeight == 2) {
                                        exp_3kg += mpexUsage
                                    } else if (prodWeight == 3) {
                                        exp_1kg += mpexUsage
                                    } else if (prodWeight == 4) {
                                        exp_500g += mpexUsage
                                    } else if (prodWeight == 5) {
                                        exp_b4 += mpexUsage
                                    } else if (prodWeight == 6) {
                                        exp_c5 += mpexUsage
                                    } else if (prodWeight == 7) {
                                        exp_dl += mpexUsage
                                    }
                                }
                            }
                            total_weight_usage = exp_dl + exp_c5 + exp_b4 + exp_500g + exp_1kg + exp_3kg + exp_5kg + std_250g + std_500g + std_1kg + std_3kg + std_5kg + std_10kg + std_20kg + std_25kg;
                        } else if (old_date != null &&
                            old_date != dateUsed) {
                            debt_set5.push({
                                dateUsed: old_date,
                                exp_dl: exp_dl,
                                exp_c5: exp_c5,
                                exp_b4: exp_b4,
                                exp_500g: exp_500g,
                                exp_1kg: exp_1kg,
                                exp_3kg: exp_3kg,
                                exp_5kg: exp_5kg,
                                std_250g: std_250g,
                                std_500g: std_500g,
                                std_1kg: std_1kg,
                                std_3kg: std_3kg,
                                std_5kg: std_5kg,
                                std_10kg: std_10kg,
                                std_20kg: std_20kg,
                                std_25kg: std_25kg,
                                total_weight_usage: total_weight_usage
                            });

                            exp_dl = 0;
                            exp_c5 = 0;
                            exp_b4 = 0;
                            exp_500g = 0;
                            exp_1kg = 0;
                            exp_3kg = 0;
                            exp_5kg = 0;
                            std_250g = 0;
                            std_500g = 0;
                            std_1kg = 0;
                            std_3kg = 0;
                            std_5kg = 0;
                            std_10kg = 0;
                            std_20kg = 0;
                            std_25kg = 0;
                            total_weight_usage = 0;


                            if (integrationText == '- None -') {
                                if (deliverySpeed == 2 ||
                                    deliverySpeedText == '- None -') {
                                    if (prodWeight == 1) {
                                        exp_5kg = mpexUsage;
                                    } else if (prodWeight == 2) {
                                        exp_3kg = mpexUsage
                                    } else if (prodWeight == 3) {
                                        exp_1kg = mpexUsage
                                    } else if (prodWeight == 4) {
                                        exp_500g = mpexUsage
                                    } else if (prodWeight == 5) {
                                        exp_b4 = mpexUsage
                                    } else if (prodWeight == 6) {
                                        exp_c5 = mpexUsage
                                    } else if (prodWeight == 7) {
                                        exp_dl = mpexUsage
                                    }
                                }

                            } else if (integrationText == 'Sendle') {
                                if (deliverySpeed == 1) {
                                    if (prodWeight == 1) {
                                        std_5kg = mpexUsage;
                                    } else if (prodWeight == 2) {
                                        std_3kg = mpexUsage
                                    } else if (prodWeight == 3) {
                                        std_1kg = mpexUsage
                                    } else if (prodWeight == 4) {
                                        std_500g = mpexUsage
                                    } else if (prodWeight == 8) {
                                        std_10kg = mpexUsage
                                    } else if (prodWeight == 9) {
                                        std_25kg = mpexUsage
                                    } else if (prodWeight == 10) {
                                        std_250g = mpexUsage
                                    } else if (prodWeight == 11) {
                                        std_20kg = mpexUsage
                                    }
                                }
                            } else if (integrationText == 'API Integration') {
                                if (deliverySpeed == 2 ||
                                    deliverySpeedText == '- None -') {
                                    if (prodWeight == 1) {
                                        exp_5kg = mpexUsage;
                                    } else if (prodWeight == 2) {
                                        exp_3kg = mpexUsage
                                    } else if (prodWeight == 3) {
                                        exp_1kg = mpexUsage
                                    } else if (prodWeight == 4) {
                                        exp_500g = mpexUsage
                                    } else if (prodWeight == 5) {
                                        exp_b4 = mpexUsage
                                    } else if (prodWeight == 6) {
                                        exp_c5 = mpexUsage
                                    } else if (prodWeight == 7) {
                                        exp_dl = mpexUsage
                                    }
                                }
                            }
                            total_weight_usage = exp_dl + exp_c5 + exp_b4 + exp_500g + exp_1kg + exp_3kg + exp_5kg + std_250g + std_500g + std_1kg + std_3kg + std_5kg + std_10kg + std_20kg + std_25kg;
                        }

                        old_date = dateUsed;
                        count5++;
                        return true;
                    });

            if (count5 > 0) {
                debt_set5.push({
                    dateUsed: old_date,
                    exp_dl: exp_dl,
                    exp_c5: exp_c5,
                    exp_b4: exp_b4,
                    exp_500g: exp_500g,
                    exp_1kg: exp_1kg,
                    exp_3kg: exp_3kg,
                    exp_5kg: exp_5kg,
                    std_250g: std_250g,
                    std_500g: std_500g,
                    std_1kg: std_1kg,
                    std_3kg: std_3kg,
                    std_5kg: std_5kg,
                    std_10kg: std_10kg,
                    std_20kg: std_20kg,
                    std_25kg: std_25kg,
                    total_weight_usage: total_weight_usage
                });
            }

            console.log('debt_set(Monthly Overview): ' + debt_set)
            console.log('debt_set2(Customer List): ' + debt_set2)
            console.log('debt_set3(Zee List): ' + debt_set3)
            console.log('debt_set4(Source List): ' + debt_set4)
            console.log('debt_set5(Product Weights): ' + debt_set5)
            loadDatatable(debt_set, debt_set2, debt_set3, debt_set4, debt_set5);
            debt_set = [];

        }

        function formatDateYYYYMMDD(date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;

            return [year, month, day].join('-')
        }



        function loadDatatable(debt_rows, debt_rows2, debt_rows3, debt_rows4, debt_rows5) {
            // $('#result_debt').empty();
            debtDataSet = [];
            csvSet = [];

            debtDataSet2 = [];
            csvSet2 = [];

            debtDataSet3 = [];
            csvSet3 = [];

            debtDataSet4 = [];
            csvSet4 = [];

            debtDataSet5 = [];
            csvSet5 = [];

            var custID = currRec.getValue({
                fieldId: 'custpage_custid',
            });

            if (isNullorEmpty(custID)) {
                custID = '';
            }

            if (!isNullorEmpty(debt_rows)) {
                debt_rows.forEach(function (debt_row, index) {

                    var month = debt_row.dateUsed;

                    var val1 = currentRecord.get();
                    var freq = val1.getValue({
                        fieldId: 'custpage_freq',
                    });

                    console.log('freq: ' + freq)

                    if (freq == 'weekly') {
                        var splitMonth = month.split('/');
                        console.log('inside weekly loading debt_rows');
                        console.log('splitMonth: ' + splitMonth);

                        var startofWeekDate = new Date(splitMonth[2], splitMonth[1] - 1, splitMonth[0]);
                        var startofWeekDateFromatted = formatDateYYYYMMDD(startofWeekDate);
                        var endofWeekdate = new Date(startofWeekDate.setDate(startofWeekDate.getDate() - startofWeekDate.getDay() + 6));

                        console.log('startofWeekDateFromatted: ' + startofWeekDateFromatted);
                        console.log('endofWeekdate: ' + endofWeekdate);



                        var endofWeekdateFromatted = formatDateYYYYMMDD(endofWeekdate);
                        console.log('endofWeekdateFromatted: ' + endofWeekdateFromatted);




                        var firstDay = new Date(splitMonth[2], (splitMonth[1] - 1), 1);
                        var lastDay = new Date(splitMonth[2], (splitMonth[1]), 0);

                        firstDay = formatDateYYYYMMDD(firstDay);
                        lastDay = formatDateYYYYMMDD(lastDay);

                        // if (firstDay < 10) {
                        //     firstDay = '0' + firstDay;
                        // }


                        // var startDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                        //     splitMonth[0];

                        // var lastDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                        //     lastDay
                        var viewLinks =
                            '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&zee=' +
                            zee + '&start_date=' + firstDay + '&last_date=' + lastDay + '&freq=&custid=' + custID + '" target=_blank>MONTHLY</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&zee=' +
                            zee + '&start_date=' + startofWeekDateFromatted + '&last_date=' + endofWeekdateFromatted + '&freq=daily&custid=' + custID + '" target=_blank>DAILY</a>';



                        debtDataSet.push([viewLinks, startofWeekDateFromatted,
                            debt_row.express_speed,
                            debt_row.standard_speed, debt_row.total_usage
                        ]);
                        // debtDataSet.push([viewLinks, startofWeekDateFromatted,
                        //     debt_row.express_speed, debt_row.sendle_au_express,
                        //     debt_row.standard_speed, debt_row.total_usage
                        // ]);

                        csvSet.push([startofWeekDateFromatted, debt_row.express_speed, debt_row.sendle_au_express,
                            debt_row.standard_speed, debt_row.total_usage
                        ]);
                    } else if (freq == 'daily') {
                        var splitMonth = month.split('/');


                        var firstDay = new Date(splitMonth[2], (splitMonth[1] - 1), 1);
                        var lastDay = new Date(splitMonth[2], (splitMonth[1]), 0);

                        // if (firstDay < 10) {
                        //     firstDay = '0' + firstDay;
                        // }


                        var startDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                            splitMonth[0];

                        // var lastDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                        //     lastDay

                        firstDay = formatDateYYYYMMDD(firstDay);
                        lastDay = formatDateYYYYMMDD(lastDay);

                        var viewLinks =
                            '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&zee=' +
                            zee + '&start_date=' + firstDay + '&last_date=' + lastDay + '&freq=&custid=' + custID + '" target=_blank>MONTHLY</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&zee=' +
                            zee + '&start_date=' + firstDay + '&last_date=' + lastDay + '&freq=weekly&custid=' + custID + '" target=_blank>WEEKLY</a>';



                        debtDataSet.push([viewLinks, startDate,
                            debt_row.express_speed,
                            debt_row.standard_speed, debt_row.total_usage
                        ]);
                        // debtDataSet.push([viewLinks, startDate,
                        //     debt_row.express_speed, debt_row.sendle_au_express,
                        //     debt_row.standard_speed, debt_row.total_usage
                        // ]);

                        csvSet.push([startDate, debt_row.express_speed, debt_row.sendle_au_express,
                            debt_row.standard_speed, debt_row.total_usage
                        ]);
                    } else {
                        var splitMonth = month.split('-');


                        var firstDay = new Date(splitMonth[0], (splitMonth[1] - 1), 1);
                        var lastDay = new Date(splitMonth[0], (splitMonth[1]), 0);

                        console.log(firstDay)
                        console.log(lastDay)

                        // if (firstDay < 10) {
                        //     firstDay = '0' + firstDay;
                        // }


                        // var monthsStartDate = splitMonth[0] + '-' + splitMonth[1] + '-' +
                        //     firstDay;
                        // var lastDate = splitMonth[0] + '-' + splitMonth[1] + '-' +
                        //     lastDay

                        firstDay = formatDateYYYYMMDD(firstDay);
                        lastDay = formatDateYYYYMMDD(lastDay);

                        console.log(firstDay)
                        console.log(lastDay)

                        var viewLinks =
                            '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&zee=' +
                            zee + '&start_date=' + firstDay + '&last_date=' + lastDay + '&freq=weekly&custid=' + custID + '" target=_blank>WEEKLY</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&zee=' +
                            zee + '&start_date=' + firstDay + '&last_date=' + lastDay + '&freq=daily&custid=' + custID + '" target=_blank>DAILY</a>';



                        debtDataSet.push([viewLinks, month,
                            debt_row.express_speed,
                            debt_row.standard_speed, debt_row.total_usage
                        ]);
                        // debtDataSet.push([viewLinks, month,
                        //     debt_row.express_speed, debt_row.sendle_au_express,
                        //     debt_row.standard_speed, debt_row.total_usage
                        // ]);

                        csvSet.push([month, debt_row.express_speed, debt_row.sendle_au_express,
                            debt_row.standard_speed, debt_row.total_usage
                        ]);
                    }



                });
            }
            console.log(debtDataSet)
            var datatable = $('#mpexusage-monthly_scans').DataTable();
            datatable.clear();
            datatable.rows.add(debtDataSet);
            datatable.draw();

            // saveCsvWeekly(csvSet);
            saveCSVOverview(csvSet);

            var data = datatable.rows().data();


            var month_year = []; // creating array for storing browser
            // type in array.
            var expSpeed = []; // creating array for storing browser
            // type in array.
            var sendleAUExpressSpeed = [];
            var stdSpeed = []; // creating array for storing browser
            // type in array
            var totalUsage = []; // creating array for storing browser
            // type in array.

            for (var i = 0; i < data.length; i++) {
                month_year.push(data[i][1]);
                expSpeed[data[i][1]] = data[i][2];
                // sendleAUExpressSpeed[data[i][1]] = data[i][3]
                stdSpeed[data[i][1]] = data[i][3]; // creating
                totalUsage[data[i][1]] = data[i][4]; //

            }
            var count = {}; // creating object for getting categories with
            // count
            month_year.forEach(function (i) {
                count[i] = (count[i] || 0) + 1;
            });

            var series_data6 = []; // creating empty array for highcharts
            // series data
            var series_data7 = []; // creating empty array for highcharts
            // series data
            var series_data8 = [];
            var series_data10 = []; // creating empty array for highcharts
            // series data
            var categores4 = []; // creating empty array for highcharts
            // categories
            Object.keys(expSpeed).map(function (item, key) {
                series_data6.push(parseInt(expSpeed[item]));
                series_data8.push(parseInt(sendleAUExpressSpeed[item]));
                series_data7.push(parseInt(stdSpeed[item]));
                series_data10.push(parseInt(totalUsage[item]));
                categores4.push(item)
            });
            plotChartSpeedUsage(series_data6, series_data7, series_data10, categores4, series_data8, 'container_monthly');




            if (!isNullorEmpty(debt_rows2)) {
                debt_rows2.forEach(function (debt_row, index) {

                    var month = debt_row.dateUsed;
                    // // console.log(month);
                    // var splitMonth = month.split('-');
                    // var splitMonthV2 = month.split('/');

                    // // console.log('month ' + month)
                    // // console.log('splitMonth ' + splitMonth);
                    // // console.log('splitMonthV2 ' + splitMonthV2);

                    // var formattedDate = dateISOToNetsuite(splitMonthV2[2] + '-' + splitMonthV2[1] + '-' + splitMonthV2[0]);

                    // // console.log('formattedDate ' + formattedDate);

                    // var parsedDate = format.parse({
                    //     value: month,
                    //     type: format.Type.DATE
                    // });

                    // var firstDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 1).getDate();
                    // var lastDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 0).getDate();

                    // if (firstDay < 10) {
                    //     firstDay = '0' + firstDay;
                    // }

                    // // var startDate = firstDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    // var startDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                    //     splitMonthV2[0];
                    // var monthsStartDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                    //     firstDay;
                    // // var lastDate = lastDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    // var lastDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                    //     lastDay

                    // console.log('startDate ' + startDate);
                    // console.log('lastDate ' + lastDate);

                    var viewLinks =
                        '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&custid=' +
                        debt_row.customerId +
                        '" target=_blank>USAGE</a>';



                    debtDataSet2.push([viewLinks, debt_row.customerName, debt_row.franchiseeName,
                        debt_row.express_speed,
                        debt_row.standard_speed, debt_row.total_usage
                    ]);
                    // debtDataSet2.push([viewLinks, debt_row.customerName, debt_row.franchiseeName,
                    //     debt_row.express_speed, debt_row.sendle_au_express,
                    //     debt_row.standard_speed, debt_row.total_usage
                    // ]);

                    csvSet2.push([debt_row.customerName, debt_row.franchiseeName, debt_row.express_speed, debt_row.sendle_au_express,
                    debt_row.standard_speed, debt_row.total_usage
                    ]);

                });
            }
            console.log(debtDataSet2)
            var datatable2 = $('#mpexusage-customer_list').DataTable();
            datatable2.clear();
            datatable2.rows.add(debtDataSet2);
            datatable2.draw();

            // saveCsvMonthly(csvSet2);
            saveCSVCustomerList(csvSet2);

            var data2 = datatable2.rows().data();


            var month_year_cust_list = []; // creating array for storing browser
            // type in array.
            var expSpeed_cust_list = []; // creating array for storing browser
            // type in array.
            var sendleAUExpressSpeed_cust_list = [];
            var stdSpeed_cust_list = []; // creating array for storing browser
            // type in array
            var totalUsage_cust_list = []; // creating array for storing browser
            // type in array.

            if (role != 1000) {
                if (data2.length > 100) {
                    for (var i = 0; i < 100; i++) {
                        month_year_cust_list.push(data2[i][1]);
                        expSpeed_cust_list[data2[i][1]] = data2[i][3];
                        // sendleAUExpressSpeed_cust_list[data2[i][1]] = data2[i][4]
                        stdSpeed_cust_list[data2[i][1]] = data2[i][4]; // creating
                        totalUsage_cust_list[data2[i][1]] = data2[i][5]; //

                    }
                } else {
                    for (var i = 0; i < data2.length; i++) {
                        month_year_cust_list.push(data2[i][1]);
                        expSpeed_cust_list[data2[i][1]] = data2[i][3];
                        // sendleAUExpressSpeed_cust_list[data2[i][1]] = data2[i][4]
                        stdSpeed_cust_list[data2[i][1]] = data2[i][4]; // creating
                        totalUsage_cust_list[data2[i][1]] = data2[i][5]; //

                    }
                }

            } else {
                for (var i = 0; i < data2.length; i++) {
                    month_year_cust_list.push(data2[i][1]);
                    expSpeed_cust_list[data2[i][1]] = data2[i][3];
                    // sendleAUExpressSpeed_cust_list[data2[i][1]] = data2[i][4]
                    stdSpeed_cust_list[data2[i][1]] = data2[i][4]; // creating
                    totalUsage_cust_list[data2[i][1]] = data2[i][5]; //

                }
            }

            var count2 = {}; // creating object for getting categories with
            // count
            month_year_cust_list.forEach(function (i) {
                count2[i] = (count2[i] || 0) + 1;
            });

            var series_data20 = []; // creating empty array for highcharts
            // series data
            var series_data21 = []; // creating empty array for highcharts
            // series data
            var series_data22 = [];
            var series_data23 = []; // creating empty array for highcharts
            // series data
            var categores25 = []; // creating empty array for highcharts
            // categories
            Object.keys(expSpeed_cust_list).map(function (item, key) {
                series_data20.push(parseInt(expSpeed_cust_list[item]));
                series_data23.push(parseInt(sendleAUExpressSpeed_cust_list[item]));
                series_data21.push(parseInt(stdSpeed_cust_list[item]));
                series_data22.push(parseInt(totalUsage_cust_list[item]));
                categores25.push(item)
            });
            plotChartSpeedUsage(series_data20, series_data21, series_data22, categores25, series_data23, 'container_cust_list')




            if (role != 1000) {
                if (!isNullorEmpty(debt_rows3)) {
                    debt_rows3.forEach(function (debt_row, index) {

                        // var month = debt_row.dateUsed;
                        // // console.log(month);
                        // var splitMonth = month.split('-');
                        // var splitMonthV2 = month.split('/');

                        // // console.log('month ' + month)
                        // // console.log('splitMonth ' + splitMonth);
                        // // console.log('splitMonthV2 ' + splitMonthV2);

                        // var formattedDate = dateISOToNetsuite(splitMonthV2[2] + '-' + splitMonthV2[1] + '-' + splitMonthV2[0]);

                        // // console.log('formattedDate ' + formattedDate);

                        // var parsedDate = format.parse({
                        //     value: month,
                        //     type: format.Type.DATE
                        // });

                        // var firstDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 1).getDate();
                        // var lastDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 0).getDate();

                        // if (firstDay < 10) {
                        //     firstDay = '0' + firstDay;
                        // }

                        // // var startDate = firstDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                        // var startDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        //     splitMonthV2[0];
                        // var monthsStartDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        //     firstDay;
                        // // var lastDate = lastDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                        // var lastDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        //     lastDay

                        // console.log('startDate ' + startDate);
                        // console.log('lastDate ' + lastDate);

                        // var detailedInvoiceURLMonth =
                        //     '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1627&deploy=1&zee=' +
                        //     zee + '&start_date=' + monthsStartDate + '&last_date=' + lastDate +
                        //     '" target=_blank>VIEW (monthly)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                        //     zee + '&start_date=' + startDate + '&last_date=' + lastDate +
                        //     '" target=_blank>VIEW (daily)</a>';



                        debtDataSet3.push([debt_row.franchiseeName,
                        debt_row.express_speed,
                        debt_row.standard_speed, debt_row.total_usage
                        ]);
                        debtDataSet3.push([debt_row.franchiseeName,
                        debt_row.express_speed, debt_row.sendle_au_express,
                        debt_row.standard_speed, debt_row.total_usage
                        ]);

                        csvSet3.push([debt_row.franchiseeName, debt_row.express_speed, debt_row.sendle_au_express,
                        debt_row.standard_speed, debt_row.total_usage
                        ]);

                    });
                }
                console.log(debtDataSet3)
                var datatable3 = $('#mpexusage-zee_list').DataTable();
                datatable3.clear();
                datatable3.rows.add(debtDataSet3);
                datatable3.draw();

                // saveCsvDaily(csvSet3);
                if (role != 1000) {
                    saveCSVZeeList(csvSet3);
                }


                var data3 = datatable3.rows().data();


                var month_year_zee_list = []; // creating array for storing browser
                // type in array.
                var expSpeed_zee_list = []; // creating array for storing browser
                // type in array.
                var sendleAUExpressSpeed_zee_list = [];
                var stdSpeed_zee_list = []; // creating array for storing browser
                // type in array
                var totalUsage_zee_list = []; // creating array for storing browser
                // type in array.

                for (var i = 0; i < data3.length; i++) {
                    month_year_zee_list.push(data3[i][0]);
                    expSpeed_zee_list[data3[i][0]] = data3[i][1];
                    // sendleAUExpressSpeed_zee_list[data3[i][0]] = data3[i][2]
                    stdSpeed_zee_list[data3[i][0]] = data3[i][2]; // creating
                    totalUsage_zee_list[data3[i][0]] = data3[i][3]; //

                }
                var count3 = {}; // creating object for getting categories with
                // count
                month_year_zee_list.forEach(function (i) {
                    count3[i] = (count3[i] || 0) + 1;
                });

                var series_data30 = []; // creating empty array for highcharts
                // series data
                var series_data31 = []; // creating empty array for highcharts
                // series data
                var series_data32 = [];
                var series_data33 = []; // creating empty array for highcharts
                // series data
                var categores35 = []; // creating empty array for highcharts
                // categories
                Object.keys(expSpeed_zee_list).map(function (item, key) {
                    series_data30.push(parseInt(expSpeed_zee_list[item]));
                    series_data33.push(parseInt(sendleAUExpressSpeed_zee_list[item]));
                    series_data31.push(parseInt(stdSpeed_zee_list[item]));
                    series_data32.push(parseInt(totalUsage_zee_list[item]));
                    categores35.push(item)
                });
                plotChartSpeedUsage(series_data30, series_data31, series_data32, categores35, series_data33, 'container_zee_list');

            }

            if (!isNullorEmpty(debt_rows4)) {
                debt_rows4
                    .forEach(function (source_row, index) {


                        var month = source_row.dateUsed;

                        var val1 = currentRecord.get();
                        var freq = val1.getValue({
                            fieldId: 'custpage_freq',
                        });

                        if (freq == 'weekly') {
                            var splitMonth = month.split('/');
                            console.log('inside weekly loading debt_rows');
                            console.log('splitMonth: ' + splitMonth);

                            var startofWeekDate = new Date(splitMonth[2], splitMonth[1] - 1, splitMonth[0]);
                            var startofWeekDateFromatted = formatDateYYYYMMDD(startofWeekDate);
                            var endofWeekdate = new Date(startofWeekDate.setDate(startofWeekDate.getDate() - startofWeekDate.getDay() + 6));

                            var endofWeekdateFromatted = formatDateYYYYMMDD(endofWeekdate);


                            var firstDay = new Date(splitMonth[2], (splitMonth[1] - 1), 1);
                            var lastDay = new Date(splitMonth[2], (splitMonth[1]), 0);

                            // if (firstDay < 10) {
                            //     firstDay = '0' + firstDay;
                            // }


                            // var startDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                            //     splitMonth[0];

                            // var lastDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                            //     lastDay
                            firstDay = formatDateYYYYMMDD(firstDay);
                            lastDay = formatDateYYYYMMDD(lastDay);

                            debtDataSet4.push([
                                startofWeekDateFromatted, source_row.source_manual,
                                source_row.source_shopify,
                                source_row.source_portal,
                                source_row.source_bulk,
                                source_row.total_usage
                            ]);

                            csvSet4.push([startofWeekDateFromatted, source_row.source_manual,
                                source_row.source_shopify,
                                source_row.source_portal,
                                source_row.source_bulk,
                                source_row.total_usage
                            ]);
                        } else if (freq == 'daily') {
                            var splitMonth = month.split('/');

                            var firstDay = new Date(splitMonth[2], (splitMonth[1] - 1), 1);
                            var lastDay = new Date(splitMonth[2], (splitMonth[1]), 0);

                            // if (firstDay < 10) {
                            //     firstDay = '0' + firstDay;
                            // }


                            var startDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                                splitMonth[0];

                            // var lastDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                            //     lastDay

                            firstDay = formatDateYYYYMMDD(firstDay);
                            lastDay = formatDateYYYYMMDD(lastDay);

                            debtDataSet4.push([
                                startDate, source_row.source_manual,
                                source_row.source_shopify,
                                source_row.source_portal,
                                source_row.source_bulk,
                                source_row.total_usage
                            ]);

                            csvSet4.push([startDate, source_row.source_manual,
                                source_row.source_shopify,
                                source_row.source_portal,
                                source_row.source_bulk,
                                source_row.total_usage
                            ]);
                        } else {


                            debtDataSet4.push([
                                month, source_row.source_manual,
                                source_row.source_shopify,
                                source_row.source_portal,
                                source_row.source_bulk,
                                source_row.total_usage
                            ]);

                            csvSet4.push([month, source_row.source_manual,
                                source_row.source_shopify,
                                source_row.source_portal,
                                source_row.source_bulk,
                                source_row.total_usage
                            ]);
                        }


                        // csvSet.push([month, source_row.source_manual,
                        // source_row.source_shopify,
                        // source_row.source_portal,source_row.source_bulk,
                        // source_row.total_usage]);

                    });
            }
            console.log(debtDataSet4)
            var datatable4 = $('#mpexusage-source').DataTable();
            datatable4.clear();
            datatable4.rows.add(debtDataSet4);
            datatable4.draw();

            // saveCsvDaily(csvSet4, 'source');
            saveCSVSource(csvSet4, 'source');

            var data4 = dataTable4.rows().data();

            var month_year = [];
            var sourceManual = [];
            var sourcePortal = [];
            var sourceBulk = [];
            var sourceShopify = [];
            var totalUsage = [];

            for (var i = 0; i < data4.length; i++) {
                month_year.push(data4[i][0]);
                sourceManual[data4[i][0]] = data4[i][1];
                sourcePortal[data4[i][0]] = data4[i][3];
                sourceBulk[data4[i][0]] = data4[i][4];
                sourceShopify[data4[i][0]] = data4[i][2];
                totalUsage[data4[i][0]] = data4[i][5];

            }
            var count = {};
            month_year.forEach(function (i) {
                count[i] = (count[i] || 0) + 1;
            });

            // creating empty array for highcharts series data
            var series_data6 = [];
            var series_data7 = [];
            var series_data8 = [];
            var series_data9 = [];
            var series_data10 = [];
            var categores4 = [];
            Object.keys(sourceManual).map(function (item, key) {
                series_data6.push(parseInt(sourceManual[item]));
                series_data7.push(parseInt(sourcePortal[item]));
                series_data8.push(parseInt(sourceBulk[item]));
                series_data9.push(parseInt(sourceShopify[item]));
                series_data10.push(parseInt(totalUsage[item]));
                categores4.push(item)
            });

            plotChartSource(series_data6, series_data7, series_data8,
                series_data9, series_data10, categores4);

            if (!isNullorEmpty(debt_rows5)) {
                debt_rows5
                    .forEach(function (source_row, index) {


                        var month = source_row.dateUsed;

                        var val1 = currentRecord.get();
                        var freq = val1.getValue({
                            fieldId: 'custpage_freq',
                        });

                        if (freq == 'weekly') {
                            var splitMonth = month.split('/');
                            console.log('inside weekly loading debt_rows');
                            console.log('splitMonth: ' + splitMonth);

                            var startofWeekDate = new Date(splitMonth[2], splitMonth[1] - 1, splitMonth[0]);
                            var startofWeekDateFromatted = formatDateYYYYMMDD(startofWeekDate);
                            var endofWeekdate = new Date(startofWeekDate.setDate(startofWeekDate.getDate() - startofWeekDate.getDay() + 6));

                            var endofWeekdateFromatted = formatDateYYYYMMDD(endofWeekdate);


                            var firstDay = new Date(splitMonth[2], (splitMonth[1] - 1), 1);
                            var lastDay = new Date(splitMonth[2], (splitMonth[1]), 0);

                            // if (firstDay < 10) {
                            //     firstDay = '0' + firstDay;
                            // }


                            // var startDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                            //     splitMonth[0];

                            // var lastDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                            //     lastDay
                            firstDay = formatDateYYYYMMDD(firstDay);
                            lastDay = formatDateYYYYMMDD(lastDay);

                            debtDataSet5.push([
                                startofWeekDateFromatted, source_row.exp_dl,
                                source_row.exp_c5,
                                source_row.exp_b4,
                                source_row.exp_500g,
                                source_row.exp_1kg,
                                source_row.exp_3kg,
                                source_row.exp_5kg,
                                source_row.std_250g,
                                source_row.std_500g,
                                source_row.std_1kg,
                                source_row.std_3kg,
                                source_row.std_5kg,
                                source_row.std_10kg,
                                source_row.std_20kg,
                                source_row.std_25kg,
                                source_row.total_weight_usage
                            ]);

                            csvSet5.push([startofWeekDateFromatted, source_row.exp_dl,
                                source_row.exp_c5,
                                source_row.exp_b4,
                                source_row.exp_500g,
                                source_row.exp_1kg,
                                source_row.exp_3kg,
                                source_row.exp_5kg,
                                source_row.std_250g,
                                source_row.std_500g,
                                source_row.std_1kg,
                                source_row.std_3kg,
                                source_row.std_5kg,
                                source_row.std_10kg,
                                source_row.std_20kg,
                                source_row.std_25kg,
                                source_row.total_weight_usage
                            ]);
                        } else if (freq == 'daily') {
                            var splitMonth = month.split('/');

                            var firstDay = new Date(splitMonth[2], (splitMonth[1] - 1), 1);
                            var lastDay = new Date(splitMonth[2], (splitMonth[1]), 0);

                            // if (firstDay < 10) {
                            //     firstDay = '0' + firstDay;
                            // }


                            var startDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                                splitMonth[0];

                            // var lastDate = splitMonth[2] + '-' + splitMonth[1] + '-' +
                            //     lastDay

                            firstDay = formatDateYYYYMMDD(firstDay);
                            lastDay = formatDateYYYYMMDD(lastDay);

                            debtDataSet5.push([
                                startDate, source_row.exp_dl,
                                source_row.exp_c5,
                                source_row.exp_b4,
                                source_row.exp_500g,
                                source_row.exp_1kg,
                                source_row.exp_3kg,
                                source_row.exp_5kg,
                                source_row.std_250g,
                                source_row.std_500g,
                                source_row.std_1kg,
                                source_row.std_3kg,
                                source_row.std_5kg,
                                source_row.std_10kg,
                                source_row.std_20kg,
                                source_row.std_25kg,
                                source_row.total_weight_usage
                            ]);

                            csvSet5.push([startDate, source_row.exp_dl,
                                source_row.exp_c5,
                                source_row.exp_b4,
                                source_row.exp_500g,
                                source_row.exp_1kg,
                                source_row.exp_3kg,
                                source_row.exp_5kg,
                                source_row.std_250g,
                                source_row.std_500g,
                                source_row.std_1kg,
                                source_row.std_3kg,
                                source_row.std_5kg,
                                source_row.std_10kg,
                                source_row.std_20kg,
                                source_row.std_25kg,
                                source_row.total_weight_usage
                            ]);
                        } else {


                            debtDataSet5.push([
                                month, source_row.exp_dl,
                                source_row.exp_c5,
                                source_row.exp_b4,
                                source_row.exp_500g,
                                source_row.exp_1kg,
                                source_row.exp_3kg,
                                source_row.exp_5kg,
                                source_row.std_250g,
                                source_row.std_500g,
                                source_row.std_1kg,
                                source_row.std_3kg,
                                source_row.std_5kg,
                                source_row.std_10kg,
                                source_row.std_20kg,
                                source_row.std_25kg,
                                source_row.total_weight_usage
                            ]);

                            csvSet5.push([month, source_row.exp_dl,
                                source_row.exp_c5,
                                source_row.exp_b4,
                                source_row.exp_500g,
                                source_row.exp_1kg,
                                source_row.exp_3kg,
                                source_row.exp_5kg,
                                source_row.std_250g,
                                source_row.std_500g,
                                source_row.std_1kg,
                                source_row.std_3kg,
                                source_row.std_5kg,
                                source_row.std_10kg,
                                source_row.std_20kg,
                                source_row.std_25kg,
                                source_row.total_weight_usage
                            ]);
                        }


                        // csvSet.push([month, source_row.source_manual,
                        // source_row.source_shopify,
                        // source_row.source_portal,source_row.source_bulk,
                        // source_row.total_usage]);

                    });
            }
            console.log(debtDataSet5)
            var datatable5 = $('#mpexusage-weights').DataTable();
            datatable5.clear();
            datatable5.rows.add(debtDataSet5);
            datatable5.draw();

            // saveCsvDaily(csvSet5, 'source');
            saveCSVProdWeights(csvSet5);

            var data5 = dataTable5.rows().data();

            var month_year = [];
            var exp_dl = [];
            var exp_c5 = [];
            var exp_b4 = [];
            var exp_500g = [];
            var exp_1kg = [];
            var exp_3kg = [];
            var exp_5kg = [];
            var std_250g = [];
            var std_500g = [];
            var std_1kg = [];
            var std_3kg = [];
            var std_5kg = [];
            var std_10kg = [];
            var std_20kg = [];
            var std_25kg = [];
            var total_weight_usage = [];

            for (var i = 0; i < data5.length; i++) {
                month_year.push(data5[i][0]);
                exp_dl[data5[i][0]] = data5[i][1];
                exp_c5[data5[i][0]] = data5[i][2];
                exp_b4[data5[i][0]] = data5[i][3];
                exp_500g[data5[i][0]] = data5[i][4];
                exp_1kg[data5[i][0]] = data5[i][5];
                exp_3kg[data5[i][0]] = data5[i][6];
                exp_5kg[data5[i][0]] = data5[i][7];
                std_250g[data5[i][0]] = data5[i][8];
                std_500g[data5[i][0]] = data5[i][9];
                std_1kg[data5[i][0]] = data5[i][10];
                std_3kg[data5[i][0]] = data5[i][11];
                std_5kg[data5[i][0]] = data5[i][12];
                std_10kg[data5[i][0]] = data5[i][13];
                std_20kg[data5[i][0]] = data5[i][14];
                std_25kg[data5[i][0]] = data5[i][15];
                total_weight_usage[data5[i][0]] = data5[i][16];

            }
            var count = {};
            month_year.forEach(function (i) {
                count[i] = (count[i] || 0) + 1;
            });

            // creating empty array for highcharts series data
            var series_data60 = [];
            var series_data70 = [];
            var series_data80 = [];
            var series_data90 = [];
            var series_data100 = [];
            var series_data110 = [];
            var series_data120 = [];
            var series_data130 = [];
            var series_data140 = [];
            var series_data150 = [];
            var series_data160 = [];
            var series_data170 = [];
            var series_data180 = [];
            var series_data190 = [];
            var series_data200 = [];
            var series_data210 = [];

            var categores5 = [];
            Object.keys(exp_dl).map(function (item, key) {
                series_data60.push(parseInt(exp_dl[item]));
                series_data70.push(parseInt(exp_c5[item]));
                series_data80.push(parseInt(exp_b4[item]));
                series_data90.push(parseInt(exp_500g[item]));
                series_data100.push(parseInt(exp_1kg[item]));
                series_data110.push(parseInt(exp_3kg[item]));
                series_data120.push(parseInt(exp_5kg[item]));
                series_data130.push(parseInt(std_250g[item]));
                series_data140.push(parseInt(std_500g[item]));
                series_data150.push(parseInt(std_1kg[item]));
                series_data160.push(parseInt(std_3kg[item]));
                series_data170.push(parseInt(std_5kg[item]));
                series_data180.push(parseInt(std_10kg[item]));
                series_data190.push(parseInt(std_20kg[item]));
                series_data200.push(parseInt(std_25kg[item]));
                series_data210.push(parseInt(total_weight_usage[item]));
                categores5.push(item)
            });

            plotChartWeight(series_data60,
                series_data70,
                series_data80,
                series_data90,
                series_data100,
                series_data110,
                series_data120,
                series_data130,
                series_data140,
                series_data150,
                series_data160,
                series_data170,
                series_data180,
                series_data190,
                series_data200,
                series_data210, categores5);


            return true;
        }

        function plotChartWeight(series_data60,
            series_data70,
            series_data80,
            series_data90,
            series_data100,
            series_data110,
            series_data120,
            series_data130,
            series_data140,
            series_data150,
            series_data160,
            series_data170,
            series_data180,
            series_data190,
            series_data200,
            series_data210, categores5) {
            // console.log(series_data)
            Highcharts
                .chart(
                    'container_weights', {
                    chart: {
                        type: 'column',
                        height: (6 / 16 * 100) + '%',
                        backgroundColor: '#CFE0CE',
                        zoomType: 'xy'
                    },
                    xAxis: {
                        categories: categores5,
                        crosshair: true,
                        style: {
                            fontWeight: 'bold',
                        },
                        labels: {
                            style: {
                                fontSize: '10px'
                            }
                        }
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Total MPEX Usage',
                            style: {
                                fontWeight: 'bold',
                                color: '#0B2447',
                                fontSize: '12px'
                            }
                        },
                        stackLabels: {
                            enabled: true,
                            style: {
                                fontWeight: 'bold',
                                fontSize: '10px'
                            }
                        },
                        labels: {
                            style: {
                                fontSize: '10px'
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{point.x}</b><br/>',
                        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
                        style: {
                            fontSize: '10px'
                        }
                    },
                    plotOptions: {
                        column: {
                            stacking: 'normal',
                            dataLabels: {
                                enabled: true
                            }
                        },
                        series: {
                            dataLabels: {
                                enabled: true,
                                color: 'black',
                                style: {
                                    fontSize: '12px'
                                }
                            },
                            pointPadding: 0.1,
                            groupPadding: 0
                        }
                    },
                    series: [{
                        name: 'Express - DL',
                        data: series_data60,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Express - C5',
                        data: series_data70,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Express - B4',
                        data: series_data80,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Express - 500g',
                        data: series_data90,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Express - 1kg',
                        data: series_data100,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Express - 3kg',
                        data: series_data110,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Express - 5kg',
                        data: series_data120,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Standard - 250g',
                        data: series_data130,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Standard - 500g',
                        data: series_data140,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Standard - 1kg',
                        data: series_data150,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Standard - 3kg',
                        data: series_data160,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Standard - 5kg',
                        data: series_data170,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Standard - 10kg',
                        data: series_data180,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Standard - 20kg',
                        data: series_data190,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Standard - 25kg',
                        data: series_data200,

                        style: {
                            fontWeight: 'bold',
                        }
                    }]
                });
        }

        function plotChartSource(series_data1, series_data2, series_data3,
            series_data4, series_data5, categores) {
            // console.log(series_data)
            Highcharts
                .chart(
                    'container_source', {
                    chart: {
                        height: (6 / 16 * 100) + '%',
                        backgroundColor: '#CFE0CE',
                        zoomType: 'xy',
                        type: 'column'
                    },
                    xAxis: {
                        categories: categores,
                        crosshair: true,
                        style: {
                            fontWeight: 'bold',
                        },
                        labels: {
                            style: {
                                fontSize: '10px'
                            }
                        }
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Total MPEX Usage',
                            style: {
                                fontWeight: 'bold',
                                color: '#0B2447',
                                fontSize: '12px'
                            }
                        },
                        stackLabels: {
                            enabled: true,
                            style: {
                                fontWeight: 'bold',
                                fontSize: '10px'
                            }
                        },
                        labels: {
                            style: {
                                fontSize: '10px'
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{point.x}</b><br/>',
                        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
                        style: {
                            fontSize: '10px'
                        }
                    },
                    plotOptions: {
                        column: {
                            stacking: 'normal',
                            dataLabels: {
                                enabled: true
                            }
                        },
                        series: {
                            dataLabels: {
                                enabled: true,
                                color: 'black',
                                style: {
                                    fontSize: '12px'
                                }
                            },
                            pointPadding: 0.1,
                            groupPadding: 0
                        }
                    },
                    series: [{
                        name: 'Manual',
                        data: series_data1,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Portal',
                        data: series_data2,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Shopify',
                        data: series_data4,

                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Bulk',
                        data: series_data3,

                        style: {
                            fontWeight: 'bold',
                        }
                    }]
                });
        }

        function plotChartSpeedUsage(series_data1, series_data2, series_data3, categores, series_data8, chart_container) {
            // console.log(series_data)
            Highcharts
                .chart(
                    chart_container, {
                    chart: {
                        height: (6 / 16 * 100) + '%',
                        backgroundColor: '#CFE0CE',
                        zoomType: 'xy',
                        type: 'column',
                    },
                    xAxis: {
                        categories: categores,
                        crosshair: true,
                        style: {
                            fontWeight: 'bold',
                        },
                        labels: {
                            style: {
                                fontSize: '10px'
                            }
                        }
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Total Usage',
                            style: {
                                fontWeight: 'bold',
                                color: '#0B2447',
                                fontSize: '12px'
                            }
                        },
                        stackLabels: {
                            enabled: true,
                            style: {
                                fontWeight: 'bold',
                                fontSize: '10px'
                            }
                        },
                        labels: {
                            style: {
                                fontSize: '10px'
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{point.x}</b><br/>',
                        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
                        style: {
                            fontSize: '10px'
                        }
                    },
                    plotOptions: {
                        column: {
                            stacking: 'normal',
                            dataLabels: {
                                enabled: true
                            }
                        },
                        series: {
                            dataLabels: {
                                enabled: true,
                                color: 'black',
                                style: {
                                    fontSize: '12px'
                                }
                            },
                            pointPadding: 0.1,
                            groupPadding: 0
                        }
                    },
                    series: [{
                        name: 'Express',
                        data: series_data1,
                        color: '#095c7b',
                        style: {
                            fontWeight: 'bold',
                        }
                        // }, {
                        //     name: 'Sendle AU Express',
                        //     data: series_data8,
                        //     color: '#108372',
                        //     style: {
                        //         fontWeight: 'bold',
                        //     }
                    }, {
                        name: 'Standard',
                        data: series_data2,
                        color: '#f15729',
                        style: {
                            fontWeight: 'bold',
                        }
                    }]
                });
        }

        function plotChart(series_data, series_data2, categores, series_data3) {
            // console.log(series_data)
            Highcharts.chart('container', {
                chart: {
                    height: (6 / 16 * 100) + '%',
                    backgroundColor: '#CFE0CE',
                    zoomType: 'xy'
                },
                xAxis: {
                    categories: categores,
                    crosshair: true,
                    style: {
                        fontWeight: 'bold',
                    },
                    labels: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                },
                yAxis: [{
                    title: {
                        text: 'MPEX Count',
                        style: {
                            fontWeight: 'bold',
                            color: '#0B2447',
                            fontSize: '12px'
                        }
                    },
                    labels: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                }, {
                    title: {
                        text: 'MPEX Count',
                        style: {
                            fontWeight: 'bold',
                            color: '#0B2447',
                            fontSize: '12px'
                        }
                    },
                    opposite: true,
                    labels: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                }],
                plotOptions: {
                    column: {
                        colorByPoint: false
                    },
                    series: {
                        dataLabels: {
                            enabled: true,
                            color: 'black',
                            style: {
                                fontSize: '12px'
                            }
                        },
                        pointPadding: 0.1,
                        groupPadding: 0
                    }
                },
                series: [{
                    name: 'Year-Month',
                    type: 'column',
                    yAxis: 1,
                    data: series_data,
                    color: '#108372',
                    style: {
                        fontWeight: 'bold',
                    }
                }, {
                    name: 'Customer Count',
                    type: 'spline',
                    data: series_data2,
                    color: '#F15628'
                }, {
                    name: 'Zee Count',
                    type: 'spline',
                    data: series_data3,
                    color: '#F2C80F'
                }]
            });
        }


        function saveRecord() { }

        /**
         * Load the string stored in the hidden field 'custpage_table_csv'.
         * Converts it to a CSV file.
         * Creates a hidden link to download the file and triggers the click of the link.
         */
        function downloadCsv() {
            var today = new Date();
            today = formatDate(today);
            var val1 = currentRecord.get();
            var csv_overview = val1.getValue({
                fieldId: 'custpage_table_csv_overview',
            });
            var csv_customer_list = val1.getValue({
                fieldId: 'custpage_table_csv_customer_list',
            });
            var csv_source = val1.getValue({
                fieldId: 'custpage_table_csv_source',
            });
            var csv_prod_weights = val1.getValue({
                fieldId: 'custpage_table_csv_prod_weights',
            });
            if (role != 1000) {
                var csv_zee_list = val1.getValue({
                    fieldId: 'custpage_table_csv_zee_list',
                });
                today = replaceAll(today);
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                var content_type = 'text/csv';
                var csvFileZeeList = new Blob([csv_zee_list], {
                    type: content_type
                });
                var url = window.URL.createObjectURL(csvFileZeeList);
                var filename = 'MP Products Scan - Franchisee List_' + today + '.csv';
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
            }

            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFileOverview = new Blob([csv_overview], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFileOverview);
            var filename = 'MP Products Scan - Overview_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFileCustomerList = new Blob([csv_customer_list], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFileCustomerList);
            var filename = 'MP Products Scan - Customer List_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFileSource = new Blob([csv_source], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFileSource);
            var filename = 'MP Products Scan - Source_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFileProdWeights = new Blob([csv_prod_weights], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFileProdWeights);
            var filename = 'MP Products Scan - Product Weights_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);


        }

        //Save CSV for the Overview tab
        function saveCSVOverview(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Period", "Express Count", "Sendle AU Express Count", "Standard Count",
                "Total Count"
            ]
            headers = headers.join(';'); // .join(', ')

            var csv = sep + "\n" + headers + "\n";


            ordersDataSet.forEach(function (row) {
                row = row.join(';');
                csv += row;
                csv += "\n";
            });

            var val1 = currentRecord.get();
            val1.setValue({
                fieldId: 'custpage_table_csv_overview',
                value: csv
            });


            return true;
        }

        //Save CSV for the Customer List tab
        function saveCSVZeeList(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Franchisee", "Express Count", "Sendle AU Express Count", "Standard Count",
                "Total Count"
            ]
            headers = headers.join(';'); // .join(', ')

            var csv = sep + "\n" + headers + "\n";


            ordersDataSet.forEach(function (row) {
                row = row.join(';');
                csv += row;
                csv += "\n";
            });

            var val1 = currentRecord.get();
            val1.setValue({
                fieldId: 'custpage_table_csv_zee_list',
                value: csv
            });


            return true;
        }
        function saveCSVCustomerList(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Customer Name", "Franchisee", "Express Count", "Sendle AU Express Count", "Standard Count",
                "Total Count"
            ]
            headers = headers.join(';'); // .join(', ')

            var csv = sep + "\n" + headers + "\n";


            ordersDataSet.forEach(function (row) {
                row = row.join(';');
                csv += row;
                csv += "\n";
            });

            var val1 = currentRecord.get();
            val1.setValue({
                fieldId: 'custpage_table_csv_customer_list',
                value: csv
            });


            return true;
        }

        //Save CSV for the Source tab
        function saveCSVSource(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Period", "Manual", "Shopify", "Customer Portal", "Bulk",
                "Total Count"
            ]
            headers = headers.join(';'); // .join(', ')

            var csv = sep + "\n" + headers + "\n";


            ordersDataSet.forEach(function (row) {
                row = row.join(';');
                csv += row;
                csv += "\n";
            });

            var val1 = currentRecord.get();
            val1.setValue({
                fieldId: 'custpage_table_csv_source',
                value: csv
            });


            return true;
        }

        //Save CSV for the Product Weights tab
        function saveCSVProdWeights(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Period", "Express - DL", "Express - C5", "Express - B4", "Express - 500g", "Express - 1kg", "Express - 3kg", "Express - 5kg", "Standard - 250g", "Standard - 500g", "Standard - 1kg", "Standard - 3kg", "Standard - 5kg", "Standard - 10kg", "Standard - 20kg", "Standard - 25kg"
            ]
            headers = headers.join(';'); // .join(', ')

            var csv = sep + "\n" + headers + "\n";


            ordersDataSet.forEach(function (row) {
                row = row.join(';');
                csv += row;
                csv += "\n";
            });

            var val1 = currentRecord.get();
            val1.setValue({
                fieldId: 'custpage_table_csv_prod_weights',
                value: csv
            });


            return true;
        }




        function formatDate(testDate) {
            console.log('testDate: ' + testDate);
            var responseDate = format.format({
                value: testDate,
                type: format.Type.DATE
            });
            console.log('responseDate: ' + responseDate);
            return responseDate;
        }

        function replaceAll(string) {
            return string.split("/").join("-");
        }

        function stateIDPublicHolidaysRecord(state) {
            switch (state) {
                case 1:
                    return 1; //NSW
                    break;
                case 2:
                    return 6; //QLD
                    break;
                case 3:
                    return 5; //VIC
                    break;
                case 4:
                    return 3; //SA
                    break;
                case 5:
                    return 7; //TAS
                    break;
                case 6:
                    return 4; //ACT
                    break;
                case 7:
                    return 2; //WA
                    break;
                case 8:
                    return 8; //NT
                    break;
                default:
                    return null;
                    break;
            }
        }

        function stateID(state) {
            state = state.toUpperCase();
            switch (state) {
                case 'ACT':
                    return 6
                    break;
                case 'NSW':
                    return 1
                    break;
                case 'NT':
                    return 8
                    break;
                case 'QLD':
                    return 2
                    break;
                case 'SA':
                    return 4
                    break;
                case 'TAS':
                    return 5
                    break;
                case 'VIC':
                    return 3
                    break;
                case 'WA':
                    return 7
                    break;
                default:
                    return 0;
                    break;
            }
        }
        /**
         * Sets the values of `date_from` and `date_to` based on the selected option in the '#period_dropdown'.
         */
        function selectDate() {
            var period_selected = $('#period_dropdown option:selected').val();
            var today = new Date();
            var today_day_in_month = today.getDate();
            var today_day_in_week = today.getDay();
            var today_month = today.getMonth();
            var today_year = today.getFullYear();

            var today_date = new Date(Date.UTC(today_year, today_month,
                today_day_in_month))

            switch (period_selected) {
                case "this_week":
                    // This method changes the variable "today" and sets it on the previous monday
                    if (today_day_in_week == 0) {
                        var monday = new Date(Date.UTC(today_year, today_month,
                            today_day_in_month - 6));
                    } else {
                        var monday = new Date(Date.UTC(today_year, today_month,
                            today_day_in_month - today_day_in_week + 1));
                    }
                    var date_from = monday.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "last_week":
                    var today_day_in_month = today.getDate();
                    var today_day_in_week = today.getDay();
                    // This method changes the variable "today" and sets it on the previous monday
                    if (today_day_in_week == 0) {
                        var previous_sunday = new Date(Date.UTC(today_year, today_month,
                            today_day_in_month - 7));
                    } else {
                        var previous_sunday = new Date(Date.UTC(today_year, today_month,
                            today_day_in_month - today_day_in_week));
                    }

                    var previous_sunday_year = previous_sunday.getFullYear();
                    var previous_sunday_month = previous_sunday.getMonth();
                    var previous_sunday_day_in_month = previous_sunday.getDate();

                    var monday_before_sunday = new Date(Date.UTC(previous_sunday_year,
                        previous_sunday_month, previous_sunday_day_in_month - 6));

                    var date_from = monday_before_sunday.toISOString().split('T')[0];
                    var date_to = previous_sunday.toISOString().split('T')[0];
                    break;

                case "this_month":
                    var first_day_month = new Date(Date.UTC(today_year, today_month));
                    var date_from = first_day_month.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "last_month":
                    var first_day_previous_month = new Date(Date.UTC(today_year,
                        today_month - 1));
                    var last_day_previous_month = new Date(Date.UTC(today_year,
                        today_month, 0));
                    var date_from = first_day_previous_month.toISOString().split('T')[0];
                    var date_to = last_day_previous_month.toISOString().split('T')[0];
                    break;

                case "full_year":
                    var first_day_in_year = new Date(Date.UTC(today_year, 0));
                    var date_from = first_day_in_year.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "financial_year":
                    if (today_month >= 6) {
                        var first_july = new Date(Date.UTC(today_year, 6));
                    } else {
                        var first_july = new Date(Date.UTC(today_year - 1, 6));
                    }
                    var date_from = first_july.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                default:
                    var date_from = '';
                    var date_to = '';
                    break;
            }
            $('#date_from').val(date_from);
            $('#date_to').val(date_to);
        }

        function formatAMPM() {
            var date = new Date();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
        }
        /**
         * @param   {Number} x
         * @returns {String} The same number, formatted in Australian dollars.
         */
        function financial(x) {
            if (typeof (x) == 'string') {
                x = parseFloat(x);
            }
            if (isNullorEmpty(x) || isNaN(x)) {
                return "$0.00";
            } else {
                return x.toLocaleString('en-AU', {
                    style: 'currency',
                    currency: 'AUD'
                });
            }
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
        /**
         * [getDate description] - Get the current date
         * @return {[String]} [description] - return the string date
         */
        function getDate() {
            var date = new Date();
            date = format.format({
                value: date,
                type: format.Type.DATE,
                timezone: format.Timezone.AUSTRALIA_SYDNEY
            });

            return date;
        }

        function isNullorEmpty(val) {
            if (val == '' || val == null) {
                return true;
            } else {
                return false;
            }
        }
        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            adhocNewCustomers: adhocNewCustomers,
            downloadCsv: downloadCsv
        }
    });
