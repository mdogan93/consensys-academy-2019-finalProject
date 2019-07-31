import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { MARKET_PLACE_ABI, MARKET_PLACE_ADDRESS } from "./config/contracts";
import NewStoreOwner from "./components/NewStoreOwner";
import Web3 from "web3";
let web3;

class Admin extends Component {
  componentWillMount() {
    this.initWeb3();
    window.ethereum.on("accountsChanged", async acc => {
      this.setState({ account: acc[0] });
      this.setState({ isRedirect: true });
    });
  }

  componentWillUnmount() {}

  constructor(props) {
    super(props);
    this.state = {
      account: this.props.location.state.account,
      loading: true,
      newAddress: "",
      transactionHash: "",
      isRedirect: false
    };
    this.addStoreOwner = this.addStoreOwner.bind(this);
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

  addStoreOwner(content) {
    this.setState({ loading: true });
    this.state.marketPlace.methods
      .addStoreOwner(content)
      .send({ from: this.state.account, gasPrice: 5000000000 })
      .once("receipt", receipt => {
        this.setState({ loading: false });
        this.setState({ newAddress: content });
        this.setState({ transactionHash: receipt.transactionHash });
      });
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
            Market Place Admin Panel
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
              className="col-lg-12 d-flex justify-content-center"
            >
              {this.state.loading ? (
                <div id="loader" className="text-center">
                  <p className="text-center">Loading...</p>
                </div>
              ) : (
                <NewStoreOwner addStoreOwner={this.addStoreOwner} />
              )}
            </main>
          </div>
          {this.state.transactionHash.length > 0 && (
                <div className="row justify-content-center m-2">
                  <p>
                    New owner with address {this.state.newAddress} is
                    succesfully generated with transaction :
                    {this.state.transactionHash}
                  </p>
                </div>
              )}
        </div>
      </div>
    );
  }
}

export default Admin;
