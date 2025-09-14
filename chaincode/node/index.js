'use strict';

const { Contract } = require('fabric-contract-api');

class ForensicLogger extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

    /**
     * Creates a new abuse record on the blockchain ledger.
     * Now includes an RBAC check to ensure only 'police' can create records.
     */
    async createAbuseRecord(ctx, eventId, timestamp, location, mediaHash, anonymizedDeviceId, eventType) {
        console.info('============= START : Create Abuse Record ===========');

        // --- RBAC Implementation START ---
        // Get the role of the user submitting the transaction
        const clientRole = ctx.clientIdentity.getAttributeValue('role');
        if (clientRole !== 'police') {
            throw new Error(`Client with role '${clientRole}' is not authorized to create abuse records. Only 'police' role is allowed.`);
        }
        // --- RBAC Implementation END ---

        const abuseRecord = {
            docType: 'abuseRecord',
            timestamp,
            location,
            mediaHash,
            anonymizedDeviceId,
            eventType,
            recordedBy: ctx.clientIdentity.getID(),
        };

        await ctx.stub.putState(eventId, Buffer.from(JSON.stringify(abuseRecord)));
        console.info(`Record ${eventId} created successfully.`);
        console.info('============= END : Create Abuse Record ===========');
        return JSON.stringify(abuseRecord);
    }

    /**
     * Queries an abuse record from the ledger using its ID.
     */
    async queryAbuseRecord(ctx, eventId) {
        const recordAsBytes = await ctx.stub.getState(eventId);
        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`${eventId} does not exist`);
        }
        console.log(recordAsBytes.toString());
        return recordAsBytes.toString();
    }

    /**
     * Queries all abuse records from the ledger.
     */
    async queryAllRecords(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }
}

module.exports.ForensicLogger = ForensicLogger;
module.exports.contracts = [ForensicLogger];