### [Available online](http://ec2-18-185-114-217.eu-central-1.compute.amazonaws.com:3000)
Contact [mehmetdogan1993@gmail.com](mehmetdogan1993@gmail.com) if you can not access.

# Rappa Store - A decentralized Market Place

Rappe is an online marketplace that operates on Ethereum Network. There are store fronts that shoppers can login using their Metamask accounts and purchase some goods. 
Along with MarketPlace contracts, you can find two ERC-20 token contracts which are built based on open-zeppelin ERC-20 contract. These contracts are used as dummy contracts to show, it's able to purchase goods with ERC-20 tokens.


![Generic badge](https://img.shields.io/badge/maintained-yes-green.svg)

## Table of Contents
| Contract | Network  | Address  |
|---|---|---|
| MarketPlace | Kovan | 0xD8cE4908849cB04598B45a75b64e5Bb8cAB965D0 |
| ACATOKEN | Kovan | 0xC2556CeFEad6b9AA55fa9dAc839D3816C49624Fd |
| BUMTOKEN | Kovan | 0x7ac9775192f85aBc5829Cfc45586cB67eD2CE9e6 |

- [Rappa Store - A decentralized Market Place](#Rappa-Store---A-decentralized-Market-Place)
  - [Table of Contents](#Table-of-Contents)
  - [Features](#Features)
    - [Pausable](#Pausable)
    - [Ownable](#Ownable)
    - [SafeMath](#SafeMath)
    - [Storage of Data](#Storage-of-Data)
  - [Actors](#Actors)
    - [Owner](#Owner)
    - [Pauser](#Pauser)
    - [Admin](#Admin)
    - [StoreOwner](#StoreOwner)
    - [Shopper](#Shopper)
  - [Getting Started](#Getting-Started)
    - [Contract Compilation, Migration and Tests](#Contract-Compilation-Migration-and-Tests)
    - [Running Frontend](#Running-Frontend)
    - [Prerequisites](#Prerequisites)
    - [Related Docs](#Related-Docs)

## Features

### Pausable
Rappa Store is implemented using circuit-breaker pattern with the help of open-zeppelin's Pausable contract. 

### Ownable
Ownable Library of Zeppelin provides access control mechanism for specific functions. 

### SafeMath
As solidity based on unsigned integers, it's important to prevent from underflows/overflows. Therefore, all arithmetic operations are done using SafeMath Library.

### Storage of Data
It's expensive to store metadata on Blockchains. Therefore, the metadata about products and shops are stored in IPFS to achieve complete decentralization. The pointers to these metadatas are stored in the contract using bytes32. When compared to storing string, it's cheaper to store bytes32 so this conversion is very rationale.

## Actors

The actors of Market Place are as follows:

### Owner
Owner is set as deployer of MarketPlace contract. The contract owner can add new Admins to the system.
### Pauser
Pauser is set as deployer of MarketPlace contract. The pauser can stop contract state updates due to any emergency such as vulnerabilities etc.
### Admin
An admin can add new store owners to Rappa Store
### StoreOwner
A store owner can create a new storefront that will be displayed on the marketplace.  They can update metadata of store like name, description or image along with managing products on the stores such as adding or adjusting price. They can also withdraw any funds that the store has collected from sales.

### Shopper
Shopper can browse the stores and goods of these stores. If enough funds are available, they can purchase goods with ERC-20 tokens or Ethereum. In the case that user purchases a product with ERC-20, first it approves MarketPlace contract to spend some amounf of tokens, later the shopper will be able to purchase. This pattern can be executed with approveAndCall in one transactions but it's considered as secure executing these operation in two transactions(First Approve, Then Purchase). 


## Getting Started

### Contract Compilation, Migration and Tests
* You can clone the directory onto your local machine and install dependencies
```
    npm install
```
**NOTE THAT** YOU CAN USE NPM OR YARN AS PACKAGE MANAGER
```
    yarn install
```


Export environment variables or manipulate these values in `truffle-config.js`
```
    export infuraURLKovan="INFURA_URL"
    export infuraKeyKovan="INFURA_KEY"
    export mnemonic="MNEMONIC MNEMONIC ..."
    export gasPrice="5000000000"
    export gasAmount="7000000"
```
You can compile and deploy the contract to Kovan, Rinkeby, Ropsten, Mainnet or local ganache network.

```
// Compile
    > truffle compile
// Mainnet
    > truffle migrate --network mainnet --reset
// Kovan
    > truffle migrate --network kovan --reset
// Rinkeby
    > truffle migrate --network rinkeby --reset
```

You can test your contract after running a local ganache network.
```
    > ganache-cli
    > truffle-test

```

### Running Frontend


Go to `frontend` directory
```
    > cd frontend
```

Before interacting with contract, if you go on with your own deployment, you need to first update contract addresses and ABIs in `src\config\contracts.js`

Install required node modules and start the project. It will start on `localhost:3000` by default.
```
    > yarn install
    > yarn start

```


### Prerequisites

* Node-js (Above version 8)
* Npm (Above version 6)

### Related Docs
* [Truffle](https://truffleframework.com/)
* [ERC-20 Standard](https://eips.ethereum.org/EIPS/eip-20)


