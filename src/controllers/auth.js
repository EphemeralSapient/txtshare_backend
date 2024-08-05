const querystring = require('querystring');
const axios = require("axios");
const config = require('../config');
const jwt = require('jsonwebtoken');
const pool = config.pool;

exports.googleAuth = (req, res) => {
    const params = {
        client_id: config.oauth.clientID, // Client ID
        redirect_uri: config.oauth.redirectUri, // Callback
        response_type: 'code', // Authorization code for token exchange
        scope: 'https://www.googleapis.com/auth/userinfo.email', // Email is only required
        access_type: 'offline', // Access token never expires
        prompt: 'consent', // Always prompt for consent from the user
    };
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + querystring.stringify(params);
    res.redirect(url);
};

exports.googleAuthCallback = async (req, res) => {
    const { code } = req.query;
    const tokenParams = {
        code,
        client_id: config.oauth.clientID,
        client_secret: config.oauth.clientSecret,
        redirect_uri: config.oauth.redirectUri,
        grant_type: 'authorization_code',
    };

    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify(tokenParams));
        const tokens = response.data;
        
        // Use the tokens to get user info
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });
        
        // Extract user info
        const { email,name, verified_email } = userInfo.data;

        if(!verified_email){
            res.status(500).json({ error: 'Email not verified' });
        }

        // Check if user exists, otherwise create
        let acc_id;
        let user = await pool.query('SELECT account_id FROM accounts WHERE email = $1', [email]);
        if (user.rowCount === 0) {
            await pool.query('INSERT INTO accounts (oauth_provider, email, username) VALUES ($1, $2, $3)', ['google', email, name]);
            user = await pool.query('SELECT account_id FROM accounts WHERE email = $1', [email]);
            acc_id = user.rows[0].account_id;
        } else {
            acc_id = user.rows[0].account_id;
        }

        // Generate JWT token
        const token = jwt.sign({ "email" : email, "id" : acc_id }, config.security.jwtToken);

        res.json({token: token});
    } catch (error) {
        console.error('Error during OAuth callback:', error);
        res.status(500).json({ error: 'Failed to authenticate' });
    }
};