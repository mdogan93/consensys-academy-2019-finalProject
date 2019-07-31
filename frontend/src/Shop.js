import React, { Component } from "react";
import {Redirect} from "react-router-dom";
import {
  MARKET_PLACE_ABI,
  MARKET_PLACE_ADDRESS,
} from "./config/contracts";
import Web3 from "web3";
import "./styles/StoreOwner.css";
import {
  getData,
  getIpfsHashFromBytes32
} from "./utils/IPFSUtil";
let web3;

class Shop extends Component {
  componentWillMount() {
    this.initWeb3();
    window.ethereum.on('accountsChanged', async(acc) => {
        this.setState({isRedirect:true})
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
      storeDetails: [],
      isRedirect:false,
    };
    this.toShopProducts = this.toShopProducts.bind(this);
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

  async getStoreDetails() {
    const storeCount =  (await this.state.marketPlace.methods.storeCount().call()).toNumber();
    
    for(let i = 0 ; i < storeCount ; i++){
        const storeMeta = await this.state.marketPlace.methods
        .storeMetadatas(i)
        .call();
      const ipfsHash = getIpfsHashFromBytes32(storeMeta);
      getData(ipfsHash).then(res => {
        var arrayBufferView = new Uint8Array(res.uri.data);
        var blob = new Blob([arrayBufferView], { type: "image/jpeg" });
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);
        const storeDetail = {
          id:i,
          name: res.name,
          img: imageUrl,
          desc: res.description
        };
        this.setState({
          storeDetails: [...this.state.storeDetails, storeDetail]
        });
      });
    }
      
  }

  toShopProducts(e){
    this.props.history.push({
        pathname: '/shop/products',
        state: {
            account: this.state.account,
            id: e.target.id
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
            Rappa Shop
          </a>
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
                          <input id={storeDetail.id} type="button" className="btn btn-success btn-block" value="Shop Now!" onClick={this.toShopProducts}>
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

export default Shop;
