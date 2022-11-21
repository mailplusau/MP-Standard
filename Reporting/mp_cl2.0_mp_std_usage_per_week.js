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

                beforeSubmit();
                submitSearch();

                return true;
            });


            /**
             *  Auto Load Submit Search and Load Results on Page Initialisation
             */
            pageLoad();
            submitSearch();
            var dataTable = $('#customer_benchmark_preview').DataTable();


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

            dataTable = $('#customer_benchmark_preview').DataTable({
                destroy: true,
                data: debtDataSet,
                pageLength: 1000,
                order: [
                    [0, 'asc']
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
            // MP Standard - Usage Report - Last year to date (per week)
            var mpexUsageResults = search.load({
                type: 'customrecord_customer_product_stock',
                id: 'customsearch_mp_std_usage_per_week'
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

                debt_set.push({
                    dateUsed: dateUsed,
                    zeeCount: zeeCount,
                    customerCount: customerCount,
                    mpexUsage: mpexUsage
                });


                return true;
            });
            console.log(debt_set)
            loadDatatable(debt_set);
            debt_set = [];

        }

        function loadDatatable(debt_rows) {
            // $('#result_debt').empty();
            debtDataSet = [];
            csvSet = [];
            if (!isNullorEmpty(debt_rows)) {
                debt_rows.forEach(function (debt_row, index) {

                    var month = debt_row.dateUsed;
                    console.log(month);
                    var splitMonth = month.split('-');
                    var splitMonthV2 = month.split('/');

                    console.log('month ' + month)
                    console.log('splitMonth ' + splitMonth);

                    var formattedDate = dateISOToNetsuite(splitMonthV2[2] + '-' + splitMonthV2[1] + '-' + splitMonthV2[0]);

                    console.log('formattedDate ' + formattedDate);

                    var parsedDate = format.parse({
                        value: month,
                        type: format.Type.DATE
                    });

                    var firstDay = new Date(splitMonth[0], (splitMonth[1]), 1).getDate();
                    var lastDay = new Date(splitMonth[0], (splitMonth[1]), 0).getDate();

                    if (firstDay < 10) {
                        firstDay = '0' + firstDay;
                    }

                    // var startDate = firstDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    var startDate = splitMonth[0] + '-' + splitMonth[1] + '-' +
                        firstDay;
                    // var lastDate = lastDay + '/' + splitMonth[1] + '/' + splitMonth[0]
                    var lastDate = splitMonth[0] + '-' + splitMonth[1] + '-' +
                        lastDay

                    var detailedInvoiceURLMonth =
                        '<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1627&deploy=1&zee=' +
                        zee + '&start_date=' + startDate + '&last_date=' + lastDate +
                        '" target=_blank>VIEW (monthly)</a> | <a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1625&deploy=1&zee=' +
                        zee + '&start_date=' + startDate + '&last_date=' + lastDate +
                        '" target=_blank>VIEW (daily)</a>';



                    debtDataSet.push([detailedInvoiceURLMonth, formattedDate,
                        debt_row.mpexUsage,
                        debt_row.customerCount, debt_row.zeeCount
                    ]);

                    csvSet.push([month, debt_row.mpexUsage, debt_row.customerCount,
                        debt_row.zeeCount
                    ]);

                });
            }
            console.log(debtDataSet)
            var datatable = $('#customer_benchmark_preview').DataTable();
            datatable.clear();
            datatable.rows.add(debtDataSet);
            datatable.draw();

            saveCsv(csvSet);

            var data = datatable.rows().data();

            var month_year = []; //creating array for storing browser type in array.
            var mpex_usage = []; //creating array for storing browser type in array.
            var customer_count = []; //creating array for storing browser type in array.
            var zee_count = []; //creating array for storing browser type in array.

            for (var i = 0; i < data.length; i++) {
                month_year.push(data[i][1]);
                mpex_usage[data[i][1]] = data[i][2]
                customer_count[data[i][1]] = data[i][3]
                zee_count[data[i][1]] = data[i][4]

            }
            var count = {}; //creating object for getting categories with count
            month_year.forEach(function (i) {
                count[i] = (count[i] || 0) + 1;
            });

            console.log('mpex_usage')
            console.log(mpex_usage)

            console.log('customer_count')
            console.log(customer_count)

            var series_data = []; //creating empty array for highcharts series data
            var series_data2 = []; //creating empty array for highcharts series data
            var series_data3 = []; //creating empty array for highcharts series data
            var categores = []; //creating empty array for highcharts categories
            Object.keys(mpex_usage).map(function (item, key) {
                console.log(item);
                series_data.push(parseInt(mpex_usage[item]));
                series_data2.push(parseInt(customer_count[item]));
                series_data3.push(parseInt(zee_count[item]));
                categores.push(item)
            });
            plotChart(series_data, series_data2, categores, series_data3)
            return true;
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


        /**
         * Create the CSV and store it in the hidden field 'custpage_table_csv' as a string.
         * @param {Array} ordersDataSet The `billsDataSet` created in `loadDatatable()`.
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
