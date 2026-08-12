const fs = require('fs');
const crypto = require('crypto');

function cfSafeBase64(buffer) {
    return buffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/=/g, '_')
        .replace(/\//g, '~');
}

function encodeObjectPath(path) {
    return path
        .split('/')
        .map(part => encodeURIComponent(part))
        .join('/');
}

function generateSignedUrl(objectPath, minutesValid = 15) {

    const encodedPath = encodeObjectPath(objectPath);

    const url = `https://${process.env.CF_DOMAIN}${encodedPath}`;

    const expires = Math.floor(Date.now() / 1000) + minutesValid * 60;

    const policy = JSON.stringify({
        Statement: [{
            Resource: url,
            Condition: {
                DateLessThan: {
                    "AWS:EpochTime": expires
                }
            }
        }]
    });

    const privateKey = fs.readFileSync(
        process.env.CF_PRIVATE_KEY_PATH,
        'utf8'
    );

    const signer = crypto.createSign('RSA-SHA1');

    signer.update(policy);
    signer.end();

    const signature = signer.sign(privateKey);

    return `${url}?Expires=${expires}&Key-Pair-Id=${process.env.CF_KEY_PAIR_ID}&Signature=${cfSafeBase64(signature)}`;
}

module.exports = {
    generateSignedUrl
};
