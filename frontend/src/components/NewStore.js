import React, { Component } from "react";

class NewStore extends Component {
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
            this.props.createStore(
              this.storeName.value,
              this.storeDescription.value,
              this.state.imageBuffer
            );
          }}
        >
          <h2 className="text-center"> Create New Store </h2>
          <input
            id="storeName"
            ref={input => (this.storeName = input)}
            type="text"
            className="form-control my-2"
            placeholder="Store Name"
            required
          />
          <input
            id="storeDescription"
            ref={input => (this.storeDescription = input)}
            type="text"
            className="form-control my-2"
            placeholder="Store Description"
            required
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

export default NewStore;
