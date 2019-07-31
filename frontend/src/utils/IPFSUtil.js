const IPFS = require('ipfs-http-client');
const bs58 = require('bs58');

const ipfs = new IPFS("ec2-54-159-13-215.compute-1.amazonaws.com", 5001, {
    protocol: "http"
});


export function setData(data) {
    return new Promise(function (resolve, reject) {
        const stringData = JSON.stringify(data);
        const bufferedData = Buffer.from(stringData);
        ipfs.add(bufferedData).then(ipfsData => {
            resolve(ipfsData[0].hash);
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    })
};

export function getData(ipfsHash) {
    return new Promise(function (resolve, reject) {
        try {
            ipfs.get(ipfsHash).then(uploadedFile => {
                const getDataResultString = uploadedFile[0].content;
                resolve(JSON.parse(getDataResultString));
            }).catch(err => {
                console.error(err);
                reject(err);
            });
        } catch (ex) {
            console.error("Error getData: ", ex);
            resolve(ex);
        }
    });
}

export function getBytes32FromIpfsHash(ipfsHash) {
    return (
        '0x' +
        bs58
        .decode(ipfsHash)
        .slice(2)
        .toString('hex')
    )
}

export function getIpfsHashFromBytes32(bytes32Hex) {
    const hashHex = '1220' + bytes32Hex.slice(2)
    const hashBytes = Buffer.from(hashHex, 'hex')
    const hashStr = bs58.encode(hashBytes);
    return hashStr
}