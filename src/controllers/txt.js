const config = require("../config")
const pool = config.pool;
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


async function delete_txt(url_code, commit_id, single) {
    if(single) {
        await pool.query("DELETE FROM files WHERE commit_id = $1", [commit_id]);
    } else {
        // Delete all versions of the file
        const result = await pool.query("SELECT commit_id FROM file_data WHERE url_code = $1", [url_code]);

        if(result.rowCount == 0) {
            return;
        }

        for(let i=0; i<result.rowCount; i++) {
            await pool.query("DELETE FROM files WHERE commit_id = $1", [result.rows[i].commit_id]);
        }
    }
}

function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
}

function verifyToken(jwtToken) {
    try {
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        return decoded;
    } catch {
        return false;
    }
}
  

exports.uploadTxt = async (req, res) => {
    const mimeType = req.headers["content-type"];
    var accountToken = req.headers["authorization"];
    var accountId;

    if(mimeType == null) {
        return res.status(400).json({ error: "Content-Type header is missing, MIME Type is required for uploading." });
    }

    if(mimeType != "application/json") {
        return res.status(415).json({ error: "Unsupported Media type, only text and code types are supported, binary or unstructured types aren't allowed."})
    }
    
    if(accountToken != null) {
        accountToken = accountToken.split(" ")[1];
        const account = verifyToken(accountToken);
        if(!account) {
            return res.status(401).json({ error: "Invalid JWT token."})
        }

        accountToken = account;
        accountId = account.id;
    }
    // if(mimeType.startsWith("image") || mimeType.startsWith("video") || disallowedMimeTypes.has(mimeType)) {
    //     return res.status(415).json({ error: "Unsupported Media type, only text and code types are supported, binary or unstructured types aren't allowed."})
    // }
    
    var fileName, fileData, pass, category, fileType, expire, flag;

    try {
        
        // Function to check if any field exceeds 30 characters
        function checkLen(fieldName, limit=30) {
            if (!flag && req.body[fieldName] && req.body[fieldName].length > limit) {
                flag=true
                return res.status(400).json({ error: `${fieldName} should not exceed ${limit} characters.` });
            } 
            return req.body[fieldName];
        }

        fileName = checkLen("fileName")
        fileData = checkLen("fileData",260000)
        pass = checkLen("password")
        category = checkLen("category") || "None"
        fileType = checkLen("fileType") || "None"
        expire = checkLen("expire") || "hour"
    } catch (e){
        return res.status(400).json({ error: "Can't parse json from request body, assign values for fileName, fileData"})
    }
 
    // Already returned the response
    if(flag) {
        return;
    }

    if(fileName == null || fileData == null) {
        return res.status(400).json({ error: "Field fileName and fileData should not be empty."})
    } 

    // Check if expire is within type
    if(expire && !config.expireLimit.has(expire)) {
        return res.status(400).json({ error: "Invalid value for field expire. Allowed values are: once, hour, day, week, month, year"})
    }

    // Decode base64 fileData
    var fileSize = 0;
    try{
        const decoded = Buffer.from(fileData)
        fileSize = decoded.length / 1024;
    } catch {
        return res.status(415).json({ error: "Unable to get length of the fileData."})
    }

    // Check for fileData memory size to be within {limit} kb
    if (fileSize > process.env.MAX_TXT_SIZE_KB) {
        return res.status(413).json({ error : "File size exceeds the allowed limit. [" + process.env.MAX_TXT_SIZE_KB + " KB"})
    }

    // The parameters are valid, now we can insert the data into the database []
    
    // Hash the fileData with TimeStamp of now [commit_id]
    const commitId = crypto.createHash("sha256").update(fileData + Date.now().toString()).digest("hex");
    
    // URL Code length is 7
    const urlCode = generateRandomString(7);

    // Hashing the password
    if(pass)    
        pass = crypto.createHash("sha256").update(pass).digest("hex");

    // Generate the expiry timestamp
    const expiry = new Date();
    if(expire == "hour") {
        expiry.setHours(expiry.getHours() + 1);
    } else if(expire == "day") {
        expiry.setDate(expiry.getDate() + 1);
    } else if(expire == "week") {
        expiry.setDate(expiry.getDate() + 7);
    } else if(expire == "month") {
        expiry.setMonth(expiry.getMonth() + 1);
    } else {
        expiry.setFullYear(expiry.getFullYear() + 1);
    } 

    // Insert the data into the database
    try {
        await pool.query("INSERT INTO files (commit_id, txt) VALUES ($1, $2)", [commitId, fileData]);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Internal server error, failed to insert the data into the database."})
    }
    
    try {
        await pool.query("INSERT INTO file_data (url_code, commit_id, created ,expire, type, category, linked_account_id, burn) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [urlCode, commitId, new Date().toISOString() ,expiry.toISOString(), fileType, category, accountId, expire == "once"]);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Internal server error, failed to insert the data into the database."})
    }

    try {
        await pool.query("INSERT INTO url_lookup (url_code, head, expire, pass) VALUES ($1, $2, $3, $4)", [urlCode, commitId, expiry, pass]);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Internal server error, failed to insert the data into the database."})
    }

    // Update account details [if authenticated] for count and url
    if(accountId) {
        await pool.query("UPDATE accounts SET urls_count = urls_count + 1 WHERE account_id = $1", [accountId]);
        // Get list of urls and append this to it [separated by comma]
        const accountData = await pool.query("SELECT urls FROM accounts WHERE account_id = $1", [accountId]);
        const urls = accountData.rows[0].urls;
        if(urls) {
            await pool.query("UPDATE accounts SET urls = $1 WHERE account_id = $2", [urls + "," + urlCode, accountId]);
        } else {
            await pool.query("UPDATE accounts SET urls = $1 WHERE account_id = $2", [urlCode, accountId]);
        }
    }

    // Successfully inserted into database now.
    
    return res.status(200).json({message: "File uploaded successfully", urlCode:urlCode})
};

exports.deleteTxt = async (req, res) => {
    const urlCode = req.params.urlCode;
    var accountToken = req.headers["authorization"];

    // urlCode is required
    if(urlCode == null) {
        return res.status(400).json({ error: "URL Code is required to delete the file."})
    }
    if(accountToken == null) {
        return res.status(401).json({ error: "Authorization header is required to delete the file."})
    }
    
    accountToken = verifyToken(accountToken.split(" ")[1]);
    if(!accountToken) {
        return res.status(401).json({ error: "Invalid JWT token."})
    }

    const result = await pool.query("SELECT * FROM url_lookup WHERE url_code = $1", [urlCode]);

    // Non-existent URL Code?
    if(result.rowCount == 0) {
        return res.status(404).json({ error: "URL Code not found in the database."})
    }
    
    const data = result.rows[0];
    const commitId = data.head;
    const expire = data.expire;
    const pass = data.pass;
    const historyCount = data.changes_count;

    if (expire < Date.now()) {
        await delete_txt(urlCode, commitId, historyCount == 1);
        return res.status(410).json({ error: "URL Code has expired, the file has been deleted."})
    }
    
    // Checks only if created person is the user 
    const fileData = await pool.query("SELECT linked_account_id FROM file_data WHERE commit_id = $1", [commitId]);
    if(fileData.rows[0].linked_account_id != accountToken.id) {
        return res.status(403).json({ error: "You are not authorized to delete this file."})
    }
    
    // After verification, delete the file
    delete_txt(urlCode, commitId, historyCount == 1);
    return res.status(200).json({ message: "File deleted successfully."})
};

exports.getTxt = async (req, res) => {
    const urlCode = req.params.urlCode;

    if(urlCode == null) {
        return res.status(400).json({ error: "URL Code is required to fetch the file."})
    }

    const result = await pool.query("SELECT * FROM url_lookup WHERE url_code = $1", [urlCode]);

    if(result.rowCount == 0) {
        return res.status(404).json({ error: "URL Code not found in the database."})
    }

    const data = result.rows[0];
    const commitId = data.head;
    const expire = data.expire;
    const pass = data.pass;
    const historyCount = data.changes_count;

    if (expire < Date.now()) {
        await delete_txt(urlCode, commitId, historyCount == 1);
        return res.status(410).json({ error: "URL Code has expired, the file has been deleted."})
    }

    if(pass) {
        try {
            const reqPass = req.body.password;
            if(reqPass == null) {
                return res.status(401).json({ error: "Password is required to fetch the file."})
            }

            const hashedPass = crypto.createHash("sha256").update(reqPass).digest("hex");

            if( hashedPass != pass) {
                return res.status(401).json({ error: "Invalid password."})
            }
        } catch {
            return res.status(400).json({ error: "Can't parse json from request body, assign values for password"})
        }
    }

    const txt = await pool.query("SELECT txt FROM files WHERE commit_id = $1", [commitId])
    const fileData = await pool.query("SELECT * FROM file_data WHERE commit_id = $1", [commitId])

    if(txt.rowCount == 0 || fileData.rowCount == 0) {
        return res.status(404).json({ error: "File not found in the database."})
    }

    if(fileData.rows[0].burn) {
        await delete_txt(urlCode, commitId, historyCount == 1);
    }

    return res.status(200).json({ fileDetail: fileData.rows[0], fileData: txt.rows[0].txt})
};

exports.updateTxt = async (req, res) => {
    const urlCode = req.params.urlCode;
    var accountToken = req.headers["authorization"];

    // URL Code is required
    if(urlCode == null) {
        return res.status(400).json({ error: "URL Code is required to update the file."})
    }
    // Only account corresponding to link can change
    if(accountToken == null) {
        return res.status(401).json({ error: "Authorization header is required to update the file."})
    }
    
    accountToken = verifyToken(accountToken.split(" ")[1]);
    if(!accountToken) {
        return res.status(401).json({ error: "Invalid JWT token."})
    }

    // After security checks, fetch the data from the database
    const result = await pool.query("SELECT * FROM url_lookup WHERE url_code = $1", [urlCode]);

    if(result.rowCount == 0) {
        return res.status(404).json({ error: "URL Code not found in the database."})
    }

    const data = result.rows[0];
    const commitId = data.head;
    const expired = data.expire;
    const password = data.pass;
    const historyCount = data.changes_count;

    // Check if its expired
    if (expired < Date.now()) {
        await delete_txt(urlCode, commitId, historyCount == 1);
        return res.status(410).json({ error: "URL Code has expired, the file has been deleted."})
    }

    // Check if it is password protected
    if(password) {
        try {
            const reqPass = req.body.password;
            if(reqPass == null) {
                return res.status(401).json({ error: "Password is required to update the file."})
            }

            const hashedPass = crypto.createHash("sha256").update(reqPass).digest("hex");

            if( hashedPass != password) {
                return res.status(401).json({ error: "Invalid password."})
            }
        } catch {
            return res.status(400).json({ error: "Can't parse json from request body, assign values for password"})
        }
    }

    // Verify if corresponding user is owner of this txt file
    const file_data = await pool.query("SELECT * FROM file_data WHERE commit_id = $1", [commitId]);
    if(file_data.rows[0].linked_account_id != accountToken.id) {
        return res.status(403).json({ error: "You are not authorized to update this file."})
    }

    // Upload text file check
    const mimeType = req.headers["content-type"];
    if(mimeType == null) {
        return res.status(400).json({ error: "Content-Type header is missing, MIME Type is required for updating." });
    }

    if(mimeType != "application/json") {
        return res.status(415).json({ error: "Unsupported Media type, only text and code types are supported, binary or unstructured types aren't allowed."})
    }

   
    var fileName, fileData, pass, category, fileType, expire, flag;

    try {
        
        // Function to check if any field exceeds 30 characters
        function checkLen(fieldName, limit=30) {
            if (!flag && req.body[fieldName] && req.body[fieldName].length > limit) {
                flag=true
                return res.status(400).json({ error: `${fieldName} should not exceed ${limit} characters.` });
            } 
            return req.body[fieldName];
        }

        fileName = checkLen("fileName")
        fileData = checkLen("fileData",260000)
        pass = checkLen("password")
        category = checkLen("category") || "None"
        fileType = checkLen("fileType") || "None"
        expire = checkLen("expire") || "hour"
    } catch (e){
        return res.status(400).json({ error: "Can't parse json from request body, assign values for fileName, fileData"})
    }
 
    // Already returned the response
    if(flag) {
        return;
    }

    if(fileName == null || fileData == null) {
        return res.status(400).json({ error: "Field fileName and fileData should not be empty."})
    } 

    // Check if expire is within type
    if(expire && !config.expireLimit.has(expire)) {
        return res.status(400).json({ error: "Invalid value for field expire. Allowed values are: once, hour, day, week, month, year"})
    }

    // Decode base64 fileData
    var fileSize = 0;
    try{
        const decoded = Buffer.from(fileData)
        fileSize = decoded.length / 1024;
    } catch {
        return res.status(415).json({ error: "Unable to get length of the fileData."})
    }

    // Check for fileData memory size to be within {limit} kb
    if (fileSize > process.env.MAX_TXT_SIZE_KB) {
        return res.status(413).json({ error : "File size exceeds the allowed limit. [" + process.env.MAX_TXT_SIZE_KB + " KB"})
    }

    // The parameters are valid, now we can insert the data into the database []
    
    // Hash the fileData with TimeStamp of now [commit_id]
    const new_commitId = crypto.createHash("sha256").update(fileData + Date.now().toString()).digest("hex");
    
    // Hashing the password
    if(pass)    
        pass = crypto.createHash("sha256").update(pass).digest("hex");

    // Generate the expiry timestamp
    const expiry = new Date();
    if(expire == "hour") {
        expiry.setHours(expiry.getHours() + 1);
    } else if(expire == "day") {
        expiry.setDate(expiry.getDate() + 1);
    } else if(expire == "week") {
        expiry.setDate(expiry.getDate() + 7);
    } else if(expire == "month") {
        expiry.setMonth(expiry.getMonth() + 1);
    } else {
        expiry.setFullYear(expiry.getFullYear() + 1);
    }

    // Insert the data into the database
    try {
        await pool.query("INSERT INTO files (commit_id, txt) VALUES ($1, $2)", [new_commitId, fileData]);
    } catch (e) {
        return res.status(500).json({ error: "Internal server error, failed to insert the data into the database."})
    }
    try {
        await pool.query("INSERT INTO file_data (url_code, commit_id, created ,expire, type, category, linked_account_id, burn) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [urlCode, new_commitId, new Date().toISOString() ,expiry.toISOString(), fileType, category, accountToken.id, expire == "once"]);
    } catch (e) {
        return res.status(500).json({ error: "Internal server error, failed to insert the data into the database."})
    }
    // Altering previous file_data record's next_commit
    try {
        await pool.query("UPDATE file_data SET next_commit = $1 WHERE commit_id = $2", [new_commitId, commitId]);
    } catch (e) {
        return res.status(500).json({ error: "Internal server error, failed to insert the data into the database."})
    }
    // Altering url_lookup count and head
    try {
        await pool.query("UPDATE url_lookup SET head = $1, expire = $3, changes_count = changes_count + 1 WHERE url_code = $2", [new_commitId, urlCode, expiry]);
    } catch (e) {
        return res.status(500).json({ error: "Internal server error, failed to insert the data into the database."})
    }

    return res.status(200).json({message: "File updated successfully", urlCode:urlCode})
}