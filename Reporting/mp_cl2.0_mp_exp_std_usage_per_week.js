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

        var express_speed_daily = 0;
        var standard_speed_daily = 0;
        var sendle_au_express_daily = 0;
        var total_usage_daily = 0;

        var total_months = 14;

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

            $('.loading_section').removeClass('hide');
        }

        function afterSubmit() {
            $('.date_filter_section').removeClass('hide');
            $('.period_dropdown_section').removeClass('hide');

            $('.loading_section').addClass('hide');


            if (!isNullorEmpty($('#result_customer_benchmark').val())) {
                $('#customer_benchmark_preview').removeClass('hide');
                $('#customer_benchmark_preview').show();
            }

            $('#result_customer_benchmark').on('change', function () {
                $('#customer_benchmark_preview').removeClass('hide');
                $('#customer_benchmark_preview').show();
            });

            $('#customer_benchmark_preview').removeClass('hide');
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

                beforeSubmit();
                submitSearch();

                return true;
            });


            /**
             *  Auto Load Submit Search and Load Results on Page Initialisation
             */
            pageLoad();
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

            dataTable = $('#mpexusage-weekly_scans').DataTable({
                destroy: true,
                data: debtDataSet,
                pageLength: 1000,
                order: [
                    [0, 'asc']
                ],
                columns: [{
                    title: 'Period'
                }, {
                    title: 'Express Usage'
                }, {
                    title: 'Sendle AU Express Usage'
                }, {
                    title: 'Standard Usage'
                }, {
                    title: 'Total Usage'
                }],
                columnDefs: [{
                    targets: [0, 4],
                    className: 'bolded'
                }]

            });

            dataTable2 = $('#mpexusage-monthly_scans').DataTable({
                destroy: true,
                data: debtDataSet2,
                pageLength: 1000,
                order: [
                    [0, 'asc']
                ],
                columns: [{
                    title: 'Period'
                }, {
                    title: 'Express Usage'
                }, {
                    title: 'Sendle AU Express Usage'
                }, {
                    title: 'Standard Usage'
                }, {
                    title: 'Total Usage'
                }],
                columnDefs: [{
                    targets: [0, 4],
                    className: 'bolded'
                }]

            });

            dataTable3 = $('#mpexusage-daily_scans').DataTable({
                destroy: true,
                data: debtDataSet3,
                pageLength: 1000,
                order: [
                    [0, 'asc']
                ],
                columns: [{
                    title: 'Period'
                }, {
                    title: 'Express Usage'
                }, {
                    title: 'Sendle AU Express Usage'
                }, {
                    title: 'Standard Usage'
                }, {
                    title: 'Total Usage'
                }],
                columnDefs: [{
                    targets: [0, 4],
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

            console.log('Load DataTable Params: ' + date_from + ' | ' + date_to +
                ' | ' + zee);

            loadDebtRecord(date_from, date_to, zee);

            console.log('Loaded Results');


            afterSubmit();
        }

        function loadDebtRecord(date_from, date_to, zee_id) {
            // Customer Product Usage - All Scans (Weekly)
            var mpexUsageResults = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch6802'
            });

            var custID = currRec.getValue({
                fieldId: 'custpage_custid',
            });

            console.log('custID ' + custID);

            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpexUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpexUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpexUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpexUsageResults.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            var count = 0;
            var oldDate = null;
            var oldIntegration = null;
            var oldIntegrationText = null;

            mpexUsageResults.run().each(function (mpexUsageSet) {

                var dateUsed = mpexUsageSet.getValue({
                    name: 'custrecord_cust_date_stock_used',
                    summary: 'GROUP'
                });


                var deliverySpeed = mpexUsageSet.getValue({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });
                var deliverySpeedText = mpexUsageSet.getText({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });

                var integration = mpexUsageSet.getValue({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });
                var integrationText = mpexUsageSet.getText({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });


                var mpexUsage = parseInt(mpexUsageSet.getValue({
                    name: 'name',
                    summary: 'COUNT'
                }));

                if (count == 0) {

                    if (integrationText == '- None -') {
                        express_speed = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed = mpexUsage;
                        }
                    }


                    total_usage = express_speed + standard_speed + sendle_au_express;

                } else if (oldDate != null &&
                    oldDate == dateUsed) {

                    if (integrationText == '- None -') {
                        express_speed += mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed += mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed += mpexUsage;
                        }
                    }

                    total_usage = express_speed + standard_speed + sendle_au_express;


                } else if (oldDate != null &&
                    oldDate != dateUsed) {

                    debt_set.push({
                        dateUsed: oldDate,
                        express_speed: express_speed,
                        sendle_au_express: sendle_au_express,
                        standard_speed: standard_speed,
                        total_usage: total_usage
                    });

                    express_speed = 0;
                    standard_speed = 0;
                    sendle_au_express = 0;
                    total_usage = 0;

                    if (integrationText == '- None -') {
                        express_speed = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed = mpexUsage;
                        }
                    }

                    total_usage = express_speed + standard_speed + sendle_au_express;


                }

                count++;
                oldDate = dateUsed;
                oldIntegration = integration;
                return true;
            });

            if (count > 0) {
                debt_set.push({
                    dateUsed: oldDate,
                    express_speed: express_speed,
                    sendle_au_express: sendle_au_express,
                    standard_speed: standard_speed,
                    total_usage: total_usage
                });

            }

            // Customer Product Usage - All Scans (Monthly)
            var mpScanMonthlyUsage = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch7108'
            });

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
                            sendle_au_express_monthly = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_monthly = mpexUsage;
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
                            sendle_au_express_monthly += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly += mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_monthly += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly += mpexUsage;
                        }
                    }

                    total_usage_monthly = express_speed_monthly + standard_speed_monthly + sendle_au_express_monthly;


                } else if (oldDate2 != null &&
                    oldDate2 != dateUsed) {

                    debt_set2.push({
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
                            sendle_au_express_monthly = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_monthly = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_monthly = mpexUsage;
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
                debt_set2.push({
                    dateUsed: oldDate2,
                    express_speed: express_speed_monthly,
                    sendle_au_express: sendle_au_express_monthly,
                    standard_speed: standard_speed_monthly,
                    total_usage: total_usage_monthly
                });

            }



            // Customer Product Usage - All Scans (Daily)
            var mpScanDailyUsage = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch7109'
            });

            var custID = currRec.getValue({
                fieldId: 'custpage_custid',
            });

            console.log('custID ' + custID);

            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpScanDailyUsage.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpScanDailyUsage.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpScanDailyUsage.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpScanDailyUsage.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            var count3 = 0;
            var oldDate3 = null;
            var oldIntegration3 = null;
            var oldIntegrationText = null;

            mpScanDailyUsage.run().each(function (mpScanDailyUsageSet) {

                var dateUsed = mpScanDailyUsageSet.getValue({
                    name: 'custrecord_cust_date_stock_used',
                    summary: 'GROUP'
                });


                var deliverySpeed = mpScanDailyUsageSet.getValue({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });
                var deliverySpeedText = mpScanDailyUsageSet.getText({
                    name: 'custrecord_delivery_speed',
                    summary: 'GROUP'
                });

                var integration = mpScanDailyUsageSet.getValue({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });
                var integrationText = mpScanDailyUsageSet.getText({
                    name: 'custrecord_integration',
                    summary: 'GROUP'
                });


                var mpexUsage = parseInt(mpScanDailyUsageSet.getValue({
                    name: 'name',
                    summary: 'COUNT'
                }));

                if (count3 == 0) {

                    if (integrationText == '- None -') {
                        express_speed_daily = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_daily = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_daily = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_daily = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_daily = mpexUsage;
                        }
                    }


                    total_usage_daily = express_speed_daily + standard_speed_daily + sendle_au_express_daily;

                } else if (oldDate3 != null &&
                    oldDate3 == dateUsed) {

                    if (integrationText == '- None -') {
                        express_speed_daily += mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_daily += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_daily += mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_daily += mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_daily += mpexUsage;
                        }
                    }

                    total_usage_daily = express_speed_daily + standard_speed_daily + sendle_au_express_daily;


                } else if (oldDate3 != null &&
                    oldDate3 != dateUsed) {

                    debt_set3.push({
                        dateUsed: oldDate3,
                        express_speed: express_speed_daily,
                        sendle_au_express: sendle_au_express_daily,
                        standard_speed: standard_speed_daily,
                        total_usage: total_usage_daily
                    });

                    express_speed_daily = 0;
                    standard_speed_daily = 0;
                    sendle_au_express_daily = 0;
                    total_usage_daily = 0;

                    if (integrationText == '- None -') {
                        express_speed_daily = mpexUsage;
                    } else if (integrationText == 'Sendle') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_daily = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_daily = mpexUsage;
                        }
                    } else if (integrationText == 'API Integration') {
                        if (deliverySpeed == 2 ||
                            deliverySpeedText == '- None -') {
                            sendle_au_express_daily = mpexUsage;
                        } else if (deliverySpeed == 1) {
                            standard_speed_daily = mpexUsage;
                        }
                    }

                    total_usage_daily = express_speed_daily + standard_speed_daily + sendle_au_express_daily;


                }

                count3++;
                oldDate3 = dateUsed;
                oldIntegration3 = integration;
                return true;
            });

            if (count3 > 0) {
                debt_set3.push({
                    dateUsed: oldDate3,
                    express_speed: express_speed_daily,
                    sendle_au_express: sendle_au_express_daily,
                    standard_speed: standard_speed_daily,
                    total_usage: total_usage_daily
                });

            }


            console.log('debt_set: ' + debt_set)
            console.log('debt_set2: ' + debt_set2)
            console.log('debt_set3: ' + debt_set3)
            loadDatatable(debt_set, debt_set2, debt_set3);
            debt_set = [];

        }

        function loadDatatable(debt_rows, debt_rows2, debt_rows3) {
            // $('#result_debt').empty();
            debtDataSet = [];
            csvSet = [];

            debtDataSet2 = [];
            csvSet2 = [];

            debtDataSet3 = [];
            csvSet3 = [];
            if (!isNullorEmpty(debt_rows)) {
                debt_rows.forEach(function (debt_row, index) {

                    var month = debt_row.dateUsed;
                    // console.log(month);
                    var splitMonth = month.split('-');
                    var splitMonthV2 = month.split('/');

                    // console.log('month ' + month)
                    // console.log('splitMonth ' + splitMonth);
                    // console.log('splitMonthV2 ' + splitMonthV2);

                    var formattedDate = dateISOToNetsuite(splitMonthV2[2] + '-' + splitMonthV2[1] + '-' + splitMonthV2[0]);

                    // console.log('formattedDate ' + formattedDate);

                    var parsedDate = format.parse({
                        value: month,
                        type: format.Type.DATE
                    });

                    var firstDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 1).getDate();
                    var lastDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 0).getDate();

                    if (firstDay < 10) {
                        firstDay = '0' + firstDay;
                    }

                    // var startDate = firstDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    var startDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        splitMonthV2[0];
                    var monthsStartDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        firstDay;
                    // var lastDate = lastDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    var lastDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        lastDay

                    // console.log('startDate ' + startDate);
                    // console.log('lastDate ' + lastDate);

                    var detailedInvoiceURLMonth =
                        '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1627&deploy=1&zee=' +
                        zee + '&start_date=' + monthsStartDate + '&last_date=' + lastDate +
                        '" target=_blank>VIEW (monthly)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                        zee + '&start_date=' + startDate + '&last_date=' + lastDate +
                        '" target=_blank>VIEW (daily)</a>';



                    debtDataSet.push([startDate,
                        debt_row.express_speed, debt_row.sendle_au_express,
                        debt_row.standard_speed, debt_row.total_usage
                    ]);

                    csvSet.push([month, debt_row.express_speed, debt_row.sendle_au_express,
                        debt_row.standard_speed, debt_row.total_usage
                    ]);

                });
            }
            console.log(debtDataSet)
            var datatable = $('#mpexusage-weekly_scans').DataTable();
            datatable.clear();
            datatable.rows.add(debtDataSet);
            datatable.draw();

            saveCsvWeekly(csvSet);

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
                month_year.push(data[i][0]);
                expSpeed[data[i][0]] = data[i][1];
                sendleAUExpressSpeed[data[i][0]] = data[i][2]
                stdSpeed[data[i][0]] = data[i][3]; // creating
                totalUsage[data[i][0]] = data[i][4]; //

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
            plotChartSpeedUsage(series_data6, series_data7, series_data10, categores4, series_data8, 'container_weekly');




            if (!isNullorEmpty(debt_rows2)) {
                debt_rows2.forEach(function (debt_row, index) {

                    var month = debt_row.dateUsed;
                    // console.log(month);
                    var splitMonth = month.split('-');
                    var splitMonthV2 = month.split('/');

                    // console.log('month ' + month)
                    // console.log('splitMonth ' + splitMonth);
                    // console.log('splitMonthV2 ' + splitMonthV2);

                    var formattedDate = dateISOToNetsuite(splitMonthV2[2] + '-' + splitMonthV2[1] + '-' + splitMonthV2[0]);

                    // console.log('formattedDate ' + formattedDate);

                    var parsedDate = format.parse({
                        value: month,
                        type: format.Type.DATE
                    });

                    var firstDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 1).getDate();
                    var lastDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 0).getDate();

                    if (firstDay < 10) {
                        firstDay = '0' + firstDay;
                    }

                    // var startDate = firstDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    var startDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        splitMonthV2[0];
                    var monthsStartDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        firstDay;
                    // var lastDate = lastDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    var lastDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        lastDay

                    // console.log('startDate ' + startDate);
                    // console.log('lastDate ' + lastDate);

                    var detailedInvoiceURLMonth =
                        '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1627&deploy=1&zee=' +
                        zee + '&start_date=' + monthsStartDate + '&last_date=' + lastDate +
                        '" target=_blank>VIEW (monthly)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                        zee + '&start_date=' + startDate + '&last_date=' + lastDate +
                        '" target=_blank>VIEW (daily)</a>';



                    debtDataSet2.push([month,
                        debt_row.express_speed, debt_row.sendle_au_express,
                        debt_row.standard_speed, debt_row.total_usage
                    ]);

                    csvSet2.push([month, debt_row.express_speed, debt_row.sendle_au_express,
                        debt_row.standard_speed, debt_row.total_usage
                    ]);

                });
            }
            console.log(debtDataSet2)
            var datatable2 = $('#mpexusage-monthly_scans').DataTable();
            datatable2.clear();
            datatable2.rows.add(debtDataSet2);
            datatable2.draw();

            saveCsvMonthly(csvSet2);

            var data2 = datatable2.rows().data();


            var month_year_monthly = []; // creating array for storing browser
            // type in array.
            var expSpeed_monthly = []; // creating array for storing browser
            // type in array.
            var sendleAUExpressSpeed_monthly = [];
            var stdSpeed_monthly = []; // creating array for storing browser
            // type in array
            var totalUsage_monthly = []; // creating array for storing browser
            // type in array.

            for (var i = 0; i < data2.length; i++) {
                month_year_monthly.push(data2[i][0]);
                expSpeed_monthly[data2[i][0]] = data2[i][1];
                sendleAUExpressSpeed_monthly[data2[i][0]] = data2[i][2]
                stdSpeed_monthly[data2[i][0]] = data2[i][3]; // creating
                totalUsage_monthly[data2[i][0]] = data2[i][4]; //

            }
            var count2 = {}; // creating object for getting categories with
            // count
            month_year_monthly.forEach(function (i) {
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
            Object.keys(expSpeed_monthly).map(function (item, key) {
                series_data20.push(parseInt(expSpeed_monthly[item]));
                series_data23.push(parseInt(sendleAUExpressSpeed_monthly[item]));
                series_data21.push(parseInt(stdSpeed_monthly[item]));
                series_data22.push(parseInt(totalUsage_monthly[item]));
                categores25.push(item)
            });
            plotChartSpeedUsage(series_data20, series_data21, series_data22, categores25, series_data23, 'container_monthly')





            if (!isNullorEmpty(debt_rows3)) {
                debt_rows3.forEach(function (debt_row, index) {

                    var month = debt_row.dateUsed;
                    // console.log(month);
                    var splitMonth = month.split('-');
                    var splitMonthV2 = month.split('/');

                    // console.log('month ' + month)
                    // console.log('splitMonth ' + splitMonth);
                    // console.log('splitMonthV2 ' + splitMonthV2);

                    var formattedDate = dateISOToNetsuite(splitMonthV2[2] + '-' + splitMonthV2[1] + '-' + splitMonthV2[0]);

                    // console.log('formattedDate ' + formattedDate);

                    var parsedDate = format.parse({
                        value: month,
                        type: format.Type.DATE
                    });

                    var firstDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 1).getDate();
                    var lastDay = new Date(splitMonthV2[0], (splitMonthV2[1]), 0).getDate();

                    if (firstDay < 10) {
                        firstDay = '0' + firstDay;
                    }

                    // var startDate = firstDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    var startDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        splitMonthV2[0];
                    var monthsStartDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        firstDay;
                    // var lastDate = lastDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    var lastDate = splitMonthV2[2] + '-' + splitMonthV2[1] + '-' +
                        lastDay

                    // console.log('startDate ' + startDate);
                    // console.log('lastDate ' + lastDate);

                    var detailedInvoiceURLMonth =
                        '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1627&deploy=1&zee=' +
                        zee + '&start_date=' + monthsStartDate + '&last_date=' + lastDate +
                        '" target=_blank>VIEW (monthly)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                        zee + '&start_date=' + startDate + '&last_date=' + lastDate +
                        '" target=_blank>VIEW (daily)</a>';



                    debtDataSet3.push([startDate,
                        debt_row.express_speed, debt_row.sendle_au_express,
                        debt_row.standard_speed, debt_row.total_usage
                    ]);

                    csvSet3.push([startDate, debt_row.express_speed, debt_row.sendle_au_express,
                        debt_row.standard_speed, debt_row.total_usage
                    ]);

                });
            }
            console.log(debtDataSet3)
            var datatable3 = $('#mpexusage-daily_scans').DataTable();
            datatable3.clear();
            datatable3.rows.add(debtDataSet3);
            datatable3.draw();

            saveCsvDaily(csvSet3);

            var data3 = datatable3.rows().data();


            var month_year_daily = []; // creating array for storing browser
            // type in array.
            var expSpeed_daily = []; // creating array for storing browser
            // type in array.
            var sendleAUExpressSpeed_daily = [];
            var stdSpeed_daily = []; // creating array for storing browser
            // type in array
            var totalUsage_daily = []; // creating array for storing browser
            // type in array.

            for (var i = 0; i < data3.length; i++) {
                month_year_daily.push(data3[i][0]);
                expSpeed_daily[data3[i][0]] = data3[i][1];
                sendleAUExpressSpeed_daily[data3[i][0]] = data3[i][2]
                stdSpeed_daily[data3[i][0]] = data3[i][3]; // creating
                totalUsage_daily[data3[i][0]] = data3[i][4]; //

            }
            var count3 = {}; // creating object for getting categories with
            // count
            month_year_daily.forEach(function (i) {
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
            Object.keys(expSpeed_daily).map(function (item, key) {
                series_data30.push(parseInt(expSpeed_daily[item]));
                series_data33.push(parseInt(sendleAUExpressSpeed_daily[item]));
                series_data31.push(parseInt(stdSpeed_daily[item]));
                series_data32.push(parseInt(totalUsage_daily[item]));
                categores35.push(item)
            });
            plotChartSpeedUsage(series_data30, series_data31, series_data32, categores35, series_data33, 'container_daily')
            return true;
        }

        function plotChartSpeedUsage(series_data1, series_data2, series_data3, categores, series_data8, chart_container) {
            // console.log(series_data)
            Highcharts
                .chart(
                    chart_container, {
                    chart: {
                        type: 'column'
                    },
                    xAxis: {
                        categories: categores,
                        crosshair: true,
                        style: {
                            fontWeight: 'bold',
                        }
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Total Usage'
                        },
                        stackLabels: {
                            enabled: true,
                            style: {
                                fontWeight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{point.x}</b><br/>',
                        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
                    },
                    plotOptions: {
                        column: {
                            stacking: 'normal',
                            dataLabels: {
                                enabled: true
                            }
                        }
                    },
                    series: [{
                        name: 'Express',
                        data: series_data1,
                        color: '#095c7b',
                        style: {
                            fontWeight: 'bold',
                        }
                    }, {
                        name: 'Sendle AU Express',
                        data: series_data8,
                        color: '#108372',
                        style: {
                            fontWeight: 'bold',
                        }
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
                    crosshair: true
                },
                yAxis: [{
                    title: {
                        text: 'MPEX Count'
                    }
                }, {
                    title: {
                        text: 'MPEX Count'
                    },
                    opposite: true
                }],
                plotOptions: {
                    column: {
                        colorByPoint: false
                    },
                    series: {
                        dataLabels: {
                            enabled: true,
                            align: 'right',
                            color: 'black',
                            x: -10
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
            var csv_monthly = val1.getValue({
                fieldId: 'custpage_table_csv_monthly',
            });
            var csv_weekly = val1.getValue({
                fieldId: 'custpage_table_csv_weekly',
            });
            var csv_daily = val1.getValue({
                fieldId: 'custpage_table_csv_daily',
            });
            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFileMonthly = new Blob([csv_monthly], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFileMonthly);
            var filename = 'Scans Monthly Usage_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFileWeekly = new Blob([csv_weekly], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFileWeekly);
            var filename = 'Scans Weekly Usage_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFileDaily = new Blob([csv_daily], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFileDaily);
            var filename = 'Scans Daily Usage_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);


        }


        /**
         * Create the CSV and store it in the hidden field 'custpage_table_csv' as a string.
         * @param {Array} ordersDataSet The `billsDataSet` created in `loadDatatable()`.
         */
        function saveCsvMonthly(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Month", "Express Count", "Sendle AU Express Count", "Standard Count",
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
                fieldId: 'custpage_table_csv_monthly',
                value: csv
            });


            return true;
        }

        function saveCsvWeekly(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Month", "Express Count", "Sendle AU Express Count", "Standard Count",
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
                fieldId: 'custpage_table_csv_weekly',
                value: csv
            });


            return true;
        }

        function saveCsvDaily(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Month", "Express Count", "Sendle AU Express Count", "Standard Count",
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
                fieldId: 'custpage_table_csv_daily',
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
