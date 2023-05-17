/**
 * Module Description
 * 
 * NSVersion    Date            			Author         
 * 1.00       	2022-10-20 18:06:05   		Ankith
 *
 * Description: Send EDM for Standard Shipping Solutions to customers.
 * 
 *
 */



var adhoc_inv_deploy = 'customdeploy2';
var prev_inv_deploy = null;
var ctx = nlapiGetContext();

function sendEmailSS() {

    var oldCustomerId = null;
    var oldEmail = null;

    var count = 0;
    var oldDeliverySpeed = null;
    prev_inv_deploy = ctx.getDeploymentId();

    //NS Search: Active Customers List - Standard Shipping Solution - Express Interest
    var customerSearch = nlapiLoadSearch('customer', 'customsearch_active_cust_list_std_ship');

    var resultSetCustomer = customerSearch.runSearch();

    resultSetCustomer.forEachResult(function (searchResult) {

        var custid = searchResult.getValue('internalid');
        var entityid = searchResult.getValue('entityid');
        var companyname = searchResult.getValue('companyname');

        var recCustomer = nlapiLoadRecord('customer', custid);
        var sales_email = recCustomer.getFieldValue('custentity_email_sales');
        var service_email = recCustomer.getFieldValue(
            'custentity_email_service');
        var account_email = recCustomer.getFieldValue('email');

        //Email template: Standard Shipping Solution - MEL - Express Interest
        var file = nlapiCreateEmailMerger(373);


        var mergeResult = file.merge();

        emailHtml = mergeResult.getBody();
        subject = mergeResult.getSubject();

        emailHtml = emailHtml.replace(/<nlemcustomerid>/gi, entityid);

        if (isNullorEmpty(service_email) && isNullorEmpty(sales_email) && isNullorEmpty(account_email)) {

        } else {

            if (!isNullorEmpty(service_email)) {
                var expInterest = '<a class="mcnButton " href="https://mailplus.com.au/expression-of-interest/?custinternalid=' + custid + '&custid=' + entityid + '&custname=' + companyname + '&email=' + service_email + '" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;display: block;" target="_blank" title="Expression of Interest">I\'m Interested</a>'
            } else if (!isNullorEmpty(sales_email)) {
                var expInterest = '<a class="mcnButton " href="https://mailplus.com.au/expression-of-interest/?custinternalid=' + custid + '&custid=' + entityid + '&custname=' + companyname + '&email=' + sales_email + '" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;display: block;" target="_blank" title="Expression of Interest">I\'m Interested</a>'
            } else {
                var expInterest = '<a class="mcnButton " href="https://mailplus.com.au/expression-of-interest/?custinternalid=' + custid + '&custid=' + entityid + '&custname=' + companyname + '&email=' + account_email + '" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;display: block;" target="_blank" title="Expression of Interest">I\'m Interested</a>'
            }
        }

        nlapiLogExecution('DEBUG', 'expInterest', expInterest)
        emailHtml = emailHtml.replace(/<nlemexpbutton>/gi, expInterest);

        var emailAttach = new Object();
        emailAttach['entity'] = custid;

        if (!isNullorEmpty(service_email)) {
            nlapiSendEmail(112209, service_email, subject, emailHtml, null, null, emailAttach, null, true);
        } else if (!isNullorEmpty(sales_email)) {
            nlapiSendEmail(112209, sales_email, subject, emailHtml, null, null, emailAttach, null, true);
        } else {
            nlapiSendEmail(112209, account_email, subject, emailHtml, null, null, emailAttach, null, true);
        }

        recCustomer.setFieldValue('custentity_letter_sent', 1);
        recCustomer.setFieldValue('custentity_mass_email_sent', 1);
        nlapiSubmitRecord(recCustomer);

        oldCustomerId = null;
        oldEmail = null;

        var params = {

        }

        reschedule = rescheduleScript(prev_inv_deploy, adhoc_inv_deploy, params);
        nlapiLogExecution('AUDIT', 'count', count);
        nlapiLogExecution('AUDIT', 'Reschedule Return', reschedule);
        if (reschedule == false) {
            return false;
        }

        count++;
        return true;
    });

}

function getDate() {
    var date = new Date();
    if (date.getHours() > 6) {
        date = nlapiAddDays(date, 1);
    }
    date = nlapiDateToString(date);

    return date;
}