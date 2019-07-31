import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { MARKET_PLACE_ABI, MARKET_PLACE_ADDRESS } from "./config/contracts";
import NewStore from "./components/NewStore";
import Web3 from "web3";
import "./styles/StoreOwner.css";
import {
  setData,
  getData,
  getBytes32FromIpfsHash,
  getIpfsHashFromBytes32
} from "./utils/IPFSUtil";
let web3;

class StoreOwner extends Component {
  componentWillMount() {
    this.initWeb3();
    window.ethereum.on("accountsChanged", async acc => {
      this.setState({ isRedirect: true });
      this.setState({account:acc[0]})
    });
  }
  componentDidMount() {
    this.getStoreDetails();
  }

  constructor(props) {
    super(props);
    this.state = {
      account: this.props.location.state.account,
      loading: true,
      newStore: "",
      transactionHash: "",
      storeDetails: [],
      isRedirect:false,
    };
    this.createStore = this.createStore.bind(this);
    this.manageStore = this.manageStore.bind(this);
    this.manageProducts = this.manageProducts.bind(this);

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

  async getStoreDetails() {
    const response = await this.state.marketPlace.methods
      .getStoresOfOwner(this.state.account)
      .call();
    response.map(async element => {
      const storeMeta = await this.state.marketPlace.methods
        .storeMetadatas(element.toNumber())
        .call();
      const ipfsHash = getIpfsHashFromBytes32(storeMeta);
      getData(ipfsHash).then(res => {
        var arrayBufferView = new Uint8Array(res.uri.data);
        var blob = new Blob([arrayBufferView], { type: "image/jpeg" });
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);
        const storeDetail = {
          id:element.toNumber(),
          name: res.name,
          img: imageUrl,
          desc: res.description
        };
        this.setState({
          storeDetails: [...this.state.storeDetails, storeDetail]
        });
      });
    });
  }

  createStore(storeName, storeDescription, uri) {
    this.setState({ loading: true });
    const data = {
      name: storeName,
      description: storeDescription,
      uri
    };
    setData(data).then(ipfsHash => {
      const ipfsHashBytes32 = getBytes32FromIpfsHash(ipfsHash);
      this.state.marketPlace.methods
        .createStore(ipfsHashBytes32)
        .send({ from: this.state.account, gasPrice:5000000000 })
        .once("receipt", receipt => {
          this.setState({ transactionHash: receipt.transactionHash });
          this.setState({ loading: false });
          this.getStoreDetails();
        });
    });
  }

  manageProducts(e){
    this.props.history.push({
        pathname: "owner/products",
        state: {
            account: this.state.account,
            id: e.target.id
        }
    });
  }

  manageStore(e){
    this.props.history.push({
        pathname: "owner/stores",
        state: {
            account: this.state.account,
            id: e.target.id
        }
    });
  }

  render() {
    if (this.state.isRedirect) {
      return <Redirect to={{ pathname: "/", state: { account: this.state.account } }} />;
    }
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-primary flex-md-nowrap p-0 shadow">
          <a href="/" className="navbar-brand col-sm-3 col-md-2 mr-0">
            Market Place StoreOwner Panel
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small>
                <span id="account">{this.state.account}</span>
              </small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid">
          <div className="row">
            <main
              role="main"
              className="col-lg-4 flex-column"
            >
              {this.state.loading ? (
                <div id="loader" className="text-center">
                  <p className="text-center">Loading...</p>
                </div>
              ) : (
                <NewStore createStore={this.createStore} />
              )}

              {(
                this.state.transactionHash.length >0 &&
                <div>
                  New store is created with transaction :  {this.state.transactionHash.substr(0,32)}-{this.state.transactionHash.substr(32,65)}
              
                </div>
              )}


            </main>

            <main
              role="main"
              className="col-lg-8 d-flex"
            >
              <div>
                <h2 className="text-center">Stores</h2>
                  {this.state.storeDetails.map((storeDetail, key) => {
                    return (
                      <div className="card storeDiv m-2" key={key}>
                        <img
                          className="card-img-top fixHeight"
                          src={storeDetail.img}
                          alt="Card image cap"
                        />
                        <div className="card-body">
                          <h5 className="card-title">{storeDetail.name}</h5>
                          <p className="card-text">
                            {storeDetail.desc}
                          </p>
                          <input id={storeDetail.id} type="button" className="btn btn-primary" value="Manage Products" onClick={this.manageProducts}>
                          </input>
                          <input id={storeDetail.id} type="button" className="btn btn-secondary float-right" value="Edit Info" onClick={this.manageStore}>
                          </input>
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

export default StoreOwner;
