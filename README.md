I'll use swagger once done, as of now :

## API Endpoints

### `/v1/api/txt`

- **Create Txt [POST]**  
  Create a new text file with optional metadata (expiration, file type, category, etc.).  
  - **Request body**: JSON containing `fileName`, `fileData`, and other optional fields.
  - **Response**: JSON with `urlCode` for accessing the file.

- **Read Txt {urlCode} [GET]**  
  Retrieve the content of a text file using its `urlCode`.  
  - **Path parameter**: `urlCode`
  - **Response**: JSON with file details and content.

- **Update Txt {urlCode, JWT Authorization} [PUT]**  
  Update an existing text file, requiring JWT authorization.  
  - **Path parameter**: `urlCode`
  - **Headers**: `Authorization` with Bearer token
  - **Request body**: JSON with updated `fileData` and optional fields.
  - **Response**: JSON confirmation of the update.

- **Delete Txt {urlCode, JWT Authorization} [DELETE]**  
  Delete a text file, requiring JWT authorization.  
  - **Path parameter**: `urlCode`
  - **Headers**: `Authorization` with Bearer token
  - **Response**: JSON confirmation of deletion.

- **Auto Delete (on Expiry)**  
  Text files are automatically deleted once their expiration time is reached.

### `/v1/api/auth`

- **Get Auth Link [GET]**  
  Generate a Google OAuth URL for users to authenticate and verify their email.  
  - **Response**: Redirect to Google OAuth URL.

- **Google OAuth Callback [GET]**  
  Handles the callback from Google OAuth after user verification.  
  - **Query parameter**: `code` (Authorization code from Google)
  - **Response**: JSON with JWT authorization token for authenticated users.

## Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Planned Features**: Redis for caching and performance improvements, Docker support



## Etc
Check example.env and create corresponding values to make it functional for `npm run start`

Hosted this at http://semp.myddns.me/txt