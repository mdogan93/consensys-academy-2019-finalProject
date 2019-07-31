import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import {
  MARKET_PLACE_ABI,
  MARKET_PLACE_ADDRESS,
  ERC20ABI
} from "./config/contracts";
import Web3 from "web3";
import "./styles/StoreOwner.css";
import {
  getData,
  getIpfsHashFromBytes32
} from "./utils/IPFSUtil";
let web3;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

class StoreManager extends Component {
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
      productId: this.props.location.state.id,
      storeId: this.props.location.state.storeId,
      loading: true,
      productDetail: null
    };
    this.editProductInfo = this.editProductInfo.bind(this);
    this.toStorePanel = this.toStorePanel.bind(this);
    this.toProductPanel = this.toProductPanel.bind(this);
    this.getPaymentMethod = this.getPaymentMethod.bind(this);
  }

  initWeb3() {
    web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const marketPlace = new web3.eth.Contract(
      MARKET_PLACE_ABI,
      MARKET_PLACE_ADDRESS
    );
    this.setState({ marketPlace });
    this.setState({ loading: false });
  }

  toStorePanel() {
    this.props.history.push({
      pathname: "/owner",
      state: {
        account: this.state.account
      }
    });
  }

  toProductPanel() {
    this.props.history.push({
      pathname: "/owner/products",
      state: {
        account: this.state.account,
        id: this.state.storeId
      }
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
    const details = await this.state.marketPlace.methods
      .products(this.state.productId)
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
        id: this.state.productId,
        name: res.name,
        img: imageUrl,
        desc: res.description,
        paymentMethod: await this.getPaymentMethod(details.paymentAddress),
        price: web3.utils.fromWei(details.price.toString(), "ether"),
        stock: details.stock.toString(),
        onStore: details.onStore
      };
      this.setState({
        productDetail
      });
    });
  }

  editProductInfo(event) {
    event.preventDefault();
    const tokenAddress = event.target.tokenAddress.value;
    const price = web3.utils
      .toWei(event.target.productPrice.value, "ether")
      .toString();

    this.setState({ loading: true });

    this.state.marketPlace.methods
      .editProductInfo(this.state.productId, tokenAddress, price)
      .send({ from: this.state.account })
      .once("receipt", receipt => {
        this.setState({ transactionHash: receipt.transactionHash });
        this.setState({ loading: false });
      });
  }

  rejectChanges() {
    console.log("Rejected");
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
          <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="/">
            {" "}
            {this.state.productDetail && this.state.productDetail.name} -
            {this.state.productDetail && this.state.productDetail.desc}
          </a>
          <ul className="navbar-nav">
            <li className="nav-item">
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
          <ul className="navbar-nav">
            <li className="nav-item">
              <a
                id="storeManagement"
                className="nav-link"
                value=""
                onClick={this.toProductPanel}
              >
                Back to Product Management
              </a>
            </li>
          </ul>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small>
                <span id="account">{this.state.account}</span>
              </small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid m-5">
          <div className="row">
            <form onSubmit={this.editProductInfo}>
              {this.state.productDetail && !!this.state.productDetail.name && (
                <div>
                  <div className="form-group row">
                    <h2 className="text-center">Product Info</h2>
                    <img
                      className="card-img-top fixHeight"
                      src={
                        this.state.productDetail && this.state.productDetail.img
                      }
                      alt="Card image cap"
                    />
                  </div>
                  <div className="form-group row">
                    <label
                      htmlFor="tokenAddress"
                      className="col-sm-3 col-form-label"
                    >
                      Token Address
                    </label>
                    <div className="col-sm-9">
                      <input
                        type="text"
                        className="form-control"
                        id="tokenAddress"
                        placeholder="If ether leave it blank"
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="productPrice"
                      className="col-sm-3 col-form-label"
                    >
                      Price
                    </label>
                    <div className="col-sm-9">
                      <input
                        type="text"
                        className="form-control"
                        id="productPrice"
                      />
                    </div>
                  </div>
                  <input
                    className="btn btn-success btn-block float-left"
                    type="submit"
                    value="Update Price"
                  />
                  <button
                    className="btn btn-danger btn-block float-right"
                    onClick={this.rejectChanges}
                    type="reset"
                  >
                    Discard
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default StoreManager;
