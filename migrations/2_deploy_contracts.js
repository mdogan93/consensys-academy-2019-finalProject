const MarketPlace = artifacts.require("./MarketPlace.sol");
const ACAToken = artifacts.require("./ACAToken.sol");
const BUMToken = artifacts.require("./BUMToken.sol");

module.exports = function (deployer) {
    deployer.deploy(MarketPlace);
    deployer.deploy(ACAToken);
    deployer.deploy(BUMToken);
}