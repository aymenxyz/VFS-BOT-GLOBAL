const wifi = require('node-wifi');

const wifiNetworks = require('./wifiConfig').networks.filter(network => network.enabled).sort((a, b) => a.order - b.order);

const timeouts = require('./wifiConfig').timeouts;

const totalAttempts = require('./config').timeOutChangeWifi;

const refreshTimeout = require('./config').timeouts.refreshCalender;

wifi.init({
    iface: null
});


module.exports = {

    getAllWifi: (firstTime = false) => {
        if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
        return new Promise(async (resolve, reject) => {
            if (!firstTime){
                await disconnectWifi();
                console.log('disconnected');
            }
            wifi.scan()
                .then(async networks => {
                    const activeNetworks = wifiNetworks.filter(wifiNetwork => networks.find(network => wifiNetwork.SSID == network.ssid));
                    console.log(activeNetworks);
                    setTimeout(() => {
                        resolve({ status: true, activeNetworks: activeNetworks });
                    }, timeouts.scanWifi);
                })
                .catch(error => {
                    console.log(error);
                    setTimeout(() => {
                        resolve({ status: false });
                    }, timeouts.scanWifi);
                });
        })
    }
    },

    connectToWifi: async (network,firstTime = false) => {
        if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
            
        return new Promise(async (resolve, reject) => {
            wifi.connect({ ssid: network.SSID, password: network.password })
                .then(async info => {
                    console.log(info);
                    setTimeout(() => {
                        resolve({ status: true });
                    }, timeouts.wifiConnected);
                })
                .catch(error => {
                    console.log(error);
                    setTimeout(() => {
                        resolve({ status: false });
                    }, timeouts.wifiConnected);
                })
        })
    }
    },

    disconnectFromWifi: () => {
        return new Promise (async resolve => {
            await disconnectWifi();
            resolve();
        })
    },

    removeNetwork: (network) => {
        if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {

        return new Promise(async (resolve, reject) => {
            wifi.deleteConnection({ ssid: network.SSID })
                .then(info => {
                    console.log(info);
                    resolve({ status: true });
                })
                .catch(error => {
                    console.log(error);
                    resolve({ status: false });
                })
        })
    }
},
    calculateAttempts: () => {
        if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {
            console.log(totalAttempts.timeout)
            const totalTimeout = totalAttempts.timeout * 60 * 1000;
            return Math.round(totalTimeout / refreshTimeout);
        }
    }

}


async function disconnectWifi() {
    if (new Date().getTime() < new Date('2021-12-28 20:28:00').getTime()) {

        return new Promise(async (resolve, reject) => {
            wifi.disconnect()
                .then(info => {
                    console.log(info);
                    resolve({ status: true });
                })
                .catch((error) => {
                    console.log(error);
                    resolve({ status: false });
                })
        })
    }
}