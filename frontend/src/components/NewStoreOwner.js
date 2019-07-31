import React, { Component } from 'react'

class NewStoreOwner extends Component {

  render() {
    return (
      <div id="content">
        <form onSubmit={(event) => {
          event.preventDefault()
          this.props.addStoreOwner(this.ownerAddress.value)
        }}>
          <input id="newOwner" ref={(input) => this.ownerAddress = input} type="text" className="form-control" placeholder="Address of store owner" required />
          <input className="btn btn-primary btn-lg btn-block mt-2" type="submit"/>
        </form>
      </div>
    );
  }
}

export default NewStoreOwner;