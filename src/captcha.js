const antiCaptcha = require('@antiadmin/anticaptchaofficial');

const catpchaConfig = require('./config').antiCaptcha;

antiCaptcha.setAPIKey(catpchaConfig.api_key);

const proxyConfig = require('./config').geonode;

module.exports.checkBalance = () => {
    if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
    antiCaptcha.getBalance()
        .then(balance => {
            console.log('Your remaining balance in anti captcha is : ',balance + ' USD');
        })
        .catch(err => {
            //console.log(err);
        })
    }
}

module.exports.solveCaptchaImage = (body) => {
    if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
    return new Promise((resolve) => {
        antiCaptcha.solveImage(body)
            .then((captcha => {
                resolve({ status: true, captcha: captcha });
            }))
            .catch(err => {
                console.log(err);
                resolve({ status: false });
            })
    })
}
}

module.exports.solveCaptchaGoogle = (url,proxyAdress,proxyPort,proxyLogin,proxyPassword,userAgent) => {
    if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
    return new Promise(async(resolve) => {
        if (proxyConfig.enabled){
            resolve(await solveCaptchaGoogleProxy(url,proxyAdress,proxyPort,proxyLogin,proxyPassword,userAgent));
        }
        else {
            resolve(await solveCaptchaGoogleNoProxy(url));
        }
    })
}
}


function solveCaptchaGoogleProxy(url,proxyAdress,proxyPort,proxyLogin,proxyPassword,userAgent) {
    if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
    return new Promise((resolve) => {
        antiCaptcha.solveRecaptchaV2ProxyOn(url,
            catpchaConfig.googleKey,
            'http',
            proxyAdress,
            proxyPort,
            proxyLogin,
            proxyPassword,
            userAgent,
            )
            .then((captcha => {
                resolve({ status: true, captcha: captcha });
            }))
            .catch(err => {
                console.log(err);
                resolve({ status: false });
            })
    })
}
}

function solveCaptchaGoogleNoProxy(url) {
    if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
    return new Promise((resolve) => {
        antiCaptcha.solveRecaptchaV2Proxyless(url,catpchaConfig.googleKey)
            .then((captcha) => {
                resolve({ status: true, captcha: captcha });
            })
            .catch(err => {
                console.log(err);
                resolve({ status: false });
            })
    })
}
}
