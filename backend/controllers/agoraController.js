const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = process.env.AGORA_APP_ID || 'dummy_app_id';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'dummy_certificate';

exports.generateToken = (req, res) => {
    try {
        const { channelName, uid } = req.query;

        if (!channelName) {
            return res.status(400).json({ error: 'channelName is required' });
        }

        let uidInt = 0; 
        if (uid) {
            uidInt = parseInt(uid, 10);
            if (isNaN(uidInt)) uidInt = 0;
        }

        const role = RtcRole.PUBLISHER;
        const expireTime = 3600; 
        const currentTime = Math.floor(Date.now() / 1000);
        const privilegeExpireTime = currentTime + expireTime;

        if (APP_ID === 'dummy_app_id') {
            console.warn("Using placeholder Agora App ID. Ensure you set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env");
        }

        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID, 
            APP_CERTIFICATE, 
            channelName, 
            uidInt, 
            role, 
            privilegeExpireTime
        );

        return res.json({ token, appId: APP_ID });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
