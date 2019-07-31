import React, { Component } from "react";
import { MARKET_PLACE_ABI, MARKET_PLACE_ADDRESS } from "./config/contracts";
import './styles/Admin.css'
import {
  Redirect
} from "react-router-dom";

import Web3 from "web3";
let web3;
class Main extends Component {
  componentWillMount() {
    this.checkMetamask();
  }
  

  constructor(props) {
    super(props);
    this.state = {
      account: "",
    };
  }

  async checkMetamask() {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      try {
        window.ethereum.enable().then(async () => {
          web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
          const accounts = await web3.eth.getAccounts();
          this.setState({
            account: accounts[0]
          });
          await this.checkRole();
        });
      } catch (e) {
        // User has denied account access to DApp...
      }
    }
    // Legacy DApp Browsers
    else if (window.web3) {
      web3 = new Web3(web3.currentProvider);
    }
    // Non-DApp Browsers
    else {
      alert("You have to install MetaMask !");
    }
    window.ethereum.on('accountsChanged', async(acc) => {
      this.setState({
        account:acc[0]
      })
      await this.checkRole();

    })
  }

  async checkRole() {
    const marketPlace = new web3.eth.Contract(MARKET_PLACE_ABI, MARKET_PLACE_ADDRESS);
    const isAdmin = await marketPlace.methods.admins(this.state.account).call();
    const isStoreOwner = await marketPlace.methods.storeOwners(this.state.account).call();

    this.setState({
        isAdmin
      });
    this.setState({
        isStoreOwner
      });
    this.setState({
      isShopper:true,
    });

  }

  render() {
    if (this.state.isAdmin) {
      return (
        <Redirect
          to={{ pathname: "/admin", state: { account: this.state.account } }}
        />
      );
    }

    if (this.state.isStoreOwner) {
      return (
        <Redirect
          to={{ pathname: "/owner", state: { account: this.state.account } }}
        />
      );
    }

    if(this.state.isShopper){
      return (
        <Redirect
          to={{ pathname: "/shop", state: { account: this.state.account } }}
          />
      )
    }

    return (
      <div>
        <p> Your account: {this.state.account} </p>{" "}
      </div>

    );
  }
}

export default Main;
