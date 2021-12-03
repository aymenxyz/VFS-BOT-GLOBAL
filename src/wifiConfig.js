module.exports = {
    // Netowroks where you can chooce your wifi network which you want to connect to.
    // SSID is the name of the network.
    // password is the password of the network.
    // enabled must true or false. false is for if you want disable the connection to that network.
    networks: [
        {
            SSID: 'XYZZZZ',
            password: '261997xyz',
            enabled: true,
            order: 1,
        },
        {
            SSID: 'Redmi Note 10 5G',
            password: 'kader4804',
            enabled: true,  
            order: 2,
        },
        {
            SSID: 'Galaxy A30sD8C3',
            password: '199999999',
            enabled: false, 
            order: 3 
        },
    ],
    // Timeouts are used to delay the wifi system.
    // scanWifi is the delay for scanning wifi and returning result.
    // wifiConnected is the delay when the wifi is connected after restar the bot
    timeouts: {
        scanWifi: 5000,
        wifiConnected: 6000
    }
}