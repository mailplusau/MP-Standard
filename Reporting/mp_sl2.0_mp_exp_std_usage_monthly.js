/**
 
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 * Author:               Ankith Ravindran
 * Created on:           Fri May 05 2023
 * Modified on:          Fri May 05 2023 08:50:18
 * SuiteScript Version:  2.0
 * Description:          Reporting page that displayes the scans for all products.  
 *
 * Copyright (c) 2023 MailPlus Pty. Ltd.
 */

define([
	"N/ui/serverWidget",
	"N/email",
	"N/runtime",
	"N/search",
	"N/record",
	"N/http",
	"N/log",
	"N/redirect",
	"N/format",
], function (ui, email, runtime, search, record, http, log, redirect, format) {
	var role = 0;
	var zee = 0;
	var customerListTableHTML = "";

	function onRequest(context) {
		var baseURL = "https://system.na2.netsuite.com";
		if (runtime.EnvType == "SANDBOX") {
			baseURL = "https://system.sandbox.netsuite.com";
		}
		zee = 0;
		role = runtime.getCurrentUser().role;

		if (role == 1000) {
			zee = runtime.getCurrentUser().id;
		}

		if (context.request.method === "GET") {
			var start_date = context.request.parameters.start_date;
			var last_date = context.request.parameters.last_date;
			var freq = context.request.parameters.freq;
			if (zee == 0) {
				zee = context.request.parameters.zee;
			}
			var barcodeSource = context.request.parameters.source;

			if (isNullorEmpty(start_date)) {
				start_date = null;
			}

			if (isNullorEmpty(last_date)) {
				last_date = null;
			}

			if (start_date == null && last_date == null) {
				var date = new Date();
				var y = date.getFullYear();
				var m = date.getMonth();

				var lastDay = new Date(y, m + 1, 0);

				lastDay.setHours(0, 0, 0, 0);
				//If begining of the year, show the current financial year, else show the current
				// if (m < 5) {
				//Calculate the Current inancial Year

				var firstDay = new Date(y, m, 1);

				firstDay.setHours(0, 0, 0, 0);

				if (m >= 6) {
					var first_july = new Date(y, 6, 1);
				} else {
					var first_july = new Date(y - 1, 6, 1);
				}
				date_from = first_july;
				date_to = lastDay;

				start_date = GetFormattedDate(date_from);
				last_date = GetFormattedDate(date_to);
				// } else {
				// 	//Calculate the Current Calendar Year
				// 	var today_day_in_month = date.getDate();
				// 	var today_date = new Date(Date.UTC(y, m, today_day_in_month));
				// 	var first_day_in_year = new Date(Date.UTC(y, 0));
				// 	var date_from = first_day_in_year.toISOString().split("T")[0];
				// 	var date_to = today_date.toISOString().split("T")[0];

				// 	start_date = date_from;
				// 	last_date = GetFormattedDate(lastDay);
				// }
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
				if (freq == "weekly") {
					var form = ui.createForm({
						title: "MP Product Scans - Weekly",
					});
				} else if (freq == "daily") {
					var form = ui.createForm({
						title: "MP Product Scans - Daily",
					});
				} else {
					var form = ui.createForm({
						title: "MP Product Scans - Monthly",
					});
				}
			} else {
				var customer_record = record.load({
					type: "customer",
					id: parseInt(context.request.parameters.custid),
				});

				company_name = customer_record.getValue({
					fieldId: "companyname",
				});

				zee = customer_record.getValue({
					fieldId: "partner",
				});

				if (freq == "weekly") {
					var form = ui.createForm({
						title: "MP Product Scans - Weekly - " + company_name,
					});
				} else if (freq == "daily") {
					var form = ui.createForm({
						title: "MP Product Scans - Daily - " + company_name,
					});
				} else {
					var form = ui.createForm({
						title: "MP Product Scans - Monthly - " + company_name,
					});
				}
			}

			// All MP Products - Total Customer Usage
			var mpProdsScansPerCustomerSearch = search.load({
				type: "customrecord_customer_product_stock",
				id: "customsearch_prod_stock_usage_report___4",
			});

			var date_from_v2 = dateISOToNetsuite(date_from);
			var date_to_v2 = dateISOToNetsuite(date_to);

			if (!isNullorEmpty(date_from_v2) && !isNullorEmpty(date_to_v2)) {
				mpProdsScansPerCustomerSearch.filters.push(
					search.createFilter({
						name: "custrecord_cust_date_stock_used",
						join: null,
						operator: search.Operator.ONORAFTER,
						values: date_from_v2,
					})
				);
				mpProdsScansPerCustomerSearch.filters.push(
					search.createFilter({
						name: "custrecord_cust_date_stock_used",
						join: null,
						operator: search.Operator.ONORBEFORE,
						values: date_to_v2,
					})
				);
			}

			if (!isNullorEmpty(zee)) {
				mpProdsScansPerCustomerSearch.filters.push(
					search.createFilter({
						name: "custrecord_cust_prod_stock_zee",
						join: null,
						operator: search.Operator.IS,
						values: zee,
					})
				);
			}

			if (!isNullorEmpty(customerID)) {
				mpProdsScansPerCustomerSearch.filters.push(
					search.createFilter({
						name: "internalid",
						join: "custrecord_cust_prod_stock_customer",
						operator: search.Operator.ANYOF,
						values: parseInt(customerID),
					})
				);
			}

			if (!isNullorEmpty(barcodeSource)) {
				mpProdsScansPerCustomerSearch.filters.push(
					search.createFilter({
						name: "custrecord_barcode_source",
						join: null,
						operator: search.Operator.IS,
						values: barcodeSource,
					})
				);
			}

			var count3 = 0;
			var oldCustomerId = null;
			var oldCustomerName = null;
			var oldFranchiseeName = null;
			var oldIntegrationText = null;

			var express_speed_cust_usage = 0;
			var premium_speed_cust_usage = 0;
			var standard_speed_cust_usage = 0;
			var sendle_au_express_cust_usage = 0;
			var total_usage_cust_usage = 0;

			var debt_set2 = [];

			var notesTask =
				"<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' style='vertical-align: middle;'><title>Create User Note</title><g id='notebook_fill' fill='none'><path d='M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z'/><path fill='#F6F8F9FF' d='M8 2v19H6c-1.054 0-2-.95-2-2V4c0-1.054.95-2 2-2zm9 0c1.598 0 3 1.3 3 3v13c0 1.7-1.4 3-3 3h-7V2z'/></g></svg>";
			var cancelTask =
				"<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' style='vertical-align: middle;'><title>Cancel Customer</title><g id='close_circle_fill' fill='none'><path d='M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z'/><path fill='#F6F8F9FF' d='M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2M9.879 8.464a1 1 0 0 0-1.498 1.32l.084.095 2.12 2.12-2.12 2.122a1 1 0 0 0 1.32 1.498l.094-.083L12 13.414l2.121 2.122a1 1 0 0 0 1.498-1.32l-.083-.095L13.414 12l2.122-2.121a1 1 0 0 0-1.32-1.498l-.095.083L12 10.586z'/></g></svg>";
			var serviceChangeTask =
				"<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' style='vertical-align: middle;'><title>Process Service Change</title><g id='refresh_2_fill' fill='none'><path d='M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z'/><path fill='#F6F8F9FF' d='M1.498 12.082c-.01-1.267 1.347-1.987 2.379-1.406l.113.07 2.678 1.804c1.424.96.538 3.146-1.1 2.915l-.137-.025-.109-.024a7.504 7.504 0 0 0 13.175.335 1.5 1.5 0 1 1 2.6 1.498c-2.317 4.02-7.119 6.152-11.815 4.893a10.503 10.503 0 0 1-7.784-10.06m1.406-5.33C5.22 2.731 10.022.6 14.718 1.857a10.503 10.503 0 0 1 7.784 10.06c.01 1.267-1.347 1.987-2.379 1.407l-.113-.07-2.678-1.805c-1.424-.959-.538-3.145 1.099-2.914l.138.025.108.023A7.504 7.504 0 0 0 5.502 8.25a1.5 1.5 0 1 1-2.598-1.498'/></g></svg>";

			var mpProdsScansPerCustomerSearchResult =
				mpProdsScansPerCustomerSearch.run();

			var resultSet = mpProdsScansPerCustomerSearchResult.getRange({
				start: 0,
				end: 100,
			});

			mpProdsScansPerCustomerSearch
				.run()
				.each(function (mpProdsScansPerCustomerSearchSet) {
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
						name: "custrecord_delivery_speed",
						summary: "GROUP",
					});
					var deliverySpeedText = mpProdsScansPerCustomerSearchSet.getText({
						name: "custrecord_delivery_speed",
						summary: "GROUP",
					});

					var integration = mpProdsScansPerCustomerSearchSet.getValue({
						name: "custrecord_integration",
						summary: "GROUP",
					});
					var integrationText = mpProdsScansPerCustomerSearchSet.getText({
						name: "custrecord_integration",
						summary: "GROUP",
					});

					var mpexUsage = parseInt(
						mpProdsScansPerCustomerSearchSet.getValue({
							name: "name",
							summary: "COUNT",
						})
					);

					if (count3 == 0) {
						if (integrationText == "- None -") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								express_speed_cust_usage = mpexUsage;
							} else if (deliverySpeed == 4) {
								premium_speed_cust_usage = mpexUsage;
							}
						} else if (integrationText == "Sendle") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								// sendle_au_express_cust_usage = mpexUsage;
							} else if (deliverySpeed == 1) {
								standard_speed_cust_usage = mpexUsage;
							}
						} else if (integrationText == "API Integration") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								sendle_au_express_cust_usage = mpexUsage;
							} else if (deliverySpeed == 1) {
								standard_speed_cust_usage = mpexUsage;
							}
						}

						total_usage_cust_usage =
							express_speed_cust_usage +
							standard_speed_cust_usage +
							sendle_au_express_cust_usage +
							premium_speed_cust_usage;
					} else if (
						oldCustomerName != null &&
						oldCustomerName == customerName
					) {
						if (integrationText == "- None -") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								express_speed_cust_usage += mpexUsage;
							} else if (deliverySpeed == 4) {
								premium_speed_cust_usage += mpexUsage;
							}
						} else if (integrationText == "Sendle") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								// sendle_au_express_cust_usage += mpexUsage;
							} else if (deliverySpeed == 1) {
								standard_speed_cust_usage += mpexUsage;
							}
						} else if (integrationText == "API Integration") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								sendle_au_express_cust_usage += mpexUsage;
							} else if (deliverySpeed == 1) {
								standard_speed_cust_usage += mpexUsage;
							}
						}

						total_usage_cust_usage =
							express_speed_cust_usage +
							standard_speed_cust_usage +
							sendle_au_express_cust_usage +
							premium_speed_cust_usage;
					} else if (
						oldCustomerName != null &&
						oldCustomerName != customerName
					) {
						// var customer_record = record.load({
						// 	type: "customer",
						// 	id: parseInt(oldCustomerId),
						// });

						// var mpProdWeeklyUsage = customer_record.getValue({
						// 	fieldId: "custentity_actual_mpex_weekly_usage",
						// });

						var firstWeekofUsage = "";
						var lastWeekofUsage = "";
						var lastWeekUsageCount = 0;
						var avgWeeklyUsageCount = 0;
						var noOfWeeks = 0;
						var tempTotal = 0;

						// if (!isNullorEmpty(mpProdWeeklyUsage)) {
						// 	var parsedUsage = JSON.parse(mpProdWeeklyUsage);
						// 	noOfWeeks = parsedUsage["Usage"].length;
						// 	for (var x = 0; x < parsedUsage["Usage"].length; x++) {
						// 		var parts = parsedUsage["Usage"][x]["Week Used"].split("/");

						// 		if (x == 0) {
						// 			firstWeekofUsage =
						// 				parts[2] +
						// 				"-" +
						// 				("0" + parts[1]).slice(-2) +
						// 				"-" +
						// 				("0" + parts[0]).slice(-2) +
						// 				" - Usage: " +
						// 				parsedUsage["Usage"][x]["Count"];
						// 		}

						// 		if (x == parsedUsage["Usage"].length - 1) {
						// 			lastWeekofUsage =
						// 				parts[2] +
						// 				"-" +
						// 				("0" + parts[1]).slice(-2) +
						// 				"-" +
						// 				("0" + parts[0]).slice(-2) +
						// 				" - Usage: " +
						// 				parsedUsage["Usage"][x]["Count"];
						// 			lastWeekUsageCount = parseInt(
						// 				parsedUsage["Usage"][x]["Count"]
						// 			);
						// 		}

						// 		tempTotal += parseInt(parsedUsage["Usage"][x]["Count"]);
						// 	}
						// 	avgWeeklyUsageCount = parseFloat(tempTotal / noOfWeeks).toFixed(
						// 		2
						// 	);
						// }

						// var viewLinks =
						// 	'<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&custid=' +
						// 	oldCustomerId +
						// 	'" target=_blank>USAGE</a>';

						// customerListTableHTML += "<tr>";
						// customerListTableHTML += "<td>" + viewLinks + "</td>";
						// customerListTableHTML += "<td>" + oldCustomerName + "</td>";
						// customerListTableHTML += "<td>" + oldFranchiseeName + "</td>";
						// customerListTableHTML += "<td>" + firstWeekofUsage + "</td>";
						// customerListTableHTML += "<td>" + lastWeekofUsage + "</td>";
						// customerListTableHTML += "<td>" + avgWeeklyUsageCount + "</td>";
						// customerListTableHTML +=
						// 	"<td>" + express_speed_cust_usage + "</td>";
						// customerListTableHTML +=
						// 	"<td>" + standard_speed_cust_usage + "</td>";
						// customerListTableHTML +=
						// 	"<td>" + premium_speed_cust_usage + "</td>";
						// customerListTableHTML += "<td>" + total_usage_cust_usage + "</td>";
						// customerListTableHTML +=
						// 	'<td class="tableVerticalAlign"><button class="form-control btn btn-xs btn-info" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
						// 	oldCustomerId +
						// 	'" data-type="completed" class="createUserNote" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
						// 	notesTask +
						// 	'</a></button> <button class="form-control btn btn-xs btn-warning" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
						// 	oldCustomerId +
						// 	'" data-type="completed" class="serviceChange" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
						// 	serviceChangeTask +
						// 	'</a></button> <button class="form-control btn btn-xs btn-danger" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
						// 	oldCustomerId +
						// 	'" data-type="completed" class="cancelCustomer" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
						// 	cancelTask +
						// 	"</a></button></td>";
						// customerListTableHTML += "</tr>";

						debt_set2.push({
							customerId: oldCustomerId,
							customerName: oldCustomerName,
							franchiseeName: oldFranchiseeName,
							firstWeekofUsage: firstWeekofUsage,
							lastWeekofUsage: lastWeekofUsage,
							avgWeeklyUsageCount: avgWeeklyUsageCount,
							express_speed: express_speed_cust_usage,
							sendle_au_express: sendle_au_express_cust_usage,
							standard_speed: standard_speed_cust_usage,
							total_usage: total_usage_cust_usage,
							premium_speed: premium_speed_cust_usage,
						});

						express_speed_cust_usage = 0;
						standard_speed_cust_usage = 0;
						sendle_au_express_cust_usage = 0;
						premium_speed_cust_usage = 0;
						total_usage_cust_usage = 0;

						if (integrationText == "- None -") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								express_speed_cust_usage = mpexUsage;
							} else if (deliverySpeed == 4) {
								premium_speed_cust_usage = mpexUsage;
							}
						} else if (integrationText == "Sendle") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								// sendle_au_express_cust_usage = mpexUsage;
							} else if (deliverySpeed == 1) {
								standard_speed_cust_usage = mpexUsage;
							}
						} else if (integrationText == "API Integration") {
							if (deliverySpeed == 2 || deliverySpeedText == "- None -") {
								sendle_au_express_cust_usage = mpexUsage;
							} else if (deliverySpeed == 1) {
								standard_speed_cust_usage = mpexUsage;
							}
						}

						total_usage_cust_usage =
							express_speed_cust_usage +
							standard_speed_cust_usage +
							sendle_au_express_cust_usage +
							premium_speed_cust_usage;
					}

					count3++;
					oldCustomerName = customerName;
					oldCustomerId = customerId;
					oldFranchiseeName = franchiseeName;
					return true;
				});

			if (count3 > 0) {
				// var customer_record = record.load({
				// 	type: "customer",
				// 	id: parseInt(oldCustomerId),
				// });

				// var mpProdWeeklyUsage = customer_record.getValue({
				// 	fieldId: "custentity_actual_mpex_weekly_usage",
				// });

				var firstWeekofUsage = "";
				var lastWeekofUsage = "";
				var lastWeekUsageCount = 0;
				var avgWeeklyUsageCount = 0;
				var noOfWeeks = 0;
				var tempTotal = 0;

				// if (!isNullorEmpty(mpProdWeeklyUsage)) {
				// 	var parsedUsage = JSON.parse(mpProdWeeklyUsage);
				// 	noOfWeeks = parsedUsage["Usage"].length;
				// 	for (var x = 0; x < parsedUsage["Usage"].length; x++) {
				// 		var parts = parsedUsage["Usage"][x]["Week Used"].split("/");

				// 		if (x == 0) {
				// 			firstWeekofUsage =
				// 				parts[2] +
				// 				"-" +
				// 				("0" + parts[1]).slice(-2) +
				// 				"-" +
				// 				("0" + parts[0]).slice(-2) +
				// 				" - Usage: " +
				// 				parsedUsage["Usage"][x]["Count"];
				// 		}

				// 		if (x == parsedUsage["Usage"].length - 1) {
				// 			lastWeekofUsage =
				// 				parts[2] +
				// 				"-" +
				// 				("0" + parts[1]).slice(-2) +
				// 				"-" +
				// 				("0" + parts[0]).slice(-2) +
				// 				" - Usage: " +
				// 				parsedUsage["Usage"][x]["Count"];
				// 			lastWeekUsageCount = parseInt(parsedUsage["Usage"][x]["Count"]);
				// 		}

				// 		tempTotal += parseInt(parsedUsage["Usage"][x]["Count"]);
				// 	}
				// 	avgWeeklyUsageCount = parseFloat(tempTotal / noOfWeeks).toFixed(2);
				// }

				// var viewLinks =
				// 	'<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&custid=' +
				// 	oldCustomerId +
				// 	'" target=_blank>USAGE</a>';

				// customerListTableHTML += "<tr>";
				// customerListTableHTML += "<td>" + viewLinks + "</td>";
				// customerListTableHTML += "<td>" + oldCustomerName + "</td>";
				// customerListTableHTML += "<td>" + oldFranchiseeName + "</td>";
				// customerListTableHTML += "<td>" + firstWeekofUsage + "</td>";
				// customerListTableHTML += "<td>" + lastWeekofUsage + "</td>";
				// customerListTableHTML += "<td>" + avgWeeklyUsageCount + "</td>";
				// customerListTableHTML += "<td>" + express_speed_cust_usage + "</td>";
				// customerListTableHTML += "<td>" + standard_speed_cust_usage + "</td>";
				// customerListTableHTML += "<td>" + premium_speed_cust_usage + "</td>";
				// customerListTableHTML += "<td>" + total_usage_cust_usage + "</td>";
				// customerListTableHTML +=
				// 	'<td class="tableVerticalAlign"><button class="form-control btn btn-xs btn-info" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
				// 	oldCustomerId +
				// 	'" data-type="completed" class="createUserNote" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
				// 	notesTask +
				// 	'</a></button> <button class="form-control btn btn-xs btn-warning" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
				// 	oldCustomerId +
				// 	'" data-type="completed" class="serviceChange" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
				// 	serviceChangeTask +
				// 	'</a></button> <button class="form-control btn btn-xs btn-danger" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
				// 	oldCustomerId +
				// 	'" data-type="completed" class="cancelCustomer" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
				// 	cancelTask +
				// 	"</a></button></td>";
				// customerListTableHTML += "</tr>";

				debt_set2.push({
					customerId: oldCustomerId,
					customerName: oldCustomerName,
					franchiseeName: oldFranchiseeName,
					firstWeekofUsage: firstWeekofUsage,
					lastWeekofUsage: lastWeekofUsage,
					avgWeeklyUsageCount: avgWeeklyUsageCount,
					express_speed: express_speed_cust_usage,
					sendle_au_express: sendle_au_express_cust_usage,
					standard_speed: standard_speed_cust_usage,
					total_usage: total_usage_cust_usage,
					premium_speed: premium_speed_cust_usage,
				});
			}

			log.debug({
				title: "debt_set2",
				details: debt_set2,
			});
			debt_set2 = debt_set2.sort(function (a, b) {
				return parseInt(b.total_usage) - parseInt(a.total_usage);
			});
			log.debug({
				title: "After sorting",
				details: "",
			});
			log.debug({
				title: "debt_set2",
				details: debt_set2,
			});

			for (var i = 0; i < 100; i++) {
				var customer_record = record.load({
					type: "customer",
					id: parseInt(debt_set2[i].customerId),
				});

				var mpProdWeeklyUsage = customer_record.getValue({
					fieldId: "custentity_actual_mpex_weekly_usage",
				});

				var firstWeekofUsage = "";
				var lastWeekofUsage = "";
				var lastWeekUsageCount = 0;
				var avgWeeklyUsageCount = 0;
				var noOfWeeks = 0;
				var tempTotal = 0;

				if (!isNullorEmpty(mpProdWeeklyUsage)) {
					var parsedUsage = JSON.parse(mpProdWeeklyUsage);
					noOfWeeks = parsedUsage["Usage"].length;
					for (var x = 0; x < parsedUsage["Usage"].length; x++) {
						var parts = parsedUsage["Usage"][x]["Week Used"].split("/");

						if (x == 0) {
							firstWeekofUsage =
								parts[2] +
								"-" +
								("0" + parts[1]).slice(-2) +
								"-" +
								("0" + parts[0]).slice(-2) +
								" - Usage: " +
								parsedUsage["Usage"][x]["Count"];
						}

						if (x == parsedUsage["Usage"].length - 1) {
							lastWeekofUsage =
								parts[2] +
								"-" +
								("0" + parts[1]).slice(-2) +
								"-" +
								("0" + parts[0]).slice(-2) +
								" - Usage: " +
								parsedUsage["Usage"][x]["Count"];
							lastWeekUsageCount = parseInt(parsedUsage["Usage"][x]["Count"]);
						}

						tempTotal += parseInt(parsedUsage["Usage"][x]["Count"]);
					}
					avgWeeklyUsageCount = parseFloat(tempTotal / noOfWeeks).toFixed(2);
				}

				var viewLinks =
					'<a href="https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1712&deploy=1&custid=' +
					debt_set2[i].customerId +
					'" target=_blank>USAGE</a>';
				customerListTableHTML += "<tr>";
				customerListTableHTML += "<td>" + viewLinks + "</td>";
				customerListTableHTML += "<td>" + debt_set2[i].customerName + "</td>";
				customerListTableHTML += "<td>" + debt_set2[i].franchiseeName + "</td>";
				customerListTableHTML += "<td>" + firstWeekofUsage + "</td>";
				customerListTableHTML += "<td>" + lastWeekofUsage + "</td>";
				customerListTableHTML += "<td>" + avgWeeklyUsageCount + "</td>";
				customerListTableHTML += "<td>" + debt_set2[i].express_speed + "</td>";
				customerListTableHTML += "<td>" + debt_set2[i].standard_speed + "</td>";
				customerListTableHTML += "<td>" + debt_set2[i].premium_speed + "</td>";
				customerListTableHTML += "<td>" + debt_set2[i].total_usage + "</td>";
				customerListTableHTML +=
					'<td class="tableVerticalAlign"><button class="form-control btn btn-xs btn-info" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
					debt_set2[i].customerId +
					'" data-type="completed" class="createUserNote" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
					notesTask +
					'</a></button> <button class="form-control btn btn-xs btn-warning" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
					debt_set2[i].customerId +
					'" data-type="completed" class="serviceChange" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
					serviceChangeTask +
					'</a></button> <button class="form-control btn btn-xs btn-danger" style="cursor: not-allowed !important;width: fit-content;border-radius: 30px;"><a data-id="' +
					debt_set2[i].customerId +
					'" data-type="completed" class="cancelCustomer" style="cursor: pointer !important;color: white;border-radius: 30px;">' +
					cancelTask +
					"</a></button></td>";
				customerListTableHTML += "</tr>";
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

			inlineHtml +=
				"<style>.mandatory{color:red;} .body{background-color: #CFE0CE !important;}.wrapper{position:fixed;height:2em;width:2em;overflow:show;margin:auto;top:0;left:0;bottom:0;right:0;justify-content: center; align-items: center; display: -webkit-inline-box;} .ball{width: 22px; height: 22px; border-radius: 11px; margin: 0 10px; animation: 2s bounce ease infinite;} .blue{background-color: #0f3d39; }.red{background-color: #095C7B; animation-delay: .25s;}.yellow{background-color: #387081; animation-delay: .5s}.green{background-color: #d0e0cf; animation-delay: .75s}@keyframes bounce{50%{transform: translateY(25px);}}.select2-selection__choice{ background-color: #095C7B !important; color: white !important}.select2-selection__choice__remove{color: red !important;}</style>";

			form
				.addField({
					id: "custpage_table_csv_overview",
					type: ui.FieldType.TEXT,
					label: "Table CSV",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});
			form
				.addField({
					id: "custpage_table_csv_customer_list",
					type: ui.FieldType.TEXT,
					label: "Table CSV",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});
			form
				.addField({
					id: "custpage_table_csv_zee_list",
					type: ui.FieldType.TEXT,
					label: "Table CSV",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});
			form
				.addField({
					id: "custpage_table_csv_source",
					type: ui.FieldType.TEXT,
					label: "Table CSV",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});
			form
				.addField({
					id: "custpage_table_csv_prod_weights",
					type: ui.FieldType.TEXT,
					label: "Table CSV",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});

			var custInternalIDField = form
				.addField({
					id: "custpage_custid",
					type: ui.FieldType.TEXT,
					label: "Customer Internal ID",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});

			form
				.addField({
					id: "custpage_freq",
					type: ui.FieldType.TEXT,
					label: "Freq",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				}).defaultValue = freq;

			custInternalIDField.defaultValue = customerID;

			// inlineHtml += stateDropdownSection();

			inlineHtml += loadingSection();

			inlineHtml +=
				'<div class="container instruction_div hide" style="background-color: lightblue;font-size: 14px;padding: 15px;border-radius: 10px;border: 1px solid;box-shadow: 0px 1px 26px -10px white;"><p><b><u>Instructions</u></b></br><ol><li>Select the desired customer from the "Customer" drop-down menu.</li><li>Choose the specific period or date range you wish to view.</li><li>Click the "Apply Filter" button.</li></ol><b>Monthly Overview:</b></br>The left button above the graph represents the filter for a monthly overview of scanned parcels. Below the graph, you can switch to weekly or daily views to see the total scans for that respective period.</br></br><b>Customer List (Top 100):</b></br>The middle left button above the graph provides a list of all customers and their product usage based on the applied filters.</br></br><b>Source:</b></br>The middle right button above the graph offers data regarding the barcode source (MPEX or Standard).</br></br><b>Product Weight:</b></br>The right button above the graph gives you information about the products used based on their weight perspective.</p><div class="form-group container"><div class="row"><div class="col-xs-4"></div><div class="col-xs-4"><input type="button" value="CLICK FOR USER GUIDE" class="form-control btn btn-primary" id="showGuide" style="background-color: #095C7B; border-radius: 30px;" /></div><div class="col-xs-4"></div></div></div></div></br>';

			inlineHtml += stepByStepGuideModal();
			inlineHtml += addUserNotesModal();

			inlineHtml +=
				'<div class="form-group container show_buttons_section hide">';
			inlineHtml += '<div class="row">';
			inlineHtml += '<div class="col-xs-5"></div>';

			inlineHtml +=
				'<div class="col-xs-2"><input type="button" value="SHOW FILTERS" class="form-control btn btn-primary" data-toggle="collapse" data-target="#collapseExample" id="show_filter" aria-expanded="false" aria-controls="collapseExample" style="background-color: #EAF044; color: #103d39" /></div>';
			inlineHtml += '<div class="col-xs-5"></div>';

			inlineHtml += "</div>";
			inlineHtml += "</div>";

			inlineHtml += "</br>";

			inlineHtml +=
				'<div class="collapse" id="collapseExample"><div class="card card-body">';
			inlineHtml += "<div>";

			if (role != 1000) {
				//Search: SMC - Franchisees
				var searchZees = search.load({
					id: "customsearch_smc_franchisee",
				});
				var resultSetZees = searchZees.run();

				inlineHtml += franchiseeDropdownSection(resultSetZees, context);
			}
			if (!isNullorEmpty(zee)) {
				inlineHtml += customerDropdownSection(context);
			}

			inlineHtml += dateFilterSection(start_date, last_date);

			inlineHtml += sourceDropdownSelection(barcodeSource);
			inlineHtml +=
				'<div class="form-group container filter_buttons_section hide">';
			inlineHtml += '<div class="row">';
			inlineHtml += '<div class="col-xs-2"></div>';
			inlineHtml +=
				'<div class="col-xs-4"><input type="button" value="APPLY FILTER" class="form-control btn btn-primary button-shadow" id="applyFilter" style="background-color: #095C7B;" /></div>';
			inlineHtml +=
				'<div class="col-xs-4"><input type="button" value="CLEAR FILTER" class="form-control btn btn-light button-shadow" id="clearFilter" style="background-color: #F0AECB;" /></div>';
			inlineHtml += '<div class="col-xs-2"></div>';

			inlineHtml += "</div>";
			inlineHtml += "</div></br></br>";
			inlineHtml += "</div></div></div>";
			// inlineHtml += invoiceTypeSelection();

			// Tabs headers
			inlineHtml +=
				"<style>.nav > li.active > a, .nav > li.active > a:focus, .nav > li.active > a:hover { background-color: #095c7b; color: #fff }";
			inlineHtml +=
				".nav > li > a, .nav > li > a:focus, .nav > li > a:hover { margin-left: 5px; margin-right: 5px; border: 2px solid #095c7b; color: #095c7b; }";
			inlineHtml += "</style>";

			inlineHtml +=
				'<div class="tabs_div hide" style="width: 95%; margin:auto; margin-bottom: 30px"><ul class="nav nav-pills nav-justified main-tabs-sections " style="margin:0%; ">';

			if (freq == "weekly") {
				inlineHtml +=
					'<li role="presentation" class="active"><a data-toggle="tab" href="#monthly_scans"><b>WEEKLY OVERVIEW</b></a></li>';
			} else if (freq == "daily") {
				inlineHtml +=
					'<li role="presentation" class="active"><a data-toggle="tab" href="#monthly_scans"><b>DAILY OVERVIEW</b></a></li>';
			} else {
				inlineHtml +=
					'<li role="presentation" class="active"><a data-toggle="tab" href="#monthly_scans"><b>MONTHLY OVERVIEW</b></a></li>';
			}

			// if (isNullorEmpty(customerID)) {
			inlineHtml +=
				'<li role="presentation" class=""><a data-toggle="tab" href="#customer_list"><b>CUSTOMER LIST (TOP 100)</b></a></li>';
			if (role != 1000 && isNullorEmpty(zee)) {
				inlineHtml +=
					'<li role="presentation" class=""><a data-toggle="tab" href="#zee_list"><b>FRANCHISEE LIST</b></a></li>';
			}
			// }

			inlineHtml +=
				'<li role="presentation" class=""><a data-toggle="tab" href="#source"><b>SOURCE</b></a></li>';
			inlineHtml +=
				'<li role="presentation" class=""><a data-toggle="tab" href="#weights"><b>PRODUCT WEIGHTS</b></a></li>';

			inlineHtml += "</ul></div>";

			// Tabs content
			inlineHtml += '<div class="tab-content">';
			inlineHtml +=
				'<div role="tabpanel" class="tab-pane active" id="monthly_scans">';
			inlineHtml += '<figure class="highcharts-figure">';
			inlineHtml += '<div id="container_monthly"></div>';
			inlineHtml += "</figure><br></br>";
			inlineHtml += dataTable("monthly_scans");
			inlineHtml += "</div>";

			inlineHtml += '<div role="tabpanel" class="tab-pane" id="customer_list">';

			inlineHtml += '<figure class="highcharts-figure">';
			inlineHtml += '<div id="container_cust_list"></div>';
			inlineHtml += "</figure><br></br>";
			inlineHtml += dataTable("customer_list");
			inlineHtml += "</div>";

			if (role != 1000) {
				inlineHtml += '<div role="tabpanel" class="tab-pane" id="zee_list">';

				inlineHtml += '<figure class="highcharts-figure">';
				inlineHtml += '<div id="container_zee_list"></div>';
				inlineHtml += "</figure><br></br>";
				inlineHtml += dataTable("zee_list");
				inlineHtml += "</div>";
			}

			inlineHtml += '<div role="tabpanel" class="tab-pane" id="source">';

			inlineHtml += '<figure class="highcharts-figure">';
			inlineHtml += '<div id="container_source"></div>';
			inlineHtml += "</figure><br></br>";
			inlineHtml += dataTable("source");
			inlineHtml += "</div>";

			inlineHtml += '<div role="tabpanel" class="tab-pane" id="weights">';

			inlineHtml += '<figure class="highcharts-figure">';
			inlineHtml += '<div id="container_weights"></div>';
			inlineHtml += "</figure><br></br>";
			inlineHtml += dataTable("weights");
			inlineHtml += "</div>";

			inlineHtml += "</div></div>";
			// inlineHtml += '<div id="container"></div>'
			// inlineHtml += tableFilter();
			// inlineHtml += dataTable();

			form.addButton({
				id: "download_csv",
				label: "Export as CSV",
				functionName: "downloadCsv()",
			});

			// form.addButton({
			//     id: 'submit',
			//     label: 'Submit Search'
			// });

			form
				.addField({
					id: "preview_table",
					label: "inlinehtml",
					type: "inlinehtml",
				})
				.updateLayoutType({
					layoutType: ui.FieldLayoutType.STARTROW,
				}).defaultValue = inlineHtml;

			form.clientScriptFileId = 6276966;

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

	/*
	 * PURPOSE : HTML code to generate the Modal Pop-up
	 *  PARAMS :  -
	 * RETURNS : HTML
	 *   NOTES :
	 */
	function stepByStepGuideModal() {
		var inlineHtml =
			'<div id="myModal" class="modal" style="display: none; position: fixed; z-index: 1; padding-top: 100px;left: 0;top: 0;width: 100%; height: 100%; overflow: auto; background-color: rgb(0,0,0); background-color: rgba(0,0,0,0.4); "><div class="modal-content" style="position: absolute;transform: translate(-50%, -50%);background-color: #CFE0CE; margin: auto; padding: 0; border: 1px solid #888;width: fit-content; left: 50%;top: 50%; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19); -webkit-animation-name: animatetop;-webkit-animation-duration: 0.4s;animation-name: animatetop;animation-duration: 0.4s;"><div class="modal-header" style="padding: 2px 16px;text-align: center;"><span class="close" style="color: black;float: right;font-size: 28px;font-weight: bold;"">&times;</span><h1 class="modal-title" id="modal-title">STEP BY STEP GUIDE</h1></div>';

		inlineHtml += '<div class="modal-body" style="padding: 2px 16px;">';
		inlineHtml += '<div class="form-group container mpex_customer2_section">';
		inlineHtml += '<div class="row">';
		inlineHtml +=
			'<iframe src="https://scribehow.com/embed/MP_Product_Scans__Monthly_Full_Report_View__r0DS8bGqS4abpfr_SyLyuA?as=scrollable&skipIntro=true&removeLogo=true" width="100%" height="640" allowfullscreen frameborder="0"></iframe>';

		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml += "</div></div></div>";

		return inlineHtml;
	}

	/**
	 * The date input fields to filter the invoices.
	 * Even if the parameters `date_from` and `date_to` are defined, they can't be initiated in the HTML code.
	 * They are initiated with jQuery in the `pageInit()` function.
	 * @return  {String} `inlineHtml`
	 */
	function dateFilterSection(start_date, last_date) {
		var inlineHtml =
			'<div class="form-group container date_filter_section hide">';
		inlineHtml += '<div class="row">';
		inlineHtml +=
			'<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #095C7B;">DATE FILTER</span></h4></div>';
		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml += periodDropdownSection(start_date, last_date);

		inlineHtml += '<div class="form-group container date_filter_div hide">';
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
				start_date +
				'"/>';
		}

		inlineHtml += "</div></div>";
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
				last_date +
				'">';
		}

		inlineHtml += "</div></div></div></div>";

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
		inlineHtml +=
			'<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #103D39;">STATE</span></h4></div>';
		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml += '<div class="form-group container state_section">';
		inlineHtml += '<div class="row">';
		// Period dropdown field
		inlineHtml += '<div class="col-xs-12 state_dropdown_div">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="state_dropdown_text">State</span>';
		inlineHtml += '<select id="state_dropdown" class="form-control">';
		inlineHtml += '<option value=""></option>';
		inlineHtml += '<option value="6">ACT</option>';
		inlineHtml += '<option value="1">NSW</option>';
		inlineHtml += '<option value="8">NT</option>';
		inlineHtml += '<option value="2">QLD</option>';
		inlineHtml += '<option value="4">SA</option>';
		inlineHtml += '<option value="5">TAS</option>';
		inlineHtml += '<option value="3">VIC</option>';
		inlineHtml += '<option value="7">WA</option>';
		inlineHtml += "</select>";
		inlineHtml += "</div></div></div></div>";

		return inlineHtml;
	}

	/**
	 * The period dropdown field.
	 * @param   {String}    date_from
	 * @param   {String}    date_to
	 * @return  {String}    `inlineHtml`
	 */
	function franchiseeDropdownSection(resultSetZees, context) {
		var inlineHtml =
			'<div class="form-group container zee_label_section hide">';
		inlineHtml += '<div class="row">';
		inlineHtml +=
			'<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #095C7B;">FRANCHISEE</span></h4></div>';
		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml += '<div class="form-group container zee_dropdown_div hide">';
		inlineHtml += '<div class="row">';
		// Period dropdown field
		inlineHtml += '<div class="col-xs-12 zee_dropdown_div">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="zee_dropdown_text">Franchisee</span>';
		inlineHtml += '<select id="zee_dropdown" class="form-control">';
		inlineHtml += '<option value=""></option>';
		resultSetZees.each(function (searchResult_zee) {
			zee_id = searchResult_zee.getValue("internalid");
			zee_name = searchResult_zee.getValue("companyname");

			if (context.request.parameters.zee == zee_id) {
				inlineHtml +=
					'<option value="' +
					zee_id +
					'" selected="selected">' +
					zee_name +
					"</option>";
			} else if (zee == zee_id) {
				inlineHtml +=
					'<option value="' +
					zee_id +
					'" selected="selected">' +
					zee_name +
					"</option>";
			} else {
				inlineHtml +=
					'<option value="' + zee_id + '">' + zee_name + "</option>";
			}

			return true;
		});
		inlineHtml += "</select>";
		inlineHtml += "</div></div></div></div>";

		return inlineHtml;
	}

	/**
	 *
	 * @param   {String}    date_from
	 * @param   {String}    date_to
	 * @return  {String}    `inlineHtml`
	 */
	function sourceDropdownSelection(barcodeSource) {
		/**
             * 	Manual	        1
                Shopify	        2	 
                Customer Portal	3	 
                Bulk	        4	 
                API	            5
             */

		var inlineHtml =
			'<div class="form-group container source_label_section hide">';
		inlineHtml += '<div class="row">';
		inlineHtml +=
			'<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #095C7B;">BARCODE SOURCE</span></h4></div>';
		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml += '<div class="form-group container source_dropdown_div hide">';
		inlineHtml += '<div class="row">';
		// Period dropdown field
		inlineHtml += '<div class="col-xs-12 source_dropdown_div">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="source_dropdown_text">Source</span>';
		inlineHtml += '<select id="source_dropdown" class="form-control">';
		inlineHtml += '<option value=""></option>';

		if (barcodeSource == 1) {
			inlineHtml += '<option value="1" selected>Manual</option>';
			inlineHtml += '<option value="2">Shopify</option>';
			inlineHtml += '<option value="3">Customer Portal</option>';
			inlineHtml += '<option value="4">Bulk</option>';
			inlineHtml += '<option value="5">API</option>';
		} else if (barcodeSource == 2) {
			inlineHtml += '<option value="1">Manual</option>';
			inlineHtml += '<option value="2" selected>Shopify</option>';
			inlineHtml += '<option value="3">Customer Portal</option>';
			inlineHtml += '<option value="4">Bulk</option>';
			inlineHtml += '<option value="5">API</option>';
		} else if (barcodeSource == 3) {
			inlineHtml += '<option value="1">Manual</option>';
			inlineHtml += '<option value="2">Shopify</option>';
			inlineHtml += '<option value="3" selected>Customer Portal</option>';
			inlineHtml += '<option value="4">Bulk</option>';
			inlineHtml += '<option value="5">API</option>';
		} else if (barcodeSource == 4) {
			inlineHtml += '<option value="1">Manual</option>';
			inlineHtml += '<option value="2">Shopify</option>';
			inlineHtml += '<option value="3">Customer Portal</option>';
			inlineHtml += '<option value="4" selected>Bulk</option>';
			inlineHtml += '<option value="5">API</option>';
		} else if (barcodeSource == 5) {
			inlineHtml += '<option value="1">Manual</option>';
			inlineHtml += '<option value="2">Shopify</option>';
			inlineHtml += '<option value="3">Customer Portal</option>';
			inlineHtml += '<option value="4">Bulk</option>';
			inlineHtml += '<option value="5" selected>API</option>';
		} else {
			inlineHtml += '<option value="1">Manual</option>';
			inlineHtml += '<option value="2">Shopify</option>';
			inlineHtml += '<option value="3">Customer Portal</option>';
			inlineHtml += '<option value="4">Bulk</option>';
			inlineHtml += '<option value="5">API</option>';
		}

		inlineHtml += "</select>";
		inlineHtml += "</div></div></div></div>";

		return inlineHtml;
	}

	/**
	 * The customer dropdown field.
	 * @param   {String}    date_from
	 * @param   {String}    date_to
	 * @return  {String}    `inlineHtml`
	 */
	function customerDropdownSection(context) {
		var searchCustomers = search.load({
			id: "customsearch_smc_customer",
		});

		searchCustomers.filters.push(
			search.createFilter({
				name: "partner",
				join: null,
				operator: search.Operator.IS,
				values: zee,
			})
		);

		var inlineHtml =
			'<div class="form-group container cust_label_section hide">';
		inlineHtml += '<div class="row">';
		inlineHtml +=
			'<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12" style="background-color: #095c7b;">CUSTOMER</span></h4></div>';
		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml += '<div class="form-group container cust_dropdown_div hide">';
		inlineHtml += '<div class="row">';
		// Period dropdown field
		inlineHtml += '<div class="col-xs-12 cust_dropdown_div">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="cust_dropdown_text">Customer</span>';
		inlineHtml += '<select id="cust_dropdown" class="form-control">';
		inlineHtml += '<option value=""></option>';
		searchCustomers.run().each(function (searchResult_cust) {
			cust_id = searchResult_cust.getValue({
				name: "internalid",
				summary: "GROUP",
			});
			cust_name = searchResult_cust.getValue({
				name: "companyname",
				summary: "GROUP",
			});

			if (context.request.parameters.custid == cust_id) {
				inlineHtml +=
					'<option value="' +
					cust_id +
					'" selected="selected">' +
					cust_name +
					"</option>";
			} else {
				inlineHtml +=
					'<option value="' + cust_id + '">' + cust_name + "</option>";
			}

			return true;
		});
		inlineHtml += "</select>";
		inlineHtml += "</div></div></div></div>";

		return inlineHtml;
	}

	/**
	 * The period dropdown field.
	 * @param   {String}    date_from
	 * @param   {String}    date_to
	 * @return  {String}    `inlineHtml`
	 */
	function periodDropdownSection(date_from, date_to) {
		var selected_option =
			isNullorEmpty(date_from) && isNullorEmpty(date_to) ? "selected" : "";
		var inlineHtml =
			'<div class="form-group container period_dropdown_section hide">';
		inlineHtml += '<div class="row">';
		// Period dropdown field
		inlineHtml += '<div class="col-xs-12 period_dropdown_div">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="period_dropdown_text">Period</span>';
		inlineHtml += '<select id="period_dropdown" class="form-control">';
		if (selected_option == "") {
			inlineHtml += "<option selected></option>";
			inlineHtml += '<option value="this_week">This Week</option>';
			inlineHtml += '<option value="last_week">Last Week</option>';
			inlineHtml += '<option value="this_month" >This Month</option>';
			inlineHtml += '<option value="last_month" >Last Month</option>';
		} else {
			inlineHtml += "<option selected></option>";
			inlineHtml += '<option value="this_week">This Week</option>';
			inlineHtml += '<option value="last_week">Last Week</option>';
			inlineHtml += '<option value="this_month">This Month</option>';
			inlineHtml += '<option value="last_month" >Last Month</option>';
		}

		inlineHtml += '<option value="full_year">Full Year (1 Jan -)</option>';
		inlineHtml +=
			'<option value="financial_year">Financial Year (1 Jul -)</option>';
		inlineHtml += "</select>";
		inlineHtml += "</div></div></div></div>";

		return inlineHtml;
	}

	/**
	 * The table that will display the differents invoices linked to the franchisee and the time period.
	 * @return  {String}    inlineHtml
	 */
	function dataTable(name) {
		var inlineHtml =
			"<style>table#mpexusage-" +
			name +
			" {color: #103D39 !important; font-size: 12px;text-align: center;border: none;}.dataTables_wrapper {font-size: 14px;}table#mpexusage-" +
			name +
			" th{text-align: center;} .bolded{font-weight: bold;} .exportButtons{background-color: #045d7b !important;color: white !important;border-radius: 25px !important;}</style>";
		inlineHtml +=
			'<div class="datatable_div"><table id="mpexusage-' +
			name +
			'" class="table table-responsive table-striped customer tablesorter cell-border compact" style="width: 100%;">';
		inlineHtml += '<thead style="color: white;background-color: #095c7b;">';
		inlineHtml += '<tr class="text-center">';

		inlineHtml += "</tr>";
		inlineHtml += "</thead>";

		inlineHtml += '<tbody id="result_usage_' + name + '" >';
		if (name == "customer_list") {
			log.audit({
				title: "name",
				details: name,
			});
			log.audit({
				title: "customerListTableHTML",
				details: customerListTableHTML,
			});

			inlineHtml += customerListTableHTML;
		}
		inlineHtml += "</tbody>";

		inlineHtml += "</table></div>";
		return inlineHtml;
	}

	/**
	 * The header showing that the results are loading.
	 * @returns {String} `inlineQty`
	 */
	function loadingSection() {
		var inlineHtml =
			'<div class="wrapper loading_section" style="height: 10em !important;left: 50px !important">';
		inlineHtml += '<div class="row">';
		inlineHtml += '<div class="col-xs-12 ">';
		inlineHtml += '<h1 style="color: #095C7B;">Loading</h1>';
		inlineHtml += "</div></div></div></br></br>";
		inlineHtml += '<div class="wrapper loading_section">';
		inlineHtml += '<div class="blue ball"></div>';
		inlineHtml += '<div class="red ball"></div>';
		inlineHtml += '<div class="yellow ball"></div>';
		inlineHtml += '<div class="green ball"></div>';

		inlineHtml += "</div>";

		return inlineHtml;
	}

	/**
	 * The date input fields to filter the invoices.
	 * Even if the parameters `date_from` and `date_to` are defined, they can't be initiated in the HTML code.
	 * They are initiated with jQuery in the `pageInit()` function.
	 * @return  {String} `inlineHtml`
	 */
	function tableFilter() {
		var inlineHtml =
			'<div id="table_filter_section" class="table_filters_section hide">';
		inlineHtml += '<div class="form-group container">';
		inlineHtml += '<div class="row">';
		inlineHtml +=
			'<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12">TABLE FILTERS</span></h4></div>';
		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml += '<div class="form-group container table_filter_section">';
		inlineHtml += '<div class="row">';

		inlineHtml += '<div class="col-sm-4 showMPTicket_box">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="showMPTicket_box">Show/Hide | MP Ticket Column</span>';
		inlineHtml +=
			'<button type="button" id="showMPTicket_box" class="toggle-mp-ticket btn btn-success"><span class="span_class glyphicon glyphicon-plus"></span></button>';
		inlineHtml += "</div></div>";

		// // MAAP Allocation
		inlineHtml += '<div class="col-sm-5 showMAAP_box">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="showMAAP_box">Show/Hide | Matching MAAP Allocation</span>';
		inlineHtml +=
			'<button type="button" id="showMAAP_box" class="toggle-maap btn btn-success"><span class="span_class glyphicon glyphicon-plus"></span></button>';
		inlineHtml +=
			'<button type="button" id="showMAAP_box" class="toggle-maap-danger btn btn-danger"><span class="span_class glyphicon glyphicon-minus"></span></button>';
		inlineHtml += "</div></div>";

		//Toggle MAAP Bank Account
		inlineHtml += '<div class="col-sm-auto showMAAP_bank">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="showMAAP_bank">Show/Hide | MAAP Bank Account</span>';
		inlineHtml +=
			'<button type="button" id="showMAAP_bank" class="toggle-maap-bank btn btn-danger"><span class="span_class glyphicon glyphicon-minus"></span></button>';
		inlineHtml += "</div></div>";

		inlineHtml += "</div></div>";

		inlineHtml += "</div>";

		return inlineHtml;
	}

	/*
	 * PURPOSE : HTML code to generate the Modal Pop-up
	 *  PARAMS :  -
	 * RETURNS : HTML
	 *   NOTES :
	 */
	function addUserNotesModal() {
		var inlineHtml =
			'<div id="myModalUserNote" class="modal" style="display: none; position: fixed; z-index: 1; padding-top: 100px;left: 0;top: 0;width: 100%; height: 100%; overflow: auto; background-color: rgb(0,0,0); background-color: rgba(0,0,0,0.4); "><div class="modal-content" style="position: absolute;transform: translate(-50%, -50%);background-color: #fefefe;/* margin: auto; *//* padding: 0; */border: 1px solid #888;/* width: 80%; */left: 50%;top: 50%;/* box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19); */-webkit-animation-name: animatetop;-webkit-animation-duration: 0.4s;animation-name: animatetop;animation-duration: 0.4s;"><div class="modal-header" style="padding: 2px 16px;text-align: center;"><span class="close" style="color: black;float: right;font-size: 28px;font-weight: bold;"">&times;</span><h3 class="modal-title" id="modal-title">Add User Note</h3></div>';

		inlineHtml += '<div class="modal-body" style="padding: 2px 16px;">';

		inlineHtml += '<div class="form-group container row_call_back">';
		inlineHtml += '<div class="row">';

		inlineHtml += '<input type="text" id="customer_id" value="" hidden/>';

		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml += '<div class="form-group container row_call_back">';
		inlineHtml += '<div class="row">';

		inlineHtml +=
			'<div class="col-xs-12 task_notes"><div class="input-group"><span class="input-group-addon">NOTES </span><textarea class="form-control userNote" rows="4" cols="50"></textarea></div></div>';

		inlineHtml += "</div>";
		inlineHtml += "</div>";

		inlineHtml +=
			'</div><div class="modal-footer" style="padding: 2px 16px;"><input type="button" value="Save User Notes" class="form-control btn-primary" id="createNote" style="background-color: #095C7B; border-radius: 30px;"/></div></div></div>';

		return inlineHtml;
	}

	/**
	 * Used to pass the values of `date_from` and `date_to` between the scripts and to Netsuite for the records and the search.
	 * @param   {String} date_iso       "2020-06-01"
	 * @returns {String} date_netsuite  "1/6/2020"
	 */
	function dateISOToNetsuite(date_iso) {
		var date_netsuite = "";
		if (!isNullorEmpty(date_iso)) {
			var date_utc = new Date(date_iso);
			// var date_netsuite = nlapiDateToString(date_utc);
			var date_netsuite = format.format({
				value: date_utc,
				type: format.Type.DATE,
			});
		}
		return date_netsuite;
	}

	function GetFormattedDate(todayDate) {
		var month = pad(todayDate.getMonth() + 1);
		var day = pad(todayDate.getDate());
		var year = todayDate.getFullYear();
		return year + "-" + month + "-" + day;
	}

	function pad(s) {
		return s < 10 ? "0" + s : s;
	}

	function isNullorEmpty(val) {
		if (val == "" || val == null) {
			return true;
		} else {
			return false;
		}
	}
	return {
		onRequest: onRequest,
	};
});
