import React from "react";
import { RenderFileNames } from "./renderFileNames";

class FileUploadMaster extends React.Component {
  state = {
    fileNamesArr: [],
  };
  handleChange = (event) => {
    const inputElement = document.getElementById("masterFileUpload");
    if (inputElement.files && inputElement.files.length > 0) {
      let fileNamesArr = [];
      for (const key in inputElement.files) {
        if (Object.hasOwnProperty.call(inputElement.files, key)) {
          const { name } = inputElement.files[key];
          fileNamesArr.push(name);
        }
      }
      this.setState({ fileNamesArr });
    }
  };
  render() {
    const { fileNamesArr } = this.state;
    return (
      <div>
        <div className="custom-file mt-2 mb-2">
          <input
            type="file"
            className="custom-file-input"
            onChange={this.handleChange}
            id="masterFileUpload"
            multiple
          />
          <label className="custom-file-label" htmlFor="masterFileUpload">
            Choose file
          </label>
        </div>
        <RenderFileNames fileNamesArr={fileNamesArr} />
      </div>
    );
  }
}

export default FileUploadMaster;
