const config = require("../config");
const pool = config.pool;
const jwt = require("jsonwebtoken");

function verifyToken(jwtToken) {
    try {
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        return decoded;
    } catch {
        return false;
    }
}

exports.getAccount = async (req, res) => {
    const id = req.params.id;

    if(!id) {
        return res.status(400).json({ error: "Missing account ID" });
    }

    // Check if its on redis cache
    if(await config.redis.get("acc_" + id) !== null) {
        return res.status(200).json(JSON.parse( await config.redis.get("acc_"+id)));
    }

    try {
        const account = await pool.query("SELECT account_id, username, created FROM accounts WHERE account_id = $1", [id]);
        if(account.rowCount === 0) {
            return res.status(404).json({ error: "Account not found" });
        }
        
        var result = account.rows[0];

        // Fetch all created TXT files from the account
        const txtFiles = await pool.query("SELECT url_code FROM account_files WHERE account_id = $1", [id]);

        result["txtFiles"] = txtFiles.rows.map((file) => {
            return file.url_code;
        });

        // Cache the account data
        config.redis.set("acc_" + id, JSON.stringify(result));
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error during account retrieval:", error);
        res.status(500).json({ error: "Failed to retrieve account" });
    }
};

exports.updateAccount = async (req, res) => {
    const id = req.params.id;

    if(!id) {
        return res.status(400).json({ error: "Missing account ID" });
    }

    var accountToken = req.headers["authorization"];

    // Token is required
    if(accountToken == null) {
        return res.status(401).json({ error: "Authorization header is required to delete the file."})
    }
    
    accountToken = verifyToken(accountToken.split(" ")[1]);
    if(!accountToken) {
        return res.status(401).json({ error: "Invalid JWT token."})
    }

    if(accountToken.account_id !== id) {
        return res.status(403).json({ error: "You are not authorized to update this account."});
    }

    const { username } = req.body;

    if(!username) {
        return res.status(400).json({ error: "Missing username or other params for updating the account." });
    }

    try {
        const query = "UPDATE accounts SET username = $1 WHERE account_id = $2";
        await pool.query(query, [username, id]);

        // Invalidate the cache
        await config.redis.del("acc_" + id);

        return res.status(200).json({ message: "Account updated successfully." });
    } catch(error) {
        console.error("Error during account update:", error);
        res.status(500).json({ error: "Failed to update account." });
    }
}