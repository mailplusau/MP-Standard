/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @Author: Ankith Ravindran <ankithravindran>
 * @Date:   2021-10-29T09:36:21+11:00
 * @Filename: mp_cl2.0_mpex_usage_per_month_v2.js
 * @Last modified by:   ankithravindran
 * @Last modified time: 2021-11-02T19:51:36+11:00
 */


define(
    ['N/email', 'N/runtime', 'N/search', 'N/record', 'N/http', 'N/log',
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
        var working_days_json = '{[]}';

        var no_of_working_days = [];
        var invoiceTypeServices = [];
        var invoiceTypeMPEX = [];
        var invoiceTypeNeoPost = [];

        var customerID;

        var total_revenue_per_state = [];

        var month;
        var weekdays_current_month;

        var total_months = 14;

        var today = new Date();
        var today_day_in_month = today.getDate();
        var today_day_in_week = today.getDay();
        var today_month = today.getMonth() + 1;
        var today_year = today.getFullYear();

        var source_manual = 0;
        var source_portal = 0;
        var source_bulk = 0;
        var source_shopify = 0;
        var total_usage = 0;

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
        } else if (role == 3) { // Administrator
            zee = 6; // test
        } else if (role == 1032) { // System Support
            zee = 425904; // test-AR
        }

        function isWeekday(year, month, day) {
            var day = new Date(year, month, day).getDay();
            return day != 0 && day != 6;
        }

        function getWeekdaysInMonth(month, year) {
            var days = daysInMonth(month, year);
            var weekdays = 0;
            for (var i = 0; i < days; i++) {
                if (isWeekday(year, month, i + 1))
                    weekdays++;
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
            $('.main-tabs-sections').addClass('hide');
            $('.loading_section').removeClass('hide');
        }

        function beforeSubmit() {
            // $('#customer_benchmark_preview').hide();
            // $('#customer_benchmark_preview').addClass('hide');
            $('.main-tabs-sections').addClass('hide');
            $('.loading_section').removeClass('hide');
        }

        function afterSubmit() {
            $('.date_filter_section').removeClass('hide');
            $('.period_dropdown_section').removeClass('hide');
            $('.main-tabs-sections').removeClass('hide');
            $('.loading_section').addClass('hide');

            // if (!isNullorEmpty($('#result_customer_benchmark').val())) {
            // $('#customer_benchmark_preview').removeClass('hide');
            // $('#customer_benchmark_preview').show();
            // }
            //
            // $('#result_customer_benchmark').on('change', function() {
            // $('#customer_benchmark_preview').removeClass('hide');
            // $('#customer_benchmark_preview').show();
            // });
            //
            // $('#customer_benchmark_preview').removeClass('hide');
            // $('#customer_benchmark_preview').show();
        }

        function pageInit() {
            // selectRangeOptions();

            $("#NS_MENU_ID0-item0").css("background-color", "#CFE0CE");
            $("#NS_MENU_ID0-item0 a").css("background-color", "#CFE0CE");
            $("#body").css("background-color", "#CFE0CE");

            previewDataSet = [];
            preview_set = [];

            customersDataSet = [];
            customer_set = [];

            zeesDataSet = [];
            zee_set = [];

            sourceDataSet = [];
            source_set = [];

            prodTypeDataSet = [];
            prod_type_set = [];

            if (!isNullorEmpty($('#period_dropdown option:selected').val())) {
                selectDate();
            }
            $('#period_dropdown').change(function () {
                selectDate();
            });

            $('#invoice_type_dropdown').change(
                function () {
                    invoiceType = $(
                        '#invoice_type_dropdown option:selected')
                        .val();
                    // selectInvoiceType();
                });

            /**
             * Submit Button Function
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

                previewDataSet = [];
                preview_set = [];

                customersDataSet = [];
                customer_set = [];

                zeesDataSet = [];
                zee_set = [];

                sourceDataSet = [];
                source_set = [];

                prodTypeDataSet = [];
                prod_type_set = [];

                beforeSubmit();
                submitSearch();

                return true;
            });

            /**
             * Auto Load Submit Search and Load Results on Page
             * Initialisation
             */
            pageLoad();
            submitSearch();
            var dataTable = $('#mpexusage-preview').DataTable();
            var dataTable2 = $('#mpexusage-customer').DataTable();

            var today = new Date();
            var today_year = today.getFullYear();
            var today_month = today.getMonth();
            var today_day = today.getDate();

            /**
             * Click for Instructions Section Collapse
             */
            $('.collapse').on('shown.bs.collapse', function () {
                $(".range_filter_section_top").css("padding-top", "500px");
            })
            $('.collapse').on('hide.bs.collapse', function () {
                $(".range_filter_section_top").css("padding-top", "0px");
            })
        }

        function submitSearch() {
            beforeSubmit();

            zee = $('#zee_dropdown option:selected').val();
            customerID = $('#cust_dropdown option:selected').val();
            var date_from = $('#date_from').val();
            var date_to = $('#date_to').val();
            date_from = dateISOToNetsuite(date_from);
            date_to = dateISOToNetsuite(date_to);

            if (!isNullorEmpty(zee)) {
                var zeeRecord = record.load({
                    type: record.Type.PARTNER,
                    id: zee
                });

                var zeeLocation = zeeRecord.getValue({
                    fieldId: 'location'
                });


                var ausPublicHolidayResults = search.load({
                    type: 'customrecord_australia_public_holidays',
                    id: 'customsearch3611'
                });

                console.log('zeeLocation ' + zeeLocation)


                ausPublicHolidayResults.filters.push(search.createFilter({
                    name: 'custrecord_public_holidays_state',
                    join: null,
                    operator: search.Operator.ANYOF,
                    values: zeeLocation
                }));


                var count = 0;

                ausPublicHolidayResults.run().each(function (ausPublicHolidayResultsSet) {
                    var working_days = ausPublicHolidayResultsSet.getValue({
                        name: 'custrecord_no_working_days'
                    });
                    var state = ausPublicHolidayResultsSet.getText({
                        name: 'custrecord_public_holidays_state'
                    });
                    var tranDate = ausPublicHolidayResultsSet.getValue({
                        name: 'name'
                    });

                    no_of_working_days[tranDate] = parseInt(working_days);
                    count++;
                    return true;
                });
            } else {
                var ausPublicHolidayResults = search.load({
                    type: 'customrecord_australia_public_holidays',
                    id: 'customsearch3611'
                });

                var count = 0;
                var old_state;

                working_days_json = '{"data":['

                ausPublicHolidayResults.run().each(function (ausPublicHolidayResultsSet) {
                    var working_days = ausPublicHolidayResultsSet.getValue({
                        name: 'custrecord_no_working_days'
                    });
                    var state = ausPublicHolidayResultsSet.getText({
                        name: 'custrecord_public_holidays_state'
                    });
                    var tranDate = ausPublicHolidayResultsSet.getValue({
                        name: 'name'
                    });

                    if (isNullorEmpty(old_state)) {
                        working_days_json += '{"state":"' + state + '","dates":['
                        working_days_json += '{"date":"' + tranDate + '",'
                        working_days_json += '"days":"' + working_days + '"},'
                    } else if (state == old_state) {
                        working_days_json += '{"date":"' + tranDate + '",'
                        working_days_json += '"days":"' + working_days + '"},'
                    } else if (state != old_state) {
                        working_days_json = working_days_json.substring(0, working_days_json.length -
                            "1");
                        working_days_json += ']},';

                        working_days_json += '{"state":"' + state + '","dates":['
                        working_days_json += '{"date":"' + tranDate + '",'
                        working_days_json += '"days":"' + working_days + '"},'
                    }

                    old_state = state;
                    count++;
                    return true;
                });

                if (count > 0) {
                    working_days_json = working_days_json.substring(0, working_days_json.length -
                        "1");

                    working_days_json += ']}]}';
                } else {

                    working_days_json += ']}';
                }

                console.log('working_days_json ' + working_days_json);
            }

            console.log('Load DataTable Params: ' + date_from + ' | ' +
                date_to + ' | ' + zee);

            LoadSearchResults(date_from, date_to, zee, null, customerID);

            console.log('Loaded Results');

            afterSubmit();
        }

        function expActWeeklyUsage() {
            var today = new Date();
            var today_day_in_month = today.getDate();
            var today_day_in_week = today.getDay();
            var today_month = today.getMonth() + 1;
            var today_year = today.getFullYear();

            var todayString = today_year + '-' + today_month + '-' + today_day_in_month;
            var url =
                'https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1378&deploy=1'
            // window.location.href = url;
            window.open(
                url,
                '_blank' // <- This is what makes it open in a new window.
            );
        }

        function LoadSearchResults(date_from, date_to, zee_id, dataTable, custID) {
            // MPEX - MP Standard - Usage Report - Last year to date (per month)
            var mpexUsageResults = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch_mp_std_usage_per_month'
            });

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

            mpexUsageResults.run().each(function (mpexUsageSet) {

                var dateUsed = mpexUsageSet.getValue({
                    name: 'custrecord_cust_date_stock_used',
                    summary: 'GROUP'
                });
                var zeeCount = mpexUsageSet.getValue({
                    name: 'custrecord_cust_prod_stock_zee',
                    summary: 'COUNT'
                });

                var customerCount = mpexUsageSet.getValue({
                    name: 'internalid',
                    join: 'CUSTRECORD_CUST_PROD_STOCK_CUSTOMER',
                    summary: 'COUNT'
                });

                var mpexUsage = mpexUsageSet.getValue({
                    name: 'name',
                    summary: 'COUNT'
                });

                preview_set.push({
                    dateUsed: dateUsed,
                    zeeCount: zeeCount,
                    customerCount: customerCount,
                    mpexUsage: mpexUsage
                });

                return true;
            });
            console.log('preview_set');
            console.log(preview_set);

            // MP Standard - Total Customer Usage
            var totalCustomerUsageResults = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch_mp_std_total_cust_usage'
            });

            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                totalCustomerUsageResults.filters.push(search
                    .createFilter({
                        name: 'custrecord_cust_date_stock_used',
                        join: null,
                        operator: search.Operator.ONORAFTER,
                        values: date_from
                    }));
                totalCustomerUsageResults.filters.push(search
                    .createFilter({
                        name: 'custrecord_cust_date_stock_used',
                        join: null,
                        operator: search.Operator.ONORBEFORE,
                        values: date_to
                    }));
            }

            if (!isNullorEmpty(zee_id)) {
                totalCustomerUsageResults.filters.push(search
                    .createFilter({
                        name: 'custrecord_cust_prod_stock_zee',
                        join: null,
                        operator: search.Operator.IS,
                        values: zee_id
                    }));
            }

            if (!isNullorEmpty(custID)) {
                totalCustomerUsageResults.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            totalCustomerUsageResults
                .run()
                .each(
                    function (totalCustomerUsageSet) {

                        var zeeText = totalCustomerUsageSet
                            .getText({
                                name: 'custrecord_cust_prod_stock_zee',
                                summary: 'GROUP'
                            });

                        var customerID = parseInt(totalCustomerUsageSet
                            .getValue({
                                name: 'internalid',
                                join: 'CUSTRECORD_CUST_PROD_STOCK_CUSTOMER',
                                summary: 'GROUP'
                            }));

                        var customerText = totalCustomerUsageSet
                            .getText({
                                name: 'custrecord_cust_prod_stock_customer',
                                summary: 'GROUP'
                            });

                        var mpexUsage = totalCustomerUsageSet
                            .getValue({
                                name: 'name',
                                summary: 'COUNT'
                            });

                        customer_set.push({
                            zeeText: zeeText,
                            customerID: customerID,
                            customerText: customerText,
                            mpexUsage: mpexUsage
                        });

                        return true;
                    });
            console.log('customer_set');
            console.log(customer_set);

            customer_set.sort(function (a, b) {
                return a.mpexUsage - b.mpexUsage;
            });

            console.log('sorted customer_set');
            console.log(customer_set);

            // MP Standard - Total Zees Usage
            var totalZeesUsageResults = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch_mp_std_total_zee_usage'
            });

            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                totalZeesUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                totalZeesUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                totalZeesUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                totalZeesUsageResults.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            totalZeesUsageResults.run().each(function (totalZeeUsageSet) {

                var zeeText = totalZeeUsageSet.getText({
                    name: 'custrecord_cust_prod_stock_zee',
                    summary: 'GROUP'
                });

                var zeeID = totalZeeUsageSet.getValue({
                    name: 'custrecord_cust_prod_stock_zee',
                    summary: 'GROUP'
                });

                var mpexUsage = totalZeeUsageSet.getValue({
                    name: 'name',
                    summary: 'COUNT'
                });

                zee_set.push({
                    zeeText: zeeText,
                    zeeID: zeeID,
                    mpexUsage: mpexUsage
                });

                return true;
            });
            console.log('zee_set');
            console.log(zee_set);

            // MP Standard - Usage Report - Source/Month
            var mpexSourceUsageResults = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch_mp_std_usage_source_month'
            });

            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpexSourceUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpexSourceUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpexSourceUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpexSourceUsageResults.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            var old_date = null;
            var count = 0;

            mpexSourceUsageResults
                .run()
                .each(
                    function (mpexSourceUsageSet) {

                        var dateUsed = mpexSourceUsageSet
                            .getValue({
                                name: 'custrecord_cust_date_stock_used',
                                summary: 'GROUP'
                            });

                        var sourceId = parseInt(mpexSourceUsageSet
                            .getValue({
                                name: 'custrecord_barcode_source',
                                summary: 'GROUP'
                            }));

                        var sourceText = mpexSourceUsageSet
                            .getText({
                                name: 'custrecord_barcode_source',
                                summary: 'GROUP'
                            });

                        var mpexUsage = parseInt(mpexSourceUsageSet
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

                            total_usage = source_manual +
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
                            total_usage = source_manual +
                                source_shopify +
                                source_portal + source_bulk;
                        } else if (old_date != null &&
                            old_date != dateUsed) {
                            source_set.push({
                                dateUsed: old_date,
                                source_manual: source_manual,
                                source_shopify: source_shopify,
                                source_portal: source_portal,
                                source_bulk: source_bulk,
                                total_usage: total_usage
                            });

                            source_manual = 0;
                            source_shopify = 0;
                            source_portal = 0;
                            source_bulk = 0;
                            total_usage = 0;

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
                            total_usage = source_manual +
                                source_shopify +
                                source_portal + source_bulk;
                        }

                        old_date = dateUsed;
                        count++;
                        return true;
                    });

            if (count > 0) {
                source_set.push({
                    dateUsed: old_date,
                    source_manual: source_manual,
                    source_shopify: source_shopify,
                    source_portal: source_portal,
                    source_bulk: source_bulk,
                    total_usage: total_usage
                });
            }

            console.log('source_set');
            console.log(source_set);

            // MP Standard - Prod Type Usage - per month
            var mpexProdTypeUsageResults = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch_mp_std_prod_type_usage_mont'
            });


            if (!isNullorEmpty(date_from) && !isNullorEmpty(date_to)) {
                mpexProdTypeUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORAFTER,
                    values: date_from
                }));
                mpexProdTypeUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_date_stock_used',
                    join: null,
                    operator: search.Operator.ONORBEFORE,
                    values: date_to
                }));
            }

            if (!isNullorEmpty(zee_id)) {
                mpexProdTypeUsageResults.filters.push(search.createFilter({
                    name: 'custrecord_cust_prod_stock_zee',
                    join: null,
                    operator: search.Operator.IS,
                    values: zee_id
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpexProdTypeUsageResults.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            if (!isNullorEmpty(custID)) {
                mpexProdTypeUsageResults.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_cust_prod_stock_customer',
                    operator: search.Operator.ANYOF,
                    values: parseInt(custID)
                }));
            }

            mpexProdTypeUsageResults
                .run()
                .each(
                    function (mpexProdTypeUsageSet) {

                        var dateUsed = mpexProdTypeUsageSet
                            .getValue({
                                name: 'custrecord_cust_date_stock_used',
                                summary: 'GROUP'
                            });
                        var zeeCount = mpexProdTypeUsageSet
                            .getValue({
                                name: 'custrecord_cust_prod_stock_zee',
                                summary: 'COUNT'
                            });

                        var productType = mpexProdTypeUsageSet
                            .getValue({
                                name: 'custrecord_cust_stock_prod_name',
                                summary: 'GROUP'
                            });

                        var productTypeText = mpexProdTypeUsageSet
                            .getText({
                                name: 'custrecord_cust_stock_prod_name',
                                summary: 'GROUP'
                            });

                        var customerCount = mpexProdTypeUsageSet
                            .getValue({
                                name: 'internalid',
                                join: 'CUSTRECORD_CUST_PROD_STOCK_CUSTOMER',
                                summary: 'COUNT'
                            });

                        var mpexUsage = mpexProdTypeUsageSet
                            .getValue({
                                name: 'name',
                                summary: 'COUNT'
                            });

                        prod_type_set.push({
                            dateUsed: dateUsed,
                            zeeCount: zeeCount,
                            customerCount: customerCount,
                            mpexUsage: mpexUsage,
                            productType: productType,
                            productTypeText: productTypeText
                        });

                        return true;
                    });

            loadDatatable(preview_set, customer_set, zee_set, source_set,
                prod_type_set);
            preview_set = [];
            customer_set = [];

        }

        function loadDatatable(preview_rows, customer_rows, zee_rows,
            source_rows, prod_type_rows) {
            // $('#result_debt').empty();
            customersDataSet = [];
            previewDataSet = [];
            zeesDataSet = [];
            sourceDataSet = [];
            csvPreviewSet = [];
            csvCustomerSet = [];
            csvZeeSet = [];

            if (!isNullorEmpty(preview_rows)) {
                preview_rows
                    .forEach(function (preview_row, index) {

                        var month = preview_row.dateUsed;
                        var splitMonth = month.split('-');

                        var firstDay = new Date(splitMonth[0], (splitMonth[1]), 1).getDate();
                        var lastDay = new Date(splitMonth[0], (splitMonth[1]), 0).getDate();

                        if (firstDay < 10) {
                            firstDay = '0' + firstDay;
                        }

                        // var startDate = firstDay + '/' +
                        // splitMonth[1] + '/' + splitMonth[0]
                        var startDate = splitMonth[0] + '-' +
                            splitMonth[1] + '-' + firstDay;
                        // var lastDate = lastDay + '/' + splitMonth[1]
                        // + '/' + splitMonth[0]
                        var lastDate = splitMonth[0] + '-' +
                            splitMonth[1] + '-' + lastDay

                        var detailedInvoiceURLMonth =
                            '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1271&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (per week)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (per day)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1278&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (Customer List)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1280&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (Franchisee List)</a>';

                        previewDataSet.push([detailedInvoiceURLMonth,
                            month, preview_row.mpexUsage,
                            preview_row.customerCount,
                            preview_row.zeeCount
                        ]);
                        csvPreviewSet.push([month,
                            preview_row.mpexUsage,
                            preview_row.customerCount,
                            preview_row.zeeCount
                        ]);

                    });
            }

            console.log('previewDataSet');
            console.log(previewDataSet);

            var dataTable = $('#mpexusage-preview').DataTable({
                destroy: true,
                data: previewDataSet,
                pageLength: 1000,
                order: [
                    [1, 'asc']
                ],
                columns: [{
                    title: 'LINK'
                }, {
                    title: 'Period'
                }, {
                    title: 'Usage'
                }, {
                    title: 'Customers'
                }, {
                    title: 'Franchisees'
                }],
                columnDefs: [{
                    targets: [1, 2, 3, 4],
                    className: 'bolded'
                }]

            });
            // dataTable.clear();
            // dataTable.rows.add(previewDataSet);
            // dataTable.draw();

            saveCsv(previewDataSet);

            var data = dataTable.rows().data();

            var month_year = []; // creating array for storing browser
            // type in array.
            var mpex_usage = []; // creating array for storing browser
            // type in array.
            var customer_count = []; // creating array for storing
            // browser type in array.
            var zee_count = []; // creating array for storing browser type
            // in array.

            for (var i = 0; i < data.length; i++) {
                month_year.push(data[i][1]);
                mpex_usage[data[i][1]] = data[i][2]
                customer_count[data[i][1]] = data[i][3]
                zee_count[data[i][1]] = data[i][4]

            }
            var count = {}; // creating object for getting categories with
            // count
            month_year.forEach(function (i) {
                count[i] = (count[i] || 0) + 1;
            });

            var series_data1 = []; // creating empty array for highcharts
            // series data
            var series_data2 = []; // creating empty array for highcharts
            // series data
            var series_data3 = []; // creating empty array for highcharts
            // series data
            var categores1 = []; // creating empty array for highcharts
            // categories
            Object.keys(mpex_usage).map(function (item, key) {
                series_data1.push(parseInt(mpex_usage[item]));
                series_data2.push(parseInt(customer_count[item]));
                series_data3.push(parseInt(zee_count[item]));
                categores1.push(item)
            });
            plotChartPreview(series_data1, series_data2, categores1,
                series_data3)

            if (!isNullorEmpty(customer_rows)) {
                customer_rows
                    .forEach(function (customer_row, index) {

                        var links =
                            '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1271&deploy=1&custid=' +
                            customer_row.customerID +
                            '&zee=' +
                            zee +
                            '&start_date=&last_date=" target=_blank>VIEW (per week)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&custid=' +
                            customer_row.customerID +
                            '&zee=' +
                            zee +
                            '&start_date=&last_date=" target=_blank>VIEW (per day)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1276&deploy=1&custid=' +
                            customer_row.customerID +
                            '&zee=' +
                            zee +
                            '&start_date=&last_date=" target=_blank>VIEW (Product Types)</a>';

                        customersDataSet.push([links,
                            customer_row.customerID,
                            customer_row.customerText,
                            customer_row.zeeText,
                            customer_row.mpexUsage
                        ]);
                        csvCustomerSet.push([customer_row.customerID,
                        customer_row.customerText,
                        customer_row.zeeText,
                        customer_row.mpexUsage
                        ]);

                    });
            }

            var dataTable2 = $('#mpexusage-customer').DataTable({
                destroy: true,
                data: customersDataSet,
                pageLength: 1000,
                order: [
                    [4, 'desc']
                ],
                columns: [{
                    title: 'LINK'
                }, {
                    title: 'Internal ID'
                }, {
                    title: 'Customer'
                }, {
                    title: 'Franchisee'
                }, {
                    title: 'Usage'
                }],
                columnDefs: [{
                    targets: [1, 2, 3, 4],
                    className: 'bolded'
                }]

            });

            // dataTable.clear();
            // dataTable.rows.add(customersDataSet);
            // dataTable.draw();

            saveCsv(csvCustomerSet);

            var data2 = dataTable2.rows().data();

            console.log('data2');
            console.log(data2)

            var mpex_usage = []; // creating array for storing browser
            // type in array.
            var customer_id = []; // creating array for storing browser
            // type in array.
            var customer_name = []; // creating array for storing browser
            // type in array.
            var zee_name = []; // creating array for storing browser type
            // in array.

            for (var i = 0; i < data2.length; i++) {
                mpex_usage[i] = data2[i][4]
                customer_name[i] = data2[i][2]
                zee_name[i] = data2[i][3]

            }

            var series_data4 = []; // creating empty array for highcharts
            // series data
            var categores2 = []; // creating empty array for highcharts
            // categories
            Object.keys(mpex_usage).map(function (item, key) {

                // if (mpex_usage[item] > 100) {
                series_data4.push(parseInt(mpex_usage[item]));
                categores2.push(customer_name[item])
                // }
            });

            series_data4.sort(function (a, b) {
                return b - a;
            });

            plotChartCustomer(series_data4, categores2)

            if (!isNullorEmpty(zee_rows)) {
                zee_rows
                    .forEach(function (zee_row, index) {

                        var links =
                            '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1271&deploy=1&zee=' +
                            zee_row.zeeID +
                            '&start_date=&last_date=" target=_blank>VIEW (per week)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                            zee_row.zeeID +
                            '&start_date=&last_date=" target=_blank>VIEW (per day)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1276&deploy=1&zee=' +
                            zee_row.zeeID +
                            '&start_date=&last_date=" target=_blank>VIEW (Product Types)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1278&deploy=1&zee=' +
                            zee_row.zeeID +
                            '&start_date=&last_date=" target=_blank>VIEW (Customer List)</a>';

                        zeesDataSet.push([links,
                            parseInt(zee_row.zeeID),
                            zee_row.zeeText,
                            parseInt(zee_row.mpexUsage)
                        ]);
                        csvZeeSet.push([zee_row.zeeID, zee_row.zeeText,
                        zee_row.mpexUsage
                        ]);

                    });
            }

            var dataTable3 = $('#mpexusage-zee').DataTable({
                destroy: true,
                data: zeesDataSet,
                pageLength: 1000,
                order: [
                    [3, 'desc']
                ],
                columns: [{
                    title: 'LINK'
                }, {
                    title: 'Internal ID'
                }, {
                    title: 'Franchisee'
                }, {
                    title: 'Usage'
                }],
                columnDefs: [{
                    targets: [1, 2, 3],
                    className: 'bolded'
                }]

            });

            saveCsv(zeesDataSet);

            var data3 = dataTable3.rows().data();

            var mpex_usage = []; // creating array for storing browser
            // type in array.
            var zee_name = []; // creating array for storing browser type
            // in array.

            for (var i = 0; i < data3.length; i++) {
                mpex_usage[i] = parseInt(data3[i][3]);
                zee_name[i] = data3[i][2];

            }

            var series_data5 = []; // creating empty array for highcharts
            // series data
            var categores3 = []; // creating empty array for highcharts
            // categories
            Object.keys(mpex_usage).map(function (item, key) {

                // console.log('USAGE: ' + mpex_usage[item]);
                series_data5.push(parseInt(mpex_usage[item]));
                categores3.push(zee_name[item])

            });

            plotChartZee(series_data5, categores3);

            if (!isNullorEmpty(source_rows)) {
                source_rows
                    .forEach(function (source_row, index) {

                        var month = source_row.dateUsed;
                        var splitMonth = month.split('-');

                        var firstDay = new Date(splitMonth[0], (splitMonth[1]), 1).getDate();
                        var lastDay = new Date(splitMonth[0], (splitMonth[1]), 0).getDate();

                        if (firstDay < 10) {
                            firstDay = '0' + firstDay;
                        }

                        // var startDate = firstDay + '/' +
                        // splitMonth[1] + '/' + splitMonth[0]
                        var startDate = splitMonth[0] + '-' +
                            splitMonth[1] + '-' + firstDay;
                        // var lastDate = lastDay + '/' + splitMonth[1]
                        // + '/' + splitMonth[0]
                        var lastDate = splitMonth[0] + '-' +
                            splitMonth[1] + '-' + lastDay

                        var detailedInvoiceURLMonth =
                            '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1285&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (per week)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (per day)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1276&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (Product Types)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1290&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (Customer & Franchisee Count)</a>';

                        sourceDataSet.push([detailedInvoiceURLMonth,
                            month, source_row.source_manual,
                            source_row.source_shopify,
                            source_row.source_portal,
                            source_row.source_bulk,
                            source_row.total_usage
                        ]);
                        // csvSet.push([month, source_row.source_manual,
                        // source_row.source_shopify,
                        // source_row.source_portal,source_row.source_bulk,
                        // source_row.total_usage]);

                    });
            }

            var dataTable4 = $('#mpexusage-source').DataTable({
                destroy: true,
                data: sourceDataSet,
                pageLength: 1000,
                order: [
                    [1, 'asc']
                ],
                columns: [{
                    title: 'LINK'
                }, {
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
                    targets: [1, 2, 3, 4, 5, 6],
                    className: 'bolded'
                }]

            });

            var data4 = dataTable4.rows().data();

            var month_year = []; // creating array for storing browser
            // type in array.
            var sourceManual = []; // creating array for storing browser
            // type in array.
            var sourcePortal = []; // creating array for storing browser
            // type in array.
            var sourceBulk = []; // creating array for storing browser
            // type in array.
            var sourceShopify = []; // creating array for storing browser
            // type in array.
            var totalUsage = []; // creating array for storing browser
            // type in array.

            for (var i = 0; i < data4.length; i++) {
                month_year.push(data4[i][1]);
                sourceManual[data4[i][1]] = data4[i][2]; // creating
                // array for
                // storing
                // browser type
                // in array.
                sourcePortal[data4[i][1]] = data4[i][4]; // creating
                // array for
                // storing
                // browser type
                // in array.
                sourceBulk[data4[i][1]] = data4[i][5]; // creating array
                // for storing
                // browser type in
                // array.
                sourceShopify[data4[i][1]] = data4[i][3]; //
                totalUsage[data4[i][1]] = data4[i][6]; //

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
            var series_data8 = []; // creating empty array for highcharts
            // series data
            var series_data9 = []; // creating empty array for highcharts
            // series data
            var series_data10 = []; // creating empty array for highcharts
            // series data
            var categores4 = []; // creating empty array for highcharts
            // categories
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

            prodTypeDataSet = [];
            csvSet = [];
            if (!isNullorEmpty(prod_type_rows)) {
                prod_type_rows
                    .forEach(function (prod_type_row, index) {

                        var month = prod_type_row.dateUsed;
                        var splitMonth = month.split('-');

                        var firstDay = new Date(splitMonth[0], (splitMonth[1]), 1).getDate();
                        var lastDay = new Date(splitMonth[0], (splitMonth[1]), 0).getDate();

                        if (firstDay < 10) {
                            firstDay = '0' + firstDay;
                        }

                        // var startDate = firstDay + '/' +
                        // splitMonth[1] + '/' + splitMonth[0]
                        var startDate = splitMonth[0] + '-' +
                            splitMonth[1] + '-' + firstDay;
                        // var lastDate = lastDay + '/' + splitMonth[1]
                        // + '/' + splitMonth[0]
                        var lastDate = splitMonth[0] + '-' +
                            splitMonth[1] + '-' + lastDay

                        var detailedInvoiceURLMonth =
                            '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1271&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (per week)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                            zee +
                            '&start_date=' +
                            startDate +
                            '&last_date=' +
                            lastDate +
                            '" target=_blank>VIEW (per day)</a>';

                        prodTypeDataSet.push([detailedInvoiceURLMonth,
                            month, prod_type_row.productTypeText,
                            prod_type_row.mpexUsage,
                            prod_type_row.customerCount,
                            prod_type_row.zeeCount
                        ]);
                        // csvSet.push([month,
                        // prod_type_row.productTypeText,
                        // prod_type_row.mpexUsage,
                        // prod_type_row.customerCount,
                        // prod_type_row.zeeCount]);

                    });
            }

            var dataTable5 = $('#mpexusage-type').DataTable({
                destroy: true,
                data: prodTypeDataSet,
                pageLength: 1000,
                order: [
                    [0, 'asc']
                ],
                columns: [{
                    title: 'LINK'
                }, {
                    title: 'Period'
                }, {
                    title: 'Product'
                }, {
                    title: 'Usage'
                }, {
                    title: 'Customers'
                }, {
                    title: 'Franchisees'
                }],
                columnDefs: [{
                    targets: [1, 2, 3, 4],
                    className: 'bolded'
                }]

            });
            dataTable5.clear();
            dataTable5.rows.add(prodTypeDataSet);
            dataTable5.draw();

            saveCsv(csvSet);

            var data5 = dataTable5.rows().data();

            var month_year = []; // creating array for storing browser
            // type in array.
            var mpex_usage = []; // creating array for storing browser
            // type in array.
            var customer_count = []; // creating array for storing
            // browser type in array.
            var zee_count = []; // creating array for storing browser type
            // in array.
            var prod_type = []; // creating array for storing browser type
            // in array.

            for (var i = 0; i < data5.length; i++) {
                prod_type.push(data5[i][2]);
                mpex_usage[data5[i][2]] = data5[i][3]
                customer_count[data5[i][2]] = data5[i][4]
                zee_count[data5[i][2]] = data5[i][5]

            }
            var count = {}; // creating object for getting categories with
            // count
            prod_type.forEach(function (i) {
                count[i] = (count[i] || 0) + 1;
            });

            var series_data11 = []; // creating empty array for highcharts
            // series data
            var series_data12 = []; // creating empty array for highcharts
            // series data
            var series_data13 = []; // creating empty array for highcharts
            // series data
            var categores5 = []; // creating empty array for highcharts
            // categories
            Object.keys(mpex_usage).map(function (item, key) {
                console.log(item);
                series_data11.push(parseInt(mpex_usage[item]));
                series_data12.push(parseInt(customer_count[item]));
                series_data13.push(parseInt(zee_count[item]));
                categores5.push(item)
            });
            plotChartType(series_data11, series_data12, categores5,
                series_data13)

            return true;
        }

        function plotChartType(series_data, series_data2, categores,
            series_data3) {
            // console.log(series_data)
            Highcharts.chart('container5', {
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
                    }
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

        function plotChartSource(series_data1, series_data2, series_data3,
            series_data4, series_data5, categores) {
            // console.log(series_data)
            Highcharts
                .chart(
                    'container4', {
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
                            text: 'Total MPEX Usage'
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

        function plotChartPreview(series_data, series_data2, categores,
            series_data3) {
            // console.log(series_data)
            Highcharts.chart('container', {
                chart: {
                    height: (6 / 16 * 100) + '%',
                    zoomType: 'xy'
                },
                xAxis: {
                    categories: categores,
                    crosshair: true,
                    style: {
                        fontWeight: 'bold',
                    }
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

        function plotChartCustomer(series_data, categores) {
            // console.log(series_data)
            Highcharts
                .chart(
                    'container2', {
                    chart: {
                        height: (6 / 16 * 100) + '%',
                        zoomType: 'xy',
                        type: 'column',
                        events: {
                            load: function () {
                                var points = this.series[0].points,
                                    chart = this,
                                    newPoints = [];
                                Highcharts
                                    .each(
                                        points,
                                        function (point,
                                            i) {
                                            point
                                                .update({
                                                    name: categores[i]
                                                },
                                                    false);
                                            newPoints
                                                .push({
                                                    x: point.x,
                                                    y: point.y,
                                                    name: point.name
                                                });
                                        });
                                chart.redraw();
                                var filteredArray = newPoints
                                    .slice(0, 25);

                                chart.series[0].setData(
                                    filteredArray, true,
                                    false, false);

                                // Usage Dropdown
                                $('#top_range')
                                    .change(
                                        function () {
                                            console
                                                .log('Inside Usage Dropdown: ');

                                            var val = $(
                                                '#top_range option:selected')
                                                .val();
                                            console
                                                .log('dropdown val: ' +
                                                    val);
                                            if (val == 1) {
                                                var filteredArray = newPoints
                                                    .slice(
                                                        0,
                                                        25);

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);
                                            } else if (val == 2) {
                                                var filteredArray = newPoints
                                                    .slice(
                                                        0,
                                                        50);

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);

                                            } else if (val == 3) {
                                                var filteredArray = newPoints
                                                    .slice(
                                                        0,
                                                        75);

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);
                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);

                                            } else if (val == 4) {
                                                var filteredArray = newPoints
                                                    .slice(
                                                        0,
                                                        100);

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);

                                            } else if (val == 0) {

                                                chart.series[0]
                                                    .setData(
                                                        newPoints,
                                                        true,
                                                        false,
                                                        false);

                                            }

                                        });

                                $('#bottom_range')
                                    .change(
                                        function () {
                                            console
                                                .log('Inside Usage Dropdown: ');

                                            var val = $(
                                                '#bottom_range option:selected')
                                                .val();
                                            $(
                                                '#top_range')
                                                .val(
                                                    0);
                                            console
                                                .log('dropdown val: ' +
                                                    val);
                                            if (val == 1) {

                                                var filteredArray = newPoints
                                                    .slice(Math
                                                        .max(
                                                            newPoints.length - 25,
                                                            0))

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);
                                            } else if (val == 2) {
                                                var filteredArray = newPoints
                                                    .slice(Math
                                                        .max(
                                                            newPoints.length - 50,
                                                            0))

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);

                                            } else if (val == 3) {
                                                var filteredArray = newPoints
                                                    .slice(Math
                                                        .max(
                                                            newPoints.length - 75,
                                                            0))

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);
                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);

                                            } else if (val == 4) {
                                                var filteredArray = newPoints
                                                    .slice(Math
                                                        .max(
                                                            newPoints.length - 100,
                                                            0))

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);

                                                chart.series[0]
                                                    .setData(
                                                        filteredArray,
                                                        true,
                                                        false,
                                                        false);

                                            } else if (val == 0) {

                                                chart.series[0]
                                                    .setData(
                                                        newPoints,
                                                        true,
                                                        false,
                                                        false);

                                            }

                                        });
                            }
                        }
                    },
                    legend: {
                        enabled: true,
                        reversed: false,
                        align: 'center',
                        verticalAlign: 'top',
                    },
                    xAxis: {
                        categories: categores,
                        style: {
                            fontWeight: 'bold',
                        }
                    },
                    plotOptions: {
                        column: {
                            colorByPoint: false
                        },
                        series: {
                            dataLabels: {
                                enabled: true,
                                align: 'right',
                                color: 'black',
                                // x: -10
                            },
                            pointPadding: 0.1,
                            groupPadding: 0,
                            turboThreshold: 0
                        }
                    },
                    series: [{
                        name: 'Customers',
                        data: series_data,
                        color: '#108372',
                        style: {
                            fontWeight: 'bold',
                        }
                    }]
                });
        }

        function plotChartZee(series_data, categores) {
            // console.log(series_data)
            Highcharts
                .chart(
                    'container3', {
                    chart: {
                        height: (6 / 16 * 100) + '%',
                        zoomType: 'xy',
                        events: {
                            load: function () {
                                var points = this.series[0].points,
                                    chart = this,
                                    newPoints = [];
                                Highcharts
                                    .each(
                                        points,
                                        function (point,
                                            i) {
                                            point
                                                .update({
                                                    name: categores[i]
                                                },
                                                    false);
                                            newPoints
                                                .push({
                                                    x: point.x,
                                                    y: point.y,
                                                    name: point.name
                                                });
                                        });
                                chart.redraw();
                                newPoints.sort(function (a, b) {
                                    return b.y - a.y
                                });

                                Highcharts.each(newPoints,
                                    function (el, i) {
                                        el.x = i;
                                    });

                                chart.series[0].setData(
                                    newPoints, true, false,
                                    false);

                                // Sorting min - max
                                $('#sort_min_max_zee')
                                    .on(
                                        'click',
                                        function () {

                                            newPoints
                                                .sort(function (
                                                    a,
                                                    b) {
                                                    return a.y -
                                                        b.y
                                                });

                                            Highcharts
                                                .each(
                                                    newPoints,
                                                    function (
                                                        el,
                                                        i) {
                                                        el.x = i;
                                                    });

                                            chart.series[0]
                                                .setData(
                                                    newPoints,
                                                    true,
                                                    false,
                                                    false);
                                        });

                                // Sorting max - min
                                $('#sort_max_min_zee')
                                    .on(
                                        'click',
                                        function () {
                                            newPoints
                                                .sort(function (
                                                    a,
                                                    b) {
                                                    return b.y -
                                                        a.y
                                                });

                                            newPoints
                                                .forEach(function (
                                                    el,
                                                    i) {
                                                    el.x = i;
                                                });

                                            chart.series[0]
                                                .setData(
                                                    newPoints,
                                                    true,
                                                    false,
                                                    false);
                                        });
                            }
                        }
                    },
                    xAxis: {
                        categories: categores,
                        // crosshair: true,
                        style: {
                            fontWeight: 'bold',
                        }
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
                                // x: -10
                            },
                            pointPadding: 0.1,
                            groupPadding: 0,
                            turboThreshold: 0
                        }
                    },
                    series: [{
                        name: 'Franchisees',
                        type: 'column',
                        // yAxis: 1,
                        data: series_data,
                        color: '#108372',
                        style: {
                            fontWeight: 'bold',
                        },
                        dataSorting: {
                            enabled: true,
                            sortKey: 'value'
                        },
                    }]
                });
        }

        /**
         * Load the string stored in the hidden field 'custpage_table_csv'.
         * Converts it to a CSV file. Creates a hidden link to download the
         * file and triggers the click of the link.
         */
        function downloadCsv() {
            var today = new Date();
            today = formatDate(today);
            var val1 = currentRecord.get();
            var csv = val1.getValue({
                fieldId: 'custpage_table_csv',
            });
            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFile = new Blob([csv], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFile);
            var filename = 'MPEX Monthly Usage_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

        }

        function saveRecord() { }

        /**
         * Create the CSV and store it in the hidden field
         * 'custpage_table_csv' as a string.
         *
         * @param {Array}
         *            ordersDataSet The `billsDataSet` created in
         *            `loadDatatable()`.
         */
        function saveCsv(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Month", "MPEX Count", "Customer Count",
                "Franchisee Count"
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
                fieldId: 'custpage_table_csv',
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
                    return 1; // NSW
                    break;
                case 2:
                    return 6; // QLD
                    break;
                case 3:
                    return 5; // VIC
                    break;
                case 4:
                    return 3; // SA
                    break;
                case 5:
                    return 7; // TAS
                    break;
                case 6:
                    return 4; // ACT
                    break;
                case 7:
                    return 2; // WA
                    break;
                case 8:
                    return 8; // NT
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
         * Sets the values of `date_from` and `date_to` based on the
         * selected option in the '#period_dropdown'.
         */
        function selectDate() {
            var period_selected = $('#period_dropdown option:selected')
                .val();
            var today = new Date();
            var today_day_in_month = today.getDate();
            var today_day_in_week = today.getDay();
            var today_month = today.getMonth();
            var today_year = today.getFullYear();

            var today_date = new Date(Date.UTC(today_year, today_month,
                today_day_in_month))

            switch (period_selected) {
                case "this_week":
                    // This method changes the variable "today" and sets it
                    // on the previous monday
                    if (today_day_in_week == 0) {
                        var monday = new Date(Date.UTC(today_year,
                            today_month, today_day_in_month - 6));
                    } else {
                        var monday = new Date(Date.UTC(today_year,
                            today_month, today_day_in_month -
                            today_day_in_week + 1));
                    }
                    var date_from = monday.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "last_week":
                    var today_day_in_month = today.getDate();
                    var today_day_in_week = today.getDay();
                    // This method changes the variable "today" and sets it
                    // on the previous monday
                    if (today_day_in_week == 0) {
                        var previous_sunday = new Date(Date.UTC(today_year,
                            today_month, today_day_in_month - 7));
                    } else {
                        var previous_sunday = new Date(Date.UTC(today_year,
                            today_month, today_day_in_month -
                        today_day_in_week));
                    }

                    var previous_sunday_year = previous_sunday
                        .getFullYear();
                    var previous_sunday_month = previous_sunday.getMonth();
                    var previous_sunday_day_in_month = previous_sunday
                        .getDate();

                    var monday_before_sunday = new Date(Date.UTC(
                        previous_sunday_year, previous_sunday_month,
                        previous_sunday_day_in_month - 6));

                    var date_from = monday_before_sunday.toISOString()
                        .split('T')[0];
                    var date_to = previous_sunday.toISOString().split('T')[0];
                    break;

                case "this_month":
                    var first_day_month = new Date(Date.UTC(today_year,
                        today_month));
                    var date_from = first_day_month.toISOString()
                        .split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "last_month":
                    var first_day_previous_month = new Date(Date.UTC(
                        today_year, today_month - 1));
                    var last_day_previous_month = new Date(Date.UTC(
                        today_year, today_month, 0));
                    var date_from = first_day_previous_month.toISOString()
                        .split('T')[0];
                    var date_to = last_day_previous_month.toISOString()
                        .split('T')[0];
                    break;

                case "full_year":
                    var first_day_in_year = new Date(Date
                        .UTC(today_year, 0));
                    var date_from = first_day_in_year.toISOString().split(
                        'T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "financial_year":
                    if (today_month >= 6) {
                        var first_july = new Date(Date.UTC(today_year, 6));
                    } else {
                        var first_july = new Date(Date.UTC(today_year - 1,
                            6));
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
         * @param {Number}
         *            x
         * @returns {String} The same number, formatted in Australian
         *          dollars.
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

        function getRange(array) {

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
        /**
         * [getDate description] - Get the current date
         *
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
            downloadCsv: downloadCsv,
            expActWeeklyUsage: expActWeeklyUsage
        }
    });
