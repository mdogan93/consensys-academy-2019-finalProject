import React, { Component } from "react";
import { Redirect} from "react-router-dom";
import { MARKET_PLACE_ABI, MARKET_PLACE_ADDRESS } from "./config/contracts";
import Web3 from "web3";
import "./styles/StoreOwner.css";
import {
  setData,
  getData,
  getBytes32FromIpfsHash,
  getIpfsHashFromBytes32
} from "./utils/IPFSUtil";
let web3;

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
  }

  constructor(props) {
    super(props);
    this.state = {
      account: this.props.location.state.account,
      storeId: this.props.location.state.id,
      loading: true,
      storeDetail: null,
      file: null,
      imageBuffer: null
    };
    this.handleChange = this.handleChange.bind(this);
    this.editStoreInfo = this.editStoreInfo.bind(this);
    this.toStorePanel = this.toStorePanel.bind(this);
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
        account: this.state.account,
      }
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
      this.setState({
        imageBuffer : Buffer(res.uri.data)
      });
    });
  }

  handleChange(event) {
    if (event.target.files[0]) {
      this.setState({
        file: URL.createObjectURL(event.target.files[0])
      });
      const reader = new window.FileReader();
      reader.readAsArrayBuffer(event.target.files[0]);
      reader.onloadend = () => {
        this.setState({ imageBuffer: Buffer(reader.result) });
        this.setState({
          storeDetail: { ...this.state.storeDetail, img: this.state.file }
        });
      };
    }
  }


  editStoreInfo(event) {
    event.preventDefault();
    const name = event.target.storeName.value;
    const description = event.target.storeDescription.value;
    const uri = this.state.imageBuffer;
      this.setState({ loading: true });
      const data = {
        name,
        description,
        uri
      };
      setData(data).then(ipfsHash => {
        const ipfsHashBytes32 = getBytes32FromIpfsHash(ipfsHash);
        this.state.marketPlace.methods
          .editStoreInfo(this.state.storeId, ipfsHashBytes32)
          .send({ from: this.state.account })
          .once("receipt", receipt => {
            this.setState({ transactionHash: receipt.transactionHash });
            this.setState({ loading: false });
            this.getStoreDetails();
          });
      });
  }
  

  rejectChanges(){
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
          <a className="navbar-brand col-sm-3 col-md-2 mr-0">
            Edit Store
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
                <span id="account">{this.state.account}</span>
              </small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid m-5">
          <div className="row">
            <form
            onSubmit={this.editStoreInfo}>
              {this.state.storeDetail && !!this.state.storeDetail.name && (
                <div>
                  <div className="form-group row">
                    <h2 className="text-center">Store Info</h2>
                    <img
                      className="card-img-top fixHeight"
                      src={this.state.storeDetail.img}
                      alt="Card image cap"
                    />
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <span className="input-group-text">Upload</span>
                      </div>
                      <div className="custom-file">
                        <input
                          id="storeImage"
                          type="file"
                          className="custom-file-input"
                          ref={input => (this.storeImage = input)}
                          onChange={this.handleChange}
                        />
                        <label className="custom-file-label">Choose file</label>
                      </div>
                    </div>
                  </div>
                    <div className="form-group row">
                      <label htmlFor="storeName" className="col-sm-3 col-form-label">
                        Name
                      </label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          className="form-control"
                          id="storeName"
                          defaultValue={this.state.storeDetail.name}
                        />
                      </div>
                    </div>

                    <div className="form-group row">
                      <label htmlFor="storeDescription" className="col-sm-3 col-form-label">
                        Description
                      </label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          className="form-control"
                          id="storeDescription"
                          defaultValue={this.state.storeDetail.desc}
                        />
                      </div>
                    </div>
                    <input
                      className="btn btn-success btn-block float-left"
                      type="submit"
                      value="Confirm"
                    />
                    <button
                      className="btn btn-danger btn-block float-right"
                      onClick={this.rejectChanges}
                      type="reset">
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
