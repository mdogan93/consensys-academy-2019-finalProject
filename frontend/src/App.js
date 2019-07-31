import React, { Component } from "react";
import Main from './Main'
import Admin from './Admin'
import StoreOwner from './StoreOwner'
import StoreManager from './StoreManager'
import ProductManager from './ProductManager'
import EditProduct from './EditProduct'
import Shop from './Shop'
import Products from './Products'

import {
  BrowserRouter,
  Switch,
  Route,
} from "react-router-dom";

class App extends Component {
  render() {
    return <BrowserRouter>
    <Switch>
      <Route exact path="/" component={Main}/>
      <Route exact path="/admin" component={Admin}/>
      <Route exact path="/owner" component={StoreOwner}/>
      <Route exact path="/owner/stores" component={StoreManager}/>
      <Route exact path="/owner/products" component={ProductManager}/>
      <Route exact path="/owner/products/edit" component={EditProduct}/>
      <Route exact path="/shop" component={Shop}/>
      <Route exact path="/shop/products" component={Products}/>


    </Switch>
    </BrowserRouter> ;
  }
}

export default App;