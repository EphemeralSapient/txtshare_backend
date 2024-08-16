
## API Endpoint Details

https://app.swaggerhub.com/apis-docs/NOWAYOFWAY/txt/1.0.0#/

## Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL, Redis [cache]
- **Docker** : Before `compose-up`, make sure to complete `.env` file
- **Planned Features**:  Benchmarking overall performance [stress test]



## Etc
Check example.env and create corresponding values to make it functional for `npm run start`

Or you can bundle it via `npm run build` and start it from `node dist/main.js`

Hosted this at http://semp.myddns.me/txt and you can get the webpack'd output from Github Actions of this repo too

## Alternative

Using gRPC and Rust, remade this repo and you can find it [here](https://github.com/EphemeralSapient/txtshare_backend.rs)