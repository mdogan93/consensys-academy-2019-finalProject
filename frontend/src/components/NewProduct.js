import React, { Component } from "react";

class NewProduct extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      imageBuffer: null,
      selectedFile: ""
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    if (event.target.files[0]) {
      this.setState({
        file: URL.createObjectURL(event.target.files[0]),
        selectedFile: event.target.files[0].name
      });

      const reader = new window.FileReader();
      reader.readAsArrayBuffer(event.target.files[0]);
      reader.onloadend = () => {
        this.setState({ imageBuffer: Buffer(reader.result) });
      };
    }
  }

  render() {
    return (
      <div id="content">
        <form
          onSubmit={event => {
            event.preventDefault();
            this.props.addProduct(
              this.productName.value,
              this.productDescription.value,
              this.paymentMethod.value,
              this.productPrice.value,
              this.stockCount.value,
              this.state.imageBuffer
            );
          }}
        >
          <h2 className="text-center"> Create New Product </h2>

          <div className="form-group">
            <label htmlFor="productName">Name</label>
            <input
              type="text"
              className="form-control"
              id="productName"
              ref={input => (this.productName = input)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="productDescription">Description</label>
            <input
              type="text"
              className="form-control"
              id="productDescription"
              ref={input => (this.productDescription = input)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod">Token Address</label>
            <input
              type="text"
              className="form-control"
              id="paymentMethod"
              placeholder="If ether leave it blank"
              ref={input => (this.paymentMethod = input)}
            />
          </div>
          <div className="form-group row">
            <label htmlFor="productPrice" className="col-sm-3 col-form-label">
              Price
            </label>
            <div className="col-sm-9">
              <input
                type="text"
                className="form-control"
                id="productPrice"
                ref={input => (this.productPrice = input)}
              />
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="stockCount" className="col-sm-3 col-form-label">
              Stock
            </label>
            <div className="col-sm-9">
              <input
                type="text"
                className="form-control"
                id="stockCount"
                ref={input => (this.stockCount = input)}
              />
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text">Upload</span>
            </div>
            <div className="custom-file">
              <input
                id="productImage"
                type="file"
                className="custom-file-input"
                ref={input => (this.productImage = input)}
                onChange={this.handleChange}
                required
              />
              <label className="custom-file-label">
                {this.state.selectedFile && this.state.selectedFile.length > 0
                  ? this.state.selectedFile
                  : "Choose File"}
              </label>
            </div>
          </div>
          <input className="btn btn-primary btn-lg btn-block" type="submit" />
          <img className="img-fluid" src={this.state.file} />
        </form>
      </div>
    );
  }
}

export default NewProduct;
