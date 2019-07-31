import React, { Component } from "react";
import { Redirect } from "react-router-dom";

import {
  MARKET_PLACE_ABI,
  MARKET_PLACE_ADDRESS,
  ERC20ABI,
} from "./config/contracts";
import Web3 from "web3";
import "./styles/StoreOwner.css";
import { getData, getIpfsHashFromBytes32 } from "./utils/IPFSUtil";
let web3;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

class Products extends Component {
  componentWillMount() {
    this.initWeb3();
    window.ethereum.on("accountsChanged", async acc => {
        this.setState({ account: acc[0] });
        this.setState({ isRedirect: true });
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
    };
    this.purchaseProduct = this.purchaseProduct.bind(this);
    this.toStorePanel = this.toStorePanel.bind(this);
    this.handleChange = this.handleChange.bind(this);
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

  async getProductDetails() {
    const products = await this.state.marketPlace.methods
      .getProductsInStore(this.state.storeId)
      .call();
    products.map(async element => {
      const details = await this.state.marketPlace.methods
        .products(element.toNumber())
        .call();
      const ipfsHash = getIpfsHashFromBytes32(details.metaData);
      getData(ipfsHash).then(async(res) => {
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
          productDetails: [...this.state.productDetails, productDetail]
        });
      });
    });
  }

  async purchaseProduct(e) {
    this.setState({
        loading: true
      });
    const selectedItemId = e.target.id;
    const productId = this.state.productDetails[selectedItemId].id;
    const details = await this.state.marketPlace.methods
      .products(productId)
      .call();
    const quantity = this.state[`${selectedItemId}-amount`];
    const totalCostInEther =
      parseFloat(web3.utils.fromWei(details.price.toString(), "ether")) *
      quantity;

    if (quantity === undefined) {
      alert("No quantity");
    } else {
      // Ether payment
      if (details.paymentAddress === ZERO_ADDRESS) {
        this.state.marketPlace.methods
          .purchaseProduct(productId, details.paymentAddress, 0, quantity)
          .send({
            from: this.state.account,
            gasPrice: 5000000000,
            value: web3.utils.toWei(totalCostInEther.toString(),'ether')
          })
          .once("receipt", receipt => {
            this.setState({
              transactionHash: receipt.transactionHash
            });
            this.setState({
              loading: false
            });
          });
      } else {
        const tokenContract = new web3.eth.Contract(
            ERC20ABI,
            details.paymentAddress
          );
          tokenContract.methods.approve(MARKET_PLACE_ADDRESS,web3.utils.toWei(totalCostInEther.toString(),'ether')).send({
            from: this.state.account,
            gasPrice: 5000000000,
          })
          .once("receipt", receiptApprove => {
            this.state.marketPlace.methods
            .purchaseProduct(productId, details.paymentAddress, web3.utils.toWei(totalCostInEther.toString(),'ether') , quantity)
            .send({
              from: this.state.account,
              gasPrice: 5000000000,
            })
            .once("receipt", receipt => {
              this.setState({
                transactionHash: receipt.transactionHash
              });
              this.setState({
                loading: false
              });
            });
          })
        }
    }
  }

  toStorePanel() {
    this.props.history.push({
      pathname: "/shop",
      state: {
        account: this.state.account
      }
    });
  }
  handleChange(e) {
    const { value, id } = e.target;
    this.setState({ [id]: value });
  }

  render() {
    if (this.state.isRedirect) {
        return (
          <Redirect
            to={{ pathname: "/" }}
          />
        );
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
                onClick={this.toStorePanel}
              >
                Store Fronts
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
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading ? (
                <div id="loader" className="text-center">
                  <p className="text-center">Loading...</p>
                </div>
              ) : (
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

                          <input
                            id={`${key}-amount`}
                            type="number"
                            className="form-control"
                            onChange={this.handleChange}
                            placeholder="Quantity"
                          />
                          <input
                            id={key}
                            type="button"
                            className="btn btn-primary btn-block mt-2"
                            value="Buy Now"
                            onClick={this.purchaseProduct}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default Products;
