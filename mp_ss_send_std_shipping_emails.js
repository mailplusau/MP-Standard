/**
 * Module Description
 * 
 * NSVersion    Date            			Author         
 * 1.00       	2020-07-20 18:06:05   		Ankith
 *
 * Description:         
 * 
 * @Last Modified by:   Ankith Ravindran
 * @Last Modified time: 2021-10-18 14:26:31
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

    //NS Search: All Customer Contacts - With Emails
    var allContactsWithEmails = nlapiLoadSearch('contact', 'customsearch_contacts_mpex_contacts_2_2');

    // var addFilterExpression = new nlobjSearchFilter('partner', 'customer', 'anyof',
    //     ["1669342", "1595753"]);
    // allContactsWithEmails.addFilter(addFilterExpression);

    var resultSetAllContactsWithEmails = allContactsWithEmails.runSearch();

    resultSetAllContactsWithEmails.forEachResult(function (searchResult) {

        var contactInternalId = searchResult.getValue("internalid");
        var contactName = searchResult.getValue("entityid");
        var contactFirstName = searchResult.getValue("firstname");
        var contactLastName = searchResult.getValue("lastname");
        var contactPhone = searchResult.getValue("phone");
        var contactEmail = searchResult.getValue("email");
        var customerInternalId = searchResult.getValue("internalid", "customer", null);
        var customerName = searchResult.getValue("companyname", "customer", null);
        var customerZee = searchResult.getValue("partner", "customer", null);
        var contactRole = searchResult.getValue("contactrole");
        var contactPortalAdmin = searchResult.getValue("custentity_connect_admin");
        var contactPortalUser = searchResult.getValue("custentity_connect_user");

        nlapiLogExecution('AUDIT', 'contactPortalAdmin', contactPortalAdmin);
        nlapiLogExecution('AUDIT', 'contactPortalUser', contactPortalUser);

        var customerPhone = searchResult.getValue("phone", "customer", null);

        var recCustomer = nlapiLoadRecord('customer', customerInternalId);
        companyname = recCustomer.getFieldValue('companyname');
        customerID = recCustomer.getFieldValue('entityid')
        account_email = recCustomer.getFieldValue('email');
        service_email = recCustomer.getFieldValue('custentity_email_service');

        var mainPhone = null;
        if (isNullorEmpty(contactPhone)) {
            mainPhone = customerPhone
        } else {
            mainPhone = contactPhone
        }

        if (customerZee == 794958) {
            var file = nlapiCreateEmailMerger(366);
            nlapiLogExecution('AUDIT', 'contactPortalAdmin', contactPortalAdmin);
            nlapiLogExecution('AUDIT', 'contactPortalUser', contactPortalUser);
            nlapiLogExecution('AUDIT', 'byron users');
        } else {
            if (isNullorEmpty(contactPortalAdmin) && isNullorEmpty(contactPortalUser)) {
                nlapiLogExecution('AUDIT', 'contactPortalAdmin', contactPortalAdmin);
                nlapiLogExecution('AUDIT', 'contactPortalUser', contactPortalUser);
                nlapiLogExecution('AUDIT', 'manual users');
                var file = nlapiCreateEmailMerger(365);
            } else {
                nlapiLogExecution('AUDIT', 'contactPortalAdmin', contactPortalAdmin);
                nlapiLogExecution('AUDIT', 'contactPortalUser', contactPortalUser);
                nlapiLogExecution('AUDIT', 'portal users');
                var file = nlapiCreateEmailMerger(364);
            }
        }

        var mergeResult = file.merge();

        emailHtml = mergeResult.getBody();
        subject = mergeResult.getSubject();

        emailHtml = emailHtml.replace(/<nlemcustomerid>/gi, customerID);

        // if (!isNullorEmpty(contactEmail)) {
        //     var expInterest = '<a class="mcnButton " href="https://mailplus.com.au/sign-up-to-the-free-mailplus-portal/?custinternalid=' + customerInternalId + '&custid=' + customerID + '&custname=' + companyname + '&email=' + contactEmail + '&fname=' + contactFirstName + '&lname=' + contactLastName + '&phone=' + mainPhone + '" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;display: block;" target="_blank" title="Request portal access">Request portal access</a>'
        // }

        if (isNullorEmpty(account_email) && isNullorEmpty(service_email)) {

        } else {

            if (!isNullorEmpty(account_email)) {
                var expInterest = '<a class="mcnButton " href="https://mailplus.com.au/expression-of-interest/?custinternalid=' + oldCustomerId + '&custid=' + customerID + '&custname=' + companyname + '&email=' + account_email + '" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;display: block;" target="_blank" title="Expression of Interest">Expression of Interest</a>'
            } else if (!isNullorEmpty(service_email)) {
                var expInterest = '<a class="mcnButton " href="https://mailplus.com.au/expression-of-interest/?custinternalid=' + oldCustomerId + '&custid=' + customerID + '&custname=' + companyname + '&email=' + service_email + '" style="font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;display: block;" target="_blank" title="Expression of Interest">Expression of Interest</a>'
            }
        }

        nlapiLogExecution('DEBUG', 'expInterest', expInterest)
        emailHtml = emailHtml.replace(/<nlemexpbutton>/gi, expInterest);

        var emailAttach = new Object();
        emailAttach['entity'] = customerInternalId;

        if (!isNullorEmpty(contactEmail)) {
            nlapiSendEmail(112209, contactEmail, subject, emailHtml, null, null, emailAttach, null, true);
        }

        var recContact = nlapiLoadRecord('contact', contactInternalId);
        recContact.setFieldValue('custentity_email_sent', 1);
        nlapiSubmitRecord(recContact);


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