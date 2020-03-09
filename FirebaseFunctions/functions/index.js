const functions = require('firebase-functions');

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

//to make it work you need gmail account
const gmailEmail = functions.config().gmail.login;
const gmailPassword = functions.config().gmail.pass;

admin.initializeApp();

//creating function for sending emails
var sendAlertEmail = function (itemId, itemRemaining, units, to, name) {
	//Body of the email
	var body = `<h4>Hi ${name},</h4>`;
	body += `<h5>${itemId} is running low, please refill before it runs out.<br>There is only ${itemRemaining} ${units} remaining at the moment.</h5>`;
	body += `<h5>Kind Regards SmartServe Team</h5>`;

//transporter is a way to send your emails
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailEmail,
            pass: gmailPassword
        }
    });

    // setup email data with unicode symbols
    //this is how email is going to look like
    const mailOptions = {
        from: gmailEmail, // sender address
        to: to, // email of receiver
        subject: "Item Running Low!", // Subject line
        html: body // html body
    };

    //this is callback function to return status to firebase console
    const getDeliveryStatus = function (error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    };

    //call of this function sends an email, and returns status
    transporter.sendMail(mailOptions, getDeliveryStatus);
};

//.onPreOrderPaid watches for updates in PreOrders collection
exports.onLimitReached = functions.firestore.document("LaPiazzaInventory/{itemId}").onUpdate(function (change, context) {
	const itemId = context.params.itemId;
	if (itemId == "Categories") {
		return;
	}
	const newData = change.after.data();
	const newValue = newData.remainingItems;
	const itemUnits = newData.unitOfMeasure;
	const limitObj = newData.lowerLimit;
	const limitVal = limitObj.limitValue;
	var topUpperB = +limitVal + (+limitVal * 0.1);
	var topLowerB = +limitVal - (+limitVal * 0.1);
	var midUpperB = (+limitVal / 2) + (+limitVal * 0.1);
	var midLowerB = (+limitVal / 2) - (+limitVal * 0.1);
	var leastBound = +limitVal * 0.1;
	if (newValue >= topLowerB && newValue <= topUpperB) {
		sendAlertEmail(itemId, newValue, itemUnits, "zulqarnainjutt16@gmail.com", "Zulqarnain Majeed");
	}else if (newValue >= midLowerB && newValue <= midUpperB) {
		sendAlertEmail(itemId, newValue, itemUnits, "zulqarnainjutt16@gmail.com", "Zulqarnain Majeed");
	}else if (newValue <= leastBound) {
		sendAlertEmail(itemId, newValue, itemUnits, "zulqarnainjutt16@gmail.com", "Zulqarnain Majeed");
	}
});