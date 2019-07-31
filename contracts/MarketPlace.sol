pragma solidity ^0.5.8;
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title MarketPlace
* @author Mehmet Dogan
* @dev This contract allows to create and manage a public market place on Ethereum Network.
* Two design patterns are implemented into the contract as Pausable and Ownable.
* Ownable allows to contract owner to add new admins.
* Pausable allows to stop contract state updates due to any emergency.
* SafeMath allows us to handle overflows/underflows on arithmetic operations.
*/
contract MarketPlace is Pausable, Ownable {
    using SafeMath for uint256;

    /**
    * @dev Modifier to make a function callable only by the admin.
    */
    modifier onlyAdmin() {
        require(admins[msg.sender], "Not an admin");
        _;
    }

    /**
    * @dev Modifier to make a function callable only by the store owner.
    */
    modifier onlyStoreOwner() {
        require(storeOwners[msg.sender], "Not a store owner");
        _;
    }

    /**
    *  @dev This event raises when a new store owner is added by the admin
    *  @param storeOwner is the address of newly added owner
     */
    event LogNewStoreOwner(address indexed storeOwner);

    /**
    *  @dev This event raises when a new store is added by the owner
    *  @param storeOwner is the address store owner
    *  @param storeId is the identifier for store
    */
    event LogNewStore(address indexed storeOwner, uint256 storeId);

    /**
    *  @dev This event raises when a new product added to the store by the owner
    *  @param storeId is the identifier for the store
    *  @param productId is the identifier for the product
    */
    event LogNewProduct(uint256 storeId, uint256 productId);

    /// mapping that stores admins of the Market Place
    mapping(address => bool) public admins;

    /// mapping that stores storeOwners of the Market Place
    mapping(address => bool) public storeOwners;

    /// mapping from owners to stores
    mapping(address => uint256[]) ownerToStores;

    /// mapping from storeIds to owners
    mapping(uint256 => address) private storeToOwners;

    /// mapping from storeIds to metaDatas
    mapping(uint256 => bytes32) public storeMetadatas;

    /// mapping from storeIds to productIds that are available on the store
    mapping(uint256 => uint256[]) private storeToProducts;

    /// mapping from productIds to Product Details
    mapping(uint256 => Product) public products;

    /// mapping from storeIds to ETH/ERC20 tokens balances
    mapping(uint256 => mapping(address => uint256)) private balances;

    /// total Store Count
    uint256 public storeCount;

    /// total Product Count
    uint256 public productCount;

    struct Product {
        // ZERO_ADDRESS denotes ethereum, where as the other addresses should correspond to ERC20 tokens.
        address paymentAddress;
        // Price in terms of unit denoted by paymentAddress
        uint256 price;
        // IPFS Hash of product that stores image, name and description
        bytes32 metaData;
        // Quantity left on the stocks
        uint256 stock;
        // The identifier for the store that sells the product
        uint256 storeID;
        // The status that allows of soft remove of product from store
        bool onStore;
    }

    /**
    * @dev Only contract owner can add new admins to the system.
    * @param newAdmin Address of the user that will be joined the system as Admin.
    */
    function addAdmin(address newAdmin) public onlyOwner {
        admins[newAdmin] = true;
    }

    /**
    * @dev Only admin can add new store owners to the system.
    * @param _storeOwner Address of the user that will be joined the system as Store Owner.
    */
    function addStoreOwner(address _storeOwner) public onlyAdmin whenNotPaused {
        storeOwners[_storeOwner] = true;
        emit LogNewStoreOwner(_storeOwner);
    }

    /**
    * @dev Adds new store to the marketplace.
    * @param storeInfo IPFS hash of the data that stores metadata about the store.
    * @notice raises LogNewStore event when completed
    */
    function createStore(bytes32 storeInfo) public onlyStoreOwner whenNotPaused {
        ownerToStores[msg.sender].push(storeCount);
        storeMetadatas[storeCount] = storeInfo;
        storeToOwners[storeCount] = msg.sender;
        emit LogNewStore(msg.sender,storeCount);
        storeCount++;
    }

    /**
    * @dev Edits the metadata of the store.
    * @param storeId Identifier for the store.
    * @param storeInfo IPFS hash of the data that stores metadata about the store.
    */
    function editStoreInfo(uint256 storeId, bytes32 storeInfo) public onlyStoreOwner whenNotPaused {
        require(storeToOwners[storeId] == msg.sender, "Only owner of the store can update info");
        storeMetadatas[storeId] = storeInfo;
    }

    /**
    * @dev Adds new product to the store
    * @param _storeID Identifier for the store.
    * @param _ipfsHash IPFS hash of the data that stores metadata about the product.
    * @param _stock Quantity of the product
    * @param tokenAddress payment method that can be ERC20 token address or ZERO_ADDRESS for ethereum
    * @param price Price in terms of unit denoted by paymentAddress
    */
    function addProduct(uint256 _storeID, bytes32 _ipfsHash, uint256 _stock, address tokenAddress, uint256 price) public onlyStoreOwner {
        require(storeToOwners[_storeID] == msg.sender, "Only owner of the store can add products to the store");
        Product storage product = products[productCount];
        product.metaData = _ipfsHash;
        product.stock = _stock;
        product.paymentAddress = tokenAddress;
        product.price = price;
        product.storeID = _storeID;
        product.onStore = true;
        storeToProducts[_storeID].push(productCount);
        emit LogNewProduct(_storeID,productCount);
        productCount++;

    }

    /**
    * @dev Modifies the product's price
    * @param _productID Identifier for the product.
    * @param tokenAddress payment method that can be ERC20 token address or ZERO_ADDRESS for ethereum
    * @param price Price in terms of unit denoted by paymentAddress
    */
    function changeProductPrice(uint256 _productID, address tokenAddress, uint256 price) public onlyStoreOwner {
        Product storage product = products[_productID];
        require(storeToOwners[product.storeID] == msg.sender, "Only owner of the store can edit product's price");
        product.paymentAddress = tokenAddress;
        product.price = price;

    }

    /**
    * @dev Removes the product from store
    * @param productID Identifier for the product.
    */
    function removeProduct(uint256 productID) public onlyStoreOwner {
        uint256 storeID = products[productID].storeID;
        require(storeToOwners[storeID] == msg.sender, "Only owner of the store can remove products from the store");
        Product storage product = products[productID];
        product.onStore = false;
    }

    /**
    * @dev Shoppers purchase the product with desired quantity
    * @param productID Identifier for the product.
    * @param tokenAddress payment method that can be ERC20 token address or ZERO_ADDRESS for ethereum
    * @param paidAmount Price in terms of unit denoted by paymentAddress
    * @param quantity amount of the products that will be purchased
    */
    function purchaseProduct(uint256 productID, address tokenAddress, uint256 paidAmount, uint256 quantity) public payable {
        Product storage product = products[productID];
        require(product.stock >= quantity, "Not enough product on the store");
        require(product.onStore, "Product not available on Store");
        uint256 totalCost = quantity.mul(product.price);
        if(tokenAddress == address(0)) {
            require(msg.value == totalCost, "Msg.value must exactly match the total cost");
            balances[product.storeID][tokenAddress] = balances[product.storeID][tokenAddress].add(totalCost);
        }
        else{
            require(paidAmount >= totalCost, "Not eligible to purchase the product");
            require(ERC20(tokenAddress).transferFrom(msg.sender,address(this), totalCost), "Not enough approved ERC20");
            balances[product.storeID][tokenAddress] = balances[product.storeID][tokenAddress].add(totalCost);
        }
        product.stock = product.stock.sub(quantity);

    }

    /**
    * @dev Returns the stores of owner
    * @param storeOwner Address of the store owner
    * @return Array of store IDs
    */
    function getStoresOfOwner(address storeOwner) external view returns(uint256[] memory stores){
        return ownerToStores[storeOwner];
    }
    /**
    * @dev Returns the products in the store
    * @param storeId Identifier for the store
    * @return Array of product IDs
    */
    function getProductsInStore(uint256 storeId) external view returns(uint256[] memory _products){
        return storeToProducts[storeId];
    }

    /**
    * @dev Returns the products in the store
    * @param storeId Identifier for the store
    * @param tokenAddress payment method that can be ERC20 token address or ZERO_ADDRESS for ethereum
    * @return Array of product IDs
    */
    function getBalanceOfStore(uint256 storeId, address tokenAddress) external view returns(uint256 balance){
        return balances[storeId][tokenAddress];
    }

    /**
    * @dev Transfers the funds in the store to the owner
    * @param storeId Identifier for the store
    * @param tokenAddress payment method that can be ERC20 token address or ZERO_ADDRESS for ethereum
    */
    function withdrawBalance(uint256 storeId, address tokenAddress) external {
        require(storeToOwners[storeId] == msg.sender, "Only owner of the store can withdraw funds");
        uint256 balance = balances[storeId][tokenAddress];
        balances[storeId][tokenAddress] = 0;
        if(tokenAddress == address(0)){
            msg.sender.transfer(balance);
        }
        else{
            require(ERC20(tokenAddress).transfer(msg.sender, balance), "Not enough approved ERC20");
        }
    }

    /**
    * @dev Fallback function that welcomes any incoming Ethereum
    */
    function() external payable { }

    /**
    * @dev Constructor for the marketplace
    * @notice Deployer is set as admin to the marketplace
    * @notice Deployer is also set as pauser and owner
    */
    constructor() public {
        admins[msg.sender] = true;
    }

    /**
    * @dev Destructs the contract and transfer funds to the owner
    * @notice Only Contract Owner can execute
    */
    function killContract() public onlyOwner {
        selfdestruct(msg.sender);
    }



}