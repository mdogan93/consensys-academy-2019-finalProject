import React, { Component } from "react";
import { Redirect} from "react-router-dom";
import {
  MARKET_PLACE_ABI,
  MARKET_PLACE_ADDRESS,
  ERC20ABI,
} from "./config/contracts";
import Web3 from "web3";
import "./styles/StoreOwner.css";
import {
  setData,
  getData,
  getBytes32FromIpfsHash,
  getIpfsHashFromBytes32
} from "./utils/IPFSUtil";
import NewProduct from "./components/NewProduct";
let web3;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

class ProductManager extends Component {
  componentWillMount() {
    this.initWeb3();
    window.ethereum.on('accountsChanged', async(acc) => {
      this.setState({isRedirect:true})
    });
  }
  componentDidMount() {
    this.getStoreDetails();
    this.getProductDetails();
  }



  constructor(props) {
    super(props);
    this.state = {
      account: this.props.location.state.account,
      storeId: this.props.location.state.id,
      loading: true,
      storeDetail: null,
      transactionHash: "",
      productDetails: [],
      isRedirect:false,
      validPaymentMethods:[],
      balances:[]
    };
    this.addProduct = this.addProduct.bind(this);
    this.editProduct = this.editProduct.bind(this);
    this.toStorePanel = this.toStorePanel.bind(this);
    this.getBalance = this.getBalance.bind(this);
    this.withdrawFunds = this.withdrawFunds.bind(this);


  }

  initWeb3() {
    web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const marketPlace = new web3.eth.Contract(
      MARKET_PLACE_ABI,
      MARKET_PLACE_ADDRESS
    );
    this.setState({
      marketPlace
    });
    this.setState({
      loading: false
    });
  }

  async getPaymentMethod(address) {
    if (address === ZERO_ADDRESS) {
      return "ETH";
    }
    else{
      const tokenContract = new web3.eth.Contract(
        ERC20ABI,
        address
      );
      const ticker = await tokenContract.methods.symbol().call();
      return ticker;
    }
  }

  withdrawFunds(e){
    const tokenAddress = e.target.id;
    this.state.marketPlace.methods.withdrawBalance(this.state.storeId,tokenAddress)
    .send({
      from: this.state.account,
      gasPrice: 5000000000
    })
    .once("receipt", receipt => {
      this.setState({
        transactionHash: receipt.transactionHash
      });
      this.setState({
        loading: false
      });
    });
  }

  async getStoreDetails() {
    const storeMeta = await this.state.marketPlace.methods
      .storeMetadatas(this.state.storeId)
      .call();
    const ipfsHash = getIpfsHashFromBytes32(storeMeta);
    getData(ipfsHash).then(res => {
      var arrayBufferView = new Uint8Array(res.uri.data);
      var blob = new Blob([arrayBufferView], { type: "image/jpeg" });
      var urlCreator = window.URL || window.webkitURL;
      var imageUrl = urlCreator.createObjectURL(blob);
      const storeDetail = {
        id: this.state.storeId,
        name: res.name,
        img: imageUrl,
        desc: res.description
      };
      this.setState({
        storeDetail
      });
    });
  }

  async getBalance(id, address) {
    const balance = await this.state.marketPlace.methods
      .getBalanceOfStore(id, address)
      .call();
    return web3.utils.fromWei(balance.toString(),'ether');
  }


  async getProductDetails() {
    this.setState({
      productDetails: [],
    });
    const products = await this.state.marketPlace.methods
      .getProductsInStore(this.state.storeId)
      .call();
    products.map(async element => {
      const details = await this.state.marketPlace.methods
        .products(element.toNumber())
        .call();
      const ipfsHash = getIpfsHashFromBytes32(details.metaData);
      getData(ipfsHash).then(async (res) => {
        var arrayBufferView = new Uint8Array(res.uri.data);
        var blob = new Blob([arrayBufferView], {
          type: "image/jpeg"
        });
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);

        const productDetail = {
          id: element.toNumber(),
          name: res.name,
          img: imageUrl,
          desc: res.description,
          paymentMethod: await this.getPaymentMethod(details.paymentAddress),
          price: web3.utils.fromWei(details.price.toString(), "ether"),
          stock: details.stock.toString(),
          onStore: details.onStore
        };
        this.setState({
          productDetails: [...this.state.productDetails, productDetail],
        });
        if(!this.state.validPaymentMethods.includes(details.paymentAddress)){
          const balance =  await this.getBalance(this.state.storeId, details.paymentAddress)
          const data = {
            tokenAddress : details.paymentAddress,
            balance
          }
          this.setState({
            validPaymentMethods: [...this.state.validPaymentMethods, details.paymentAddress]
          });
          this.setState({
            balances: [...this.state.balances, data]
          });
        }
      });
    });
  }

  addProduct(
    productName,
    productDescription,
    paymentMethod,
    productPrice,
    stockCount,
    uri
  ) {
    this.setState({
      loading: true
    });
    const data = {
      name: productName,
      description: productDescription,
      uri
    };
    paymentMethod = paymentMethod || ZERO_ADDRESS;
    setData(data).then(ipfsHash => {
      const ipfsHashBytes32 = getBytes32FromIpfsHash(ipfsHash);
      this.state.marketPlace.methods
        .addProduct(
          this.state.storeId,
          ipfsHashBytes32,
          stockCount,
          paymentMethod,
          web3.utils.toWei(productPrice, "ether").toString()
        )
        .send({
          from: this.state.account,
          gasPrice: 5000000000
        })
        .once("receipt", receipt => {
          this.setState({
            transactionHash: receipt.transactionHash
          });
          this.setState({
            loading: false
          });
          this.getProductDetails();
        });
    });
  }

  editProduct(e) {
    this.props.history.push({
      pathname: '/owner/products/edit',
      state: {
        account: this.state.account,
        id: e.target.id,
        storeId: this.state.storeId,
      }
    });
  }

  toStorePanel() {
    this.props.history.push({
      pathname: "/owner",
      state: {
        account: this.state.account,
      }
    });
  }

  render() {
    if(this.state.isRedirect){
      return <Redirect to="/"/>
    }
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-primary flex-md-nowrap p-0 shadow">
          <a className="navbar-brand col-sm-3 col-md-2 mr-0">
            {this.state.storeDetail && this.state.storeDetail.name} - 
            {this.state.storeDetail && this.state.storeDetail.desc}
          </a>
          <ul className="navbar-nav">
            <li className="nav-teim">
            <a
            id="storeManagement"
            className="nav-link"
            value=""
            onClick={this.toStorePanel}
          >
            Store Management
          </a>
            </li>
          </ul>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small>
                <span id="account"> {this.state.account} </span>
              </small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid">
        {(this.state.balances.length>0 && 
        <div className="row mt-5">
        <table className="table table-bordered">
        <thead>
          <tr>
            <th scope="col">Token Address</th>
            <th scope="col">Balance</th>
            <th scope="col">Action</th>
          </tr>
          </thead>
          <tbody>
          {!!this.state.balances && this.state.balances.map((element,key) => {
            return(
            <tr key={key}>
              <td>
                {element.tokenAddress}
              </td>
              <td>
                {element.balance}
              </td>
              <td>
                <input
                id={element.tokenAddress}
                          type="button"
                          className="btn btn-primary"
                          value="Withdraw"
                          onClick={this.withdrawFunds}
                          />
              </td>
            </tr>
            )
          }) }
          </tbody>
          </table>
        </div>)}
          <div className="row">
            <main role="main" className="col-lg-4 flex-column mt-0">
              {this.state.loading ? (
                <div id="loader" className="text-center">
                  <p className="text-center"> Loading... </p>
                </div>
              ) : (
                <NewProduct addProduct={this.addProduct} />
              )}

              {this.state.transactionHash.length > 0 && (
                <span>
                  Transaction Hash:
                  {this.state.transactionHash}
                </span>
              )}
            </main>
            <main role="main" className="col-lg-8 d-flex mt-0">
              <div>
                <h2 className="text-center"> Products </h2>
                {this.state.productDetails.map((productDetail, key) => {
                  return (
                    <div className="card storeDiv m-2" key={key}>
                      <img
                        className="card-img-top fixHeight"
                        src={productDetail.img}
                        alt="Card image cap"
                      />
                      <div className="card-body">
                        <h5 className="card-title"> {productDetail.name} </h5>
                        <p className="card-text"> {productDetail.desc} </p>
                        <p className="card-text">
                          
                          {productDetail.price} {productDetail.paymentMethod}
                        </p>
                        <p className="card-text">
                          
                          {productDetail.stock} Left on Stock
                        </p>
                        <p className="card-text">
                          
                          {productDetail.onStore ? "Listed" : "Not Listed"}
                        </p>

                        <input
                          id={productDetail.id}
                          type="button"
                          className="btn btn-primary"
                          value="Edit Product"
                          onClick={this.editProduct}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default ProductManager;
