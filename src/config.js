module.exports = {
    // Anti Captcha Service to solve captcha and recaptcha don't change the parameters unless you want to change only the api key.
    antiCaptcha: {
        api_key: 'fbd0950881554d60da564f79596ec700',
        googleKey: '6Ld-Kg8UAAAAAK6U2Ur94LX8-Agew_jk1pQ3meJ1',
    },

    //User VFS GLobal login email and password. Keep in mind Changing the user leads to change the references number.
    //emailType:1 For yahoo, emailType:2 for outlook
    // emailPassword for yaho is app password. for outlook is just the password of the email.
    user: {
        emailType:2,
        email: 'aymenxyzbkl1997-1@outlook.fr',
        password: 'PassWord@123',
        emailPassword:'261997Xyz'
    },

    // Telegram where you have the token of your bot and also the chat id where you want to send Messages.
    telegram: {
        token: '2142964849:AAFN-ZLtkmWGkyO3e4g9APmC52lkeBId1PY',
        chatId1: 1164963892,
        chatId: 2092758106
    },

    // Geonode proxy where you can specify the proxy ip and port. username and password.
    // enabled option is for to enable the proxy or disable the proxy.
    // enabled: true to enable the proxy.
    // enabled: false to disable the proxy
    geonode: {
        proxy: 'premium-residential.geonode.com:9000',
        username: 'geonode_OZmeKWEN9C',
        password: '7e92ab2a-dae6-4fb7-b38b-94735c87ca2d',
        enabled: false
    },
    // Timeouts are used for the page to wait for a certain elements to appear. If that elements is visible than he will proccedd the proccess otherwise he will restart.
    // Keep in mind that if your website is very slow due to network or proxy you can increase the number for each elements. Or the bot won't work as expected.
    // timeouts are used in ms so 3 seconds is 3000 ms
    // selector option is used for any html element (text,button,image ..)
    // page option stands for to wait for the page to be fully loaded
    // event option stands for button click, link click or typing.
    // restart bot option stands for if the bot finished the proccess than he will restart again.
    // pageBlocked stands for if the bot detects any erros. He will restart the browser.

    timeouts: {
        selector: 10000,
        page: 20000,
        event: 0,
        navigationEnd: 90000,
        restartBot: 350000,
        pageBlocked: 15000,
        timeBetweenZones:2000,
        refreshCalenderError:1000,
        refreshCalender:30000,
    },

    // Zones are defined by ref,zone and enabled
    // ref is the references number that vfs global will give you for the zones.
    // zone is the name. Keep in mind that you receive a notification in telegram regarding that zone.
    // enabled if you want to enable or disable the zone to be refreshed. must be true or false.
    // If you want to change the order of zones in the order option you can specify the position of this zone (must be in numbers).

    timeOutChangeWifi: {
        timeout: 3
    },
    zones: [
        {
            ref: 'JALC1269607718983',
            zone: 'jalndhar',
            enabled:true,
            order: 2
        }]

 //HYDE1257119986539
 //JALC1250160019700
}