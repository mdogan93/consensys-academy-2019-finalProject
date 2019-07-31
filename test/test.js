var MarketPlace = artifacts.require("MarketPlace");
var ACAToken = artifacts.require("ACAToken");

const { BN, constants, expectEvent } = require("openzeppelin-test-helpers");
let catchRevert = require("./exceptionsHelpers.js").catchRevert;
const crypto = require("crypto");

contract("MarketPlace", function(accounts) {
  const contractDeployer = accounts[0];
  const admin = accounts[1];
  const storeOwner = accounts[2];
  const shopper = accounts[3];

  let instance;
  let token1;

  beforeEach(async () => {
    instance = await MarketPlace.new();
    token1 = await ACAToken.new();
  });

  describe("Setup", async () => {
    it("Deployer should be set as owner", async () => {
      const owner = await instance.owner();
      assert.equal(
        owner,
        contractDeployer,
        "the deploying address should be the owner"
      );
    });
    it("Deployer should be set as pauser", async () => {
      const isPauser = await instance.isPauser(contractDeployer);
      assert.equal(
        isPauser,
        true,
        "the deploying address should be the pauser"
      );
    });
    it("Deployer should be set as admin", async () => {
      const isAdmin = await instance.admins(contractDeployer);
      assert.equal(isAdmin, true, "the deploying address should be the admin");
    });
  });

  describe("addStoreOwner", async () => {
    it("New store owner should be added succesfully", async () => {
      const { logs } = await instance.addStoreOwner(storeOwner, {
        from: contractDeployer
      });
      expectEvent.inLogs(logs, "LogNewStoreOwner", {
        storeOwner
      });
    });

    it("reverts if msg.sender is not admin", async function() {
      await catchRevert(
        instance.addStoreOwner(storeOwner, {
          from: accounts[4]
        })
      );
    });
  });

  describe("addStore", async () => {
    let ipfsHash = "0x" + crypto.randomBytes(32).toString("hex");
    beforeEach(async function() {
      await instance.addStoreOwner(storeOwner, {
        from: contractDeployer
      });
    });

    it("New store should be added succesfully", async () => {
      const { logs } = await instance.createStore(ipfsHash, {
        from: storeOwner
      });
      expectEvent.inLogs(logs, "LogNewStore", {
        storeOwner
      });
    });

    it("should fail if the sender is not storeOwner", async () => {
      await catchRevert(
        instance.createStore(ipfsHash, {
          from: accounts[4]
        })
      );
    });
  });

  describe("addProduct", async () => {
    let ipfsHash = "0x" + crypto.randomBytes(32).toString("hex");
    let stockCount = Math.random();
    let price = web3.utils.toWei("0.2", "ether");
    let quantity = 10;
    let storeId;
    beforeEach(async function() {
      await instance.addStoreOwner(storeOwner, {
        from: contractDeployer
      });
      const { logs } = await instance.createStore(ipfsHash, {
        from: storeOwner
      });
      storeId = logs[0].args.storeId.toString();
    });

    it("New product should be added succesfully", async () => {
      const { logs } = await instance.addProduct(
        storeId,
        ipfsHash,
        quantity,
        constants.ZERO_ADDRESS,
        price,
        {
          from: storeOwner
        }
      );
      expectEvent.inLogs(logs, "LogNewProduct", {
        storeId
      });
    });

    it("should fail if the sender is not owner of the store", async () => {
      await catchRevert(
        instance.addProduct(
          storeId,
          ipfsHash,
          quantity,
          constants.ZERO_ADDRESS,
          price,
          {
            from: accounts[5]
          }
        )
      );
    });
  });

  describe("purchaseProduct", async () => {
    let ipfsHash = "0x" + crypto.randomBytes(32).toString("hex");
    let price = web3.utils.toWei("0.2", "ether");
    let quantity = 10;
    let storeId;
    let productId;
    beforeEach(async function() {
      await instance.addStoreOwner(storeOwner, {
        from: contractDeployer
      });
      const { logs } = await instance.createStore(ipfsHash, {
        from: storeOwner
      });
      storeId = logs[0].args.storeId.toString();

      const res = await instance.addProduct(
        storeId,
        ipfsHash,
        quantity,
        constants.ZERO_ADDRESS,
        price,
        {
          from: storeOwner
        }
      );
      productId = res.logs[0].args.productId.toString();
    });

    it("should succesfully purchase the product and update product's stock count", async () => {
      const quantityAsked = 2;
      let totalCost = quantityAsked * parseFloat(price);
      await instance.purchaseProduct(
        productId,
        constants.ZERO_ADDRESS,
        totalCost.toString(),
        quantityAsked,
        {
          from: accounts[5],
          value: totalCost.toString()
        }
      );
      const details = await instance.products(productId);
      assert.equal(
        details.stock.toString(),
        (quantity - quantityAsked).toString(),
        "Stock of the product not updated"
      );
    });

    it("should revert if msg.value does not match total Cost", async () => {
      const quantityAsked = 2;
      let totalCost = parseFloat(price);
      await catchRevert(
        instance.purchaseProduct(
          productId,
          constants.ZERO_ADDRESS,
          totalCost.toString(),
          quantityAsked,
          {
            from: accounts[5],
            value: totalCost.toString()
          }
        )
      );
    });
  });

  describe("withdrawBalance", async () => {
    let ipfsHash = "0x" + crypto.randomBytes(32).toString("hex");
    let price = web3.utils.toWei("0.5", "ether");
    let quantity = 10;
    let quantityAsked = 2;
    let storeId;
    let productId;
    let totalCost;
    let storeOwnerBeforeBalance;
    beforeEach(async function() {
      await instance.addStoreOwner(storeOwner, {
        from: contractDeployer
      });
      const { logs } = await instance.createStore(ipfsHash, {
        from: storeOwner,
        gasPrice: 0
      });
      storeId = logs[0].args.storeId.toString();

      const res = await instance.addProduct(
        storeId,
        ipfsHash,
        quantity,
        constants.ZERO_ADDRESS,
        price,
        {
          from: storeOwner,
          gasPrice: 0
        }
      );
      productId = res.logs[0].args.productId.toString();

    totalCost = quantityAsked * parseFloat(price);
      storeOwnerBeforeBalance = await web3.eth.getBalance(storeOwner);
      await instance.purchaseProduct(
        productId,
        constants.ZERO_ADDRESS,
        totalCost.toString(),
        quantityAsked,
        {
          from: accounts[5],
          value: totalCost.toString()
        }
      );
    });

    it("should succesfully withdraw funds from the store", async () => {
      await instance.withdrawBalance(productId, constants.ZERO_ADDRESS, {
        from: storeOwner,
        gasPrice: 0
      });
      let storeOwnerAfterBalance = await web3.eth.getBalance(storeOwner);
      let totalCostInEth = web3.utils.fromWei(totalCost.toString(), 'ether');
      let diffBtwBeforeAndAfter = parseFloat(web3.utils.fromWei(storeOwnerAfterBalance.toString(), 'ether')) - parseFloat(web3.utils.fromWei(storeOwnerBeforeBalance.toString(), 'ether'))
      assert.equal(
        diffBtwBeforeAndAfter,
        totalCostInEth,
        "Balance should be updated"
      );
    });
  });
});
