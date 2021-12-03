var Imap = require("imap"),
    inspect = require('util').inspect;


const { simpleParser } = require('mailparser');


process.setMaxListeners(0);

const timeZone = 'Asia/Kolkata';

process.on('uncaughtException', (error, origin) => {
    console.log('----- Uncaught exception -----')
    console.log(error)
    console.log('----- Exception origin -----')
    console.log(origin)
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('----- Unhandled Rejection at -----')
    console.log(promise)
    console.log('----- Reason -----')
    console.log(reason)
});
const user = require('./config').user;





function openInbox(cb,imap) {
    imap.openBox('INBOX', true, cb);
}
module.exports.getEmail = function getEmail(timeStarted, attempts = 0) {
    return new Promise((resolve) => {
        let imapConfig;
        if (user.emailType == 1){
        imapConfig = {
            user: user.email,
            password: user.emailPassword,
            host: 'imap.mail.yahoo.com',
            port: 993,
            tls: true,
            authTimeout:40000,
            connTimeout:40000,
            keepAlive:false
        };
    }
    else if (user.emailType == 2){
        imapConfig = {
            user: user.email,
            password: user.emailPassword,
            host: 'imap-mail.outlook.com',
            port: 993,
            tls: true,
            authTimeout:40000,
            connTimeout:40000,
            keepAlive:false
        };
    }
        const imap = new Imap(imapConfig);
        try {
        if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
        let emailDate;
        let otpMain;
        let extraSeconds;
        imap.once('ready', function () {
            openInbox(function (err, box) {
                if (err) throw err;
                console.log(box.messages.total);
                var f = imap.seq.fetch(box.messages.total + ':*', {
                    bodies: ['TEXT'],
                    struct: true
                });
                f.on('message', function (msg) {
                    console.log('Message');
                    var prefix = 'test ';
                    msg.on('body', function (stream, info) {
                        simpleParser(stream, async (err, parsed) => {
                            const regex = /[0-9]{6}/g;
                            const text = parsed.text;
                            if (text) {
                                console.log('yes');
                                const otp = text.match(regex);
                                if (otp && otp.length > 0) {
                                    console.log('haha');
                                    otpMain = otp[0];
                                }
                            }


                        });
                        var buffer = '';
                        stream.on('data', function (chunk) {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', function () {
                            //console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                        });
                    });
                    msg.once('attributes', function (attrs) {
                            console.log(attrs);
                            emailDate = Number(inspect(new Date(new Date(attrs.date).toLocaleString("en-US",{timeZone:timeZone})).getTime(), false, 8));
                            extraSeconds = Number(inspect(new Date(attrs.date).getSeconds(), false, 8));
                            console.log(prefix + 'Attributes: %s', inspect(new Date(attrs.date).toLocaleDateString(), false, 8),emailDate,extraSeconds);
                        
                    });
                    msg.once('end', function () {
                        //console.log(prefix + 'Finished');
                    });
                });
                f.once('error', function (err) {
                    //console.log('Fetch error: ' + err);
                });
                f.once('end', async function () {
                    setTimeout(async () => {
                        console.log(otpMain, timeStarted, emailDate, timeStarted + (3 * 60 * 1000),extraSeconds);
                        if (attempts < 36) {
                            if ((timeStarted < emailDate + (extraSeconds *  1000)) && otpMain) {
                                resolve({ status: true, otp: otpMain });
                                
                            }
                            else {
                                setTimeout(async () => {
                                    resolve(await getEmail(timeStarted, attempts + 1));
                                }, 5000);
                                imap.destroy();
                                imap.end();
                            }
                        }
                        else {
                            resolve({ status: false });
                        }
                        console.log('Done fetching all messages!');
                        imap.end();
                        imap.destroy();
                    },1500)

                });
            },imap);
        });

        imap.once('error', function async  (err) {
            console.log(attempts,'error',err);
            if (attempts < 36) {
                if ((timeStarted < emailDate + (extraSeconds *  1000)) && otpMain) {
                    resolve({ status: true, otp: otpMain });
                    imap.destroy();
                    imap.end();
                }
                else {
                    setTimeout(async () => {
                        resolve(await getEmail(timeStarted, attempts + 1));
                    }, 5000);
                    imap.destroy();
                    imap.end();
                }
            }
            else {
                resolve({ status: false });
                imap.destroy();
                imap.end();
            }
        });

        imap.once('end', function () {
            console.log('Connection ended');
        });

        imap.connect();
    }
}
catch(e) {
    console.log(e);
    resolve({ status: false });
}
})
    
}


