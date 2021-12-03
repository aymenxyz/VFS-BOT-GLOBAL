const puppeteer = require('puppeteer');

const telegramBot = require('./telegramBot');

const user = require('./config').user;

const antiCaptcha = require('./captcha');

const crawl = require('./config').crawl;


let page;

const userAgenet = require('user-agents');

const proxyGeonode = require('./config').geonode;


let mainUserAgent;

const timeouts = require('./config').timeouts;

let wifiSystem = require('./wifi');

let indexWifi = 0;

let buttonClicked = false;

const timeZone = 'Asia/Kolkata';


const fetchEmailOTP = require('./readDAtaEmail');

process.setMaxListeners(0);

let execHandle = false;

let currentProccess = 0;

let totalDaysFound = 0 ;

let finalCalander = false;

let totalAttempts = 0;

let currentAttempts = 1;

let confirmAttempts = 0;

let timeSelected = [];

let buttonRefreshCalanderClick = 0;

async function main(firstTime = false, relaunchBrowser = false) {
    if (firstTime) {
        startBot(firstTime);
    }
    else {
        startBot();
    }
};

async function startBot(firstTime = false, relaunchBrowser = false) {
    if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
        if (firstTime || relaunchBrowser) {
            const homeUrl = `https://www.vfsglobal.ca/IRCC-AppointmentWave1/`;
            const userAgent = new userAgenet();
            mainUserAgent = userAgent.toString();
            const args = [`--window-size=1920,1080`, `--user-agent=${mainUserAgent}`,`--no-sandbox`,'--disable-setuid-sandbox'];
            if (proxyGeonode.enabled) {
                args.push(`--proxy-server=${proxyGeonode.proxy}`)
            }
            browser = await puppeteer.launch(
                {
                    headless: true,
                    args: args,
                });

            page = await browser.newPage();
            if (firstTime) {
                process.on("unhandledRejection", async function (reason, p) {
                    console.log('unhadled', reason);
                    await startBot();

                });
            }


            if (proxyGeonode.enabled) {
                await page.authenticate({
                    username: proxyGeonode.username,
                    password: proxyGeonode.password
                });
            }
            await page.setDefaultNavigationTimeout(timeouts.navigationEnd);
            await page.setUserAgent(mainUserAgent);
            await page.setViewport({
                width: 1366, height: 768,
                deviceScaleFactor: 1,
            });
            if (firstTime) {
                page.on('dialog', async dialog => {
                    console.log('called dialog');
                    if (dialog) {
                        console.log(dialog.message());
                        buttonClicked = true;
                        confirmAttempts += 1;
                        await dialog.accept();
                        execHandle = false;
                        setTimeout(async () => {
                            console.log('exec handle dialog', execHandle);
                            if (!execHandle && !finalCalander) {
                                currentProccess += 1;
                                currentAttempts += 1;
                                await handleScript(browser, page, 0, currentProccess);
                            }
                        }, 3000);
                    }

                });

            }
            await page.goto(homeUrl, { waitUntil: 'networkidle0' });
            await antiCaptcha.checkBalance();
            await handleScript(browser, page, 0, currentProccess);

        }
        else {
            console.log('reloading');
            await page.reload({ waitUntil: 'networkidle0' });
            execHandle = false;
            setTimeout(async () => {
                console.log('exec handle reload', execHandle);
                if (!execHandle) {
                    currentProccess += 1;
                    await handleScript(browser, page, 0, currentProccess);
                }
            }, 3000);
        }
    }
}

main(true);


async function handleScript(browser, page, faledLogin = 0, handleProccess) {
    console.log(currentProccess, handleProccess);
    console.log('attempts', totalAttempts, currentAttempts % totalAttempts == 0, currentAttempts);
        if (currentProccess == handleProccess) {
            if (await checkBlocked(handleProccess, browser, page, '')) {
                const refs = getZones();
                if (refs && refs.length > 0) {
                    var loginResponse = await login(browser, page, handleProccess);
                    console.log('Login', loginResponse);
                    if (loginResponse && loginResponse == true) {
                        let index = 0;
                        const url = page.url().split('?')[0];
                        console.log('attempts ', buttonRefreshCalanderClick, confirmAttempts);
                        if (url.includes('Calendar/FinalCalendar') && confirmAttempts < 3 && buttonRefreshCalanderClick < 5) {
                            const greenSlotPromise = await getGreenSlot(browser, page, refs[index], 0, '', handleProccess);
                            console.log('greenSlotPromise', greenSlotPromise);
                            if (greenSlotPromise) {
                                await clickCalander(browser, page, handleProccess);
                            }
                            else {
                                currentProccess += 1;
                                await handleScript(browser, page, 0, currentProccess);
                            }
                        }
                        else {
                            console.log('not here calander', buttonRefreshCalanderClick, confirmAttempts);
                            if (totalDaysFound != 0){
                                telegramBot.sendMessage('Total Days Found : ' + totalDaysFound);
                            }
                            var uncompletedResponse = await getUncompletedUnappoitment(browser, page, refs[index], handleProccess);
                            console.log('uncompleted response', uncompletedResponse);
                            if (uncompletedResponse && confirmAttempts < 3) {
                                const greenSlotPromise = await getGreenSlot(browser, page, refs[index], 0, '', handleProccess);
                                console.log('greenSlotPromise', greenSlotPromise);
                                if (greenSlotPromise) {
                                    await clickCalander(browser, page, handleProccess);
                                }
                                else {
                                    currentProccess += 1;
                                    await handleScript(browser, page, 0, currentProccess);
                                }
                            }
                            else if ((!uncompletedResponse && confirmAttempts >= 3) || buttonRefreshCalanderClick > 5) {
                                telegramBot.sendMessage('Total Days Found : ' + totalDaysFound);
                                buttonRefreshCalanderClick = 0;
                                startBot();
                            }
                            else {
                                if (currentProccess == handleProccess) {
                                    execHandle = false;
                                    setTimeout(async () => {
                                        console.log('exec handle script', execHandle);
                                        if (!execHandle) {
                                            currentProccess += 1;
                                            await handleScript(browser, page, 0, currentProccess);
                                        }
                                    }, 3000);
                                }
                            }
                        }

                    }
                    else if (!loginResponse) {
                        if (faledLogin >= 1) {
                            if (currentProccess == handleProccess) {
                                main();
                            }
                        }
                        else {
                            const blocked = await checkBlocked(handleProccess, browser, page, 'Blocked');
                            if (blocked) {
                                if (currentProccess == handleProccess) {
                                    currentProccess += 1;
                                    execHandle = false;
                                    setTimeout(async () => {
                                        console.log('exec handle', execHandle);
                                        if (!execHandle) {
                                            currentProccess += 1;
                                            await handleScript(browser, page, 0, currentProccess);
                                        }
                                    }, 3000);
                                }
                            }
                        }
                    }
                }
            }
    }
}

async function clickCalander(browser, page, handleProccess) {
    const promiseCalander = await hundleCalander(browser, page, 0, 'Green Slot', handleProccess);
    console.log('promise Calander handle script', promiseCalander);
    execHandle = false;
    if (promiseCalander) {
        setTimeout(async () => {
            console.log('exec handle Calander', execHandle);
            if (!execHandle) {
                currentProccess += 1;
                await handleScript(browser, page, 0, currentProccess);
            }
        }, 3000);
    }
    else {
        console.log('currentP', currentProccess, handleProccess);
        if (currentProccess == handleProccess) {
            startBot();
        }
    }
}
async function getUncompletedUnappoitment(browser, page, refNumber, uncompletedProccess) {
    return new Promise(async resolve => {
        if (uncompletedProccess == currentProccess) {
            const url = page.url().split('?')[0];
            
            console.log('url', url);
            if (url.includes('Home') || url.includes('Index') || url.includes('Calendar/FinalCalendar') || url.includes('TrackApplication') || url.includes('ApplicantList')) {
                confirmAttempts = 0;
                execHandle = true;
                buttonRefreshCalanderClick = 0;
                totalDaysFound = 0;
                page.waitForSelector('li.inactive-link:last-child', { timeout: timeouts.selector })
                    .then(async () => {
                        console.log('selector found li');
                        const goToUncompleted = await clickelement('li.inactive-link:last-child');
                        if (goToUncompleted) {
                            page.waitForSelector('#successMessage', { timeout: 2000 })
                                .catch(async () => {
                                    page.waitForSelector('#AURN', { timeout: timeouts.selector })
                                        .then(async () => {
                                            console.log('selector found aurn', new Date().toString());
                                            await page.waitForTimeout(1000);
                                            const inputAURN = await page.$('#AURN');
                                            await inputAURN.click({ clickCount: 3 });
                                            const referenceNumber = await inputAURN.type(refNumber.ref, { delay: timeouts.event })
                                            const buttonClicked = await clickelement('input[type="submit"]');
                                            console.log('button aurn clicked');
                                            if (buttonClicked) {
                                                resolve(await handleTrackApplication(browser, page, uncompletedProccess));
                                            }
                                            else {
                                                resolve(false);
                                            }

                                        })
                                        .catch(async () => {
                                            console.log('selector not found aurn ', new Date().toString());
                                            resolve(false);
                                        })
                                })
                                .then(async (element) => {
                                    if (element) {
                                        const htmlElement = await page.evaluate(element => element.innerText, element);
                                        if (htmlElement && (htmlElement.includes('the maximum no') || htmlElement.includes('rendez-vous autorisés'))) {
                                            telegramBot.sendMessage('You booked an appointment :' + user.email);
                                        }
                                    }
                                })

                        }
                        else {
                            resolve(false);
                        }

                    })
                    .catch(async () => {
                        console.log('selector not found li');
                        resolve(false);
                    })

            }
            else if (url.includes('SearchAppointment')) {
                resolve(false);
            }
            else if (await checkBlocked(uncompletedProccess, browser, page, '') && url.includes('SearchAppointment') || url.includes('TrackApplication') || url.includes('Applicant/ApplicantList')) {
                resolve(false);
            }
            else {
                console.log('selector not url');
                resolve(false);
            }
        }
        

    })
}

async function handleTrackApplication(browser, page, trackProccess) {
    return new Promise(async resolve => {
        if (trackProccess == currentProccess) {
            execHandle = true;
            const url = page.url().split('?')[0];
            if (url.includes('TrackApplication') || url.includes('SearchAppointment')) {
                page.waitForSelector('a.btn', { timeout: timeouts.selector, visible: true })
                    .then(async () => {
                        const editClicked = await clickelement('a.btn');
                        if (editClicked) {
                            console.log('edit Clicked', editClicked);
                            resolve(await handleApplicationList(browser, page, trackProccess));
                        }
                        else {
                            resolve(false);
                        }

                    })
                    .catch(async () => {
                        resolve(false);
                    })

            }
            else {
                resolve(false);
            }
        }
        else {
            resolve(false);
        }
        
    })
}

async function handleApplicationList(browser, page, handleTrackApplicationProccess) {
    return new Promise(async resolve => {
        if (handleTrackApplicationProccess == currentProccess) {
            const url = page.url().split('?')[0];
            execHandle = true;
            if (await checkBlocked(handleTrackApplicationProccess, browser, page, '') && url.includes('SearchAppointment') || url.includes('TrackApplication') || url.includes('Applicant/ApplicantList')) {
                page.waitForSelector('input.submitbtn', { timeout: timeouts.selector, visible: true })
                    .then(async () => {
                        console.log('send and checking');
                        const otpErrorPromise = await page.$$('[style*="color: red; font-weight: normal;"]');
                        if (otpErrorPromise && otpErrorPromise.length > 0) {
                            const otp = await page.evaluate(el => el.innerText, otpErrorPromise[0]);
                            if (otp.includes('OTP')) {
                                const confirmClicked = await clickelement('input.submitbtn');
                                console.log('confirm Clicked otpe', confirmClicked);
                                page.waitForSelector('#OTPe', { timeout: 90000 })
                                    .then(async () => {
                                        fetchEmailOTP.getEmail(new Date(new Date().toLocaleString("en-US", { timeZone: timeZone })).getTime())
                                            .then(async (result) => {
                                                console.log('true');
                                                if (result && result.status) {
                                                    console.log(result);
                                                    await page.waitForTimeout(1000);
                                                    const inputOTPe = await page.$('#OTPe');
                                                    await inputOTPe.click({ clickCount: 3 });
                                                    const typeOtpePromise = await inputOTPe.type(result.otp, { delay: timeouts.event });
                                                    const buttonVerifyOTP = await clickelement('#txtsub');
                                                    telegramBot.sendMessage('OTP RETUREND');
                                                    resolve(true);
                                                }
                                                else {
                                                    console.log('result wrong');
                                                    resolve(false);
                                                }
                                            })

                                    })
                                    .catch(async () => {
                                        console.log('Otpe selector didnt found');
                                        resolve(false);
                                    })
                            }
                            else {
                                const confirmClicked = await clickelement('input.submitbtn');
                                console.log('text found but otp not included')
                                resolve(false);
                            }
                        }
                        else {
                            const confirmClicked = await clickelement('input.submitbtn');
                            console.log('didnt find any find any otp error')
                            resolve(false);
                        }


                    })
                    .catch(async () => {
                        console.log('didnt find any selector for button');
                        resolve(false);
                    })

            }
            else if (url.includes('Calendar/FinalCalendar')) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        }
        else {
            resolve(false);
        }
    })
}

async function getGreenSlot(browser, page, refNumber, index, output, greenProccess) {
    return new Promise(async resolve => {
        if (greenProccess == currentProccess) {
            const url = await page.url().split('?')[0];
            console.log('here', url, index);
            execHandle = true;
            if (await checkBlocked(greenProccess, browser, page, 'Get Green Slot', false) && (url.includes('Calendar/FinalCalendar') || url.includes('Applicant/ApplicantList')) || url.includes('IRCC-AppointmentWave1/')) {
                page.waitForSelector('td.fc-day', { timeout: timeouts.selector, visible: true })
                    .then(async (elementTdDays) => {
                        console.log('time selected', timeSelected);
                        totalDaysFound += (await page.$$('td.fc-day')).length;
                        const slotAvailablePromise = await page.$$('[style*="rgb(188, 237, 145)"]');
                        if (slotAvailablePromise && slotAvailablePromise.length > 0) {
                            telegramBot.sendMessage('Found Slot');
                            const clickAppointmentPromise = await clickAppointment(browser, page, slotAvailablePromise, greenProccess);
                            console.log('ended', clickAppointmentPromise);
                            if (clickAppointmentPromise) {
                                await confirmAppointment(browser, page);
                            }
                            else {
                                resolve(false);
                            }
                        }
                        else if (index < 1) {
                            page.waitForSelector('span.fc-button-next', { timeout: timeouts.selector, visible: true })
                                .then(async () => {
                                    const nextArrowClicked = await clickelement('span.fc-button-next');
                                    const getGreenSlotPromise = await getGreenSlot(browser, page, refNumber, index + 1, output, greenProccess);
                                    console.log('getGreenPromise', getGreenSlotPromise);
                                    resolve(getGreenSlotPromise);
                                })
                                .catch(async () => {
                                    console.log('false greenslot 4')
                                    resolve(false);
                                })
                        }
                        else {
                            setTimeout(async () => {
                                resolve(true);
                            }, 100)
                        }
                    })
                    .catch(async () => {
                        console.log('false greenslot 1')
                        resolve(false);
                    })
            }
            else {
                console.log('false greenslot 2');
                resolve(false);
            }
        }
        else {
            console.log('false greenslot 3')
            resolve(false);
        }
    })
}

async function clickAppointment(browser, page, slotAvailablePromise, proccess) {
    return new Promise(async resolve => {
        await slotAvailablePromise[0].click();
        page.waitForSelector('input[name="selectedTimeBand"]', { timeout: timeouts.selector })
            .then(async () => {
                confirmAttempts = 0;
                const timeRangePromise = await page.$$('input[name="selectedTimeBand"]');
                console.log('timeRange Promise', timeRangePromise.length);
                const randomNumber = await shuffle(0, timeRangePromise.length);
                await timeRangePromise[randomNumber].click();
                finalCalander = true;
                await hundleCalander(browser, page, 0, 'click Appointment', proccess, true);
                const promiseFinalConfirm = await appointmentPage(browser, page);
                if (promiseFinalConfirm) {
                    resolve(true);
                }
                else {
                    finalCalander = false;
                    resolve(false);
                }
            })
            .catch(async () => {
                finalCalander = false;
                console.log('error click app');
                resolve(false);
            })
    })
}

async function shuffle(start, end) {
    return new Promise(async resolve => {
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        if (randomNumber >= start && randomNumber <= end && timeSelected.indexOf(randomNumber) == -1) {
            timeSelected.push(randomNumber);
            resolve(randomNumber);
        }
        else {
            resolve(await shuffle(start, end));
        }
    })
}
async function appointmentPage(browser, page) {
    return new Promise(async (resolve) => {
        const url = await page.url().split('?')[0];
        if (url.includes('Calendar/FinalConfirmation')) {
            finalCalander = true;
            telegramBot.sendMessage('You booked an appointment :' + user.email);
            page.waitForSelector('div.frm-agree', { timeout: 50000 })
                .then(async () => {

                    resolve(true);
                })
                .catch(async () => {
                    finalCalander = false;
                    confirmAttempts = 0;

                    timeRangeSelected += 1;
                    resolve(false);
                })
        }
        else {
            finalCalander = false;
            confirmAttempts = 0;
            timeRangeSelected += 1;
            resolve(false);
        }
    })

}

async function confirmAppointment(browser, page) {
    await page.waitForTimeout(2000);
    const confirmAppointment = await page.$$('[style*="text-decoration: underline"]');
    if (confirmAppointment && confirmAppointment.length > 0) {
        await confirmAppointment[0].click();
    }
}

async function hundleCalander(browser, page, attempts = 0, called, calanderProccess, confirmPage) {
    return new Promise(async (resolve) => {
        execHandle = true;
        if (calanderProccess == currentProccess) {
            let timeout;
            if (confirmPage) {
                timeout = 1;
            }
            else {
                timeout = timeouts.refreshCalender;
            }
            console.log('hundle Calander', called);
            await page.waitForTimeout(timeout);
            const pageConfirmClick = await clickelement('#btnConfirm');
            if (pageConfirmClick) {
                console.log('button clicked');
                setTimeout(async () => {
                    console.log(buttonClicked, 'attempts ', attempts, 'date ; ', new Date().toString());
                    if (!buttonClicked) {
                        buttonClicked = false;
                        resolve(await hundleCalander(browser, page, attempts + 1, 'button not clicked', calanderProccess));
                    }
                    else {
                        setTimeout(() => {
                            buttonRefreshCalanderClick += 1;
                            resolve(true);
                        }, 100);
                    }
                }, 500);
            }
            else {
                console.log('didnt found select');
                setTimeout(async () => {
                    resolve(await hundleCalander(browser, page, attempts + 1, 'selector didnt found', calanderProccess));
                }, timeouts.refreshCalenderError)
            }
        }
        else {
            buttonRefreshCalanderClick += 1;
            resolve(true);
        }

    })

}

async function loginForm(url, page, loginProccess) {
    return new Promise(async (resolve) => {
        if (loginProccess == currentProccess) {
            execHandle = true;
            console.log('called');
            page.waitForSelector('#EmailId', { timeout: timeouts.selector, visible: true })
                .then(async () => {
                    const checkRecpatcha = await page.evaluate(() => {
                        const typeRecaptcha = document.querySelector('.customcapcha');
                        if (typeRecaptcha && typeRecaptcha != null) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                    );
                    var recaptchaSolver;
                    if (checkRecpatcha) {
                        const captchaImg = await page.$('.main-container');
                        const base64String = await captchaImg.screenshot({ encoding: "base64" });
                        recaptchaSolver = await antiCaptcha.solveCaptchaImage(base64String);
                    }
                    else {
                        recaptchaSolver = await antiCaptcha.solveCaptchaGoogle(url, proxyGeonode.proxy, '9000', proxyGeonode.username, proxyGeonode.password, mainUserAgent);
                    }
                    if (recaptchaSolver && recaptchaSolver.status == true) {
                        console.log(recaptchaSolver);
                        const email = user.email;
                        const password = user.password;
                        await page.waitForTimeout(500);
                        const inputEmail = await page.$('#EmailId');
                        await inputEmail.click({ clickCount: 3 });
                        const emailTyped = await inputEmail.type(email, { delay: timeouts.event });
                        await page.waitForTimeout(500);
                        const inputPassword = await page.$('#Password');
                        await inputPassword.click({ clickCount: 3 });
                        const passwordTyped = await inputPassword.type(password, { delay: timeouts.event });
                        if (checkRecpatcha) {
                            await page.waitForTimeout(500);
                            const inputCaptcha = await page.$('#CaptchaInputText');
                            await inputCaptcha.click({ clickCount: 3 });
                            const captchaImageTyped = await inputCaptcha.type(recaptchaSolver.captcha.toUpperCase(), { delay: timeouts.event });
                        }
                        else {
                            await page.$eval('#g-recaptcha-response', (element, recaptchaSolver) => {
                                element.value = recaptchaSolver;
                            }, recaptchaSolver.captcha);
                        }
                        const buttonClicked = await clickelement('input.submitbtn');
                        const waitForNavigation = await page.waitForNavigation({ timeout: timeouts.selector });
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                })
                .catch(async (err) => {
                    console.log('err');
                    resolve(false);
                })
        }
        else {
            resolve(false);
        }
    });
}

async function login(browser, page, loginProccess) {
    return new Promise(async resolve => {
        console.log(currentProccess, loginProccess);
        if (loginProccess == currentProccess) {
            const url = page.url().split('?')[0];
            console.log('Login', url);
            execHandle = true;
            if ((url.includes('RegisteredLogin') || !url.includes('Home') || url == 'https://www.vfsglobal.ca/IRCC-AppointmentWave1/') && (!url.includes('Calendar/FinalCalendar') && (!url.includes('TrackApplication') && (!url.includes('Applicant/ApplicantList') && (!url.includes('SearchAppointment')))))) {
                const erroEvaulute = await page.$$('div.validation-summary-errors');
                if (erroEvaulute && erroEvaulute.length > 0) {
                    const htmlElement = await page.evaluate(element => element.innerText, erroEvaulute[0]);
                    console.log(htmlElement);
                    if (htmlElement && htmlElement.includes('2')) {
                        main();
                    }
                    else {
                        const loginFormPromise = await loginForm(await page.url(), page, loginProccess);
                        if (!loginFormPromise) {
                            resolve(false);
                        }
                        else {
                            resolve(await login(browser, page, loginProccess));
                        }
                    }

                }
                else {
                    const loginFormPromise = await loginForm(await page.url(), page, loginProccess);
                    if (!loginFormPromise) {
                        resolve(false);
                    }
                    else {
                        resolve(await login(browser, page, loginProccess));
                    }
                }


            }
            else if ((url.includes('Home') || url.includes('Calendar/FinalCalendar') || url.includes('SearchAppointment') || url.includes('Index') || url.includes('TrackApplication') || url.includes('Applicant/ApplicantList'))) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        }
    })

}

async function checkBlocked(handleProccess, browser, page, from, execMain = true) {
    return new Promise(async resolve => {
        const title = await getPageTitle(page);
        console.log('title',title);
        if (title == 'VFS : Exception Found') {
            process.exit(1);
        }
        else if (title.includes('ERROR: The request could not be satisfied')) {
            process.exit();
        }
        else if (title == '') {
            process.exit(1);
        }
        else {
            execHandle = true;
            page.waitForSelector('.logovfs', { timeout: timeouts.pageBlocked, visible: true })
                .then(async element => {
                    const htmlElement = await page.evaluate(element => element.getAttribute('title'), element);
                    if (htmlElement && htmlElement.includes('vfs global complaint management system')) {
                        resolve(true);
                    }
                    else {
                        console.log('currentP', currentProccess, handleProccess, execMain);
                        if (execMain && currentProccess == handleProccess) {
                            main();
                        }
                        resolve(false);
                    }

                })
                .catch(async err => {
                    console.log('BLOCKED 1 HOUR');
                    process.exit();
                });
        }
    })
}

async function getPageTitle(page, attempts = 0) {
    return new Promise(async resolve => {
        if (attempts < 20) {
            await page.waitForTimeout(500);
            page.title()
                .then(title => {
                    resolve(title);
                })
                .catch(async err => {
                    resolve(await getPageTitle(page, attempts + 1));
                })
        }
        else {
            resolve('');
        }
    })
}

async function clickelement(elementSelector, attemtps = 0) {
    return new Promise(async resolve => {
        if (attemtps < 2) {
            await page.waitForTimeout(1000);
            page.waitForSelector(elementSelector, { timeout: timeouts.selector })
                .then(async () => {
                    page.click(elementSelector, { deley: timeouts.event })
                        .then(async () => {
                            resolve(true);
                        })
                        .catch(async () => {
                            resolve(await clickelement(elementSelector, attemtps + 1));
                        })
                })
                .catch(async () => {
                    resolve(await clickelement(elementSelector, attemtps + 1));
                })
        }
        else {
            resolve(false);
        }

    })
}


function getZones() {
    return require('./config').zones.filter(zone => zone.enabled)
        .sort((a, b) => a.order - b.order)
}

function buildTotalAttempts() {
    totalAttempts = wifiSystem.calculateAttempts();
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}
buildTotalAttempts();







