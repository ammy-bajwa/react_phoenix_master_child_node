import React from "react";

import { RenderFileNames } from "./renderFileNames";

class FileUploadMaster extends React.Component {
  state = {
    filesArr: [],
    files: {},
    filesBufferArr: [],
    fileNamesArr: [],
    chunkSize: 64000, // Bytes
  };
  handleChange = (event) => {
    const { chunkSize } = this.state;
    const inputElement = document.getElementById("masterFileUpload");
    if (inputElement.files && inputElement.files.length > 0) {
      let fileNamesArr = [];
      let files = {};
      for (const key in inputElement.files) {
        if (Object.hasOwnProperty.call(inputElement.files, key)) {
          const file = inputElement.files[key];
          fileNamesArr.push(file.name);
          const fileObj = {
            fileName: file.name,
            file,
            size: file.size,
            startSliceIndex: 0,
            endSliceIndex: chunkSize,
          };
          files[file.name] = fileObj;
          this.setState({
            files,
          });
        }
      }
      this.setState({ fileNamesArr });
    } else {
      console.log("No file selected");
    }
  };

  handleFilesToMasters = async (event) => {
    const { filesArr, chunkSize } = this.state;
    if (filesArr.length > 0) {
      let filesBufferArr = [];
      filesArr.forEach(({ file, size, startSliceIndex, endSliceIndex }) => {
        const sendFilePromise = new Promise((resolve, reject) => {
          while (startSliceIndex < size) {
            const slicedFilePart = file.slice(startSliceIndex, endSliceIndex);
            startSliceIndex = startSliceIndex + chunkSize;
            endSliceIndex = endSliceIndex + chunkSize;
            const reader = new FileReader();
            reader.addEventListener("load", (event) => {
              let fileArrBuffer = event.target.result;
              console.log(fileArrBuffer.byteLength);
              this.setState({
                filesBufferArr,
              });
            });
            console.log(file.size);
            reader.readAsArrayBuffer(slicedFilePart);
          }
        });
      });
    }
    console.log("filesArr: ", filesArr);
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
        <div>
          <button
            className="btn btn-outline-light m-2"
            // onClick={this.handleFilesToChilds}
          >
            Send Files To Child
          </button>
          <button
            className="btn btn-outline-light m-2"
            onClick={this.handleFilesToMasters}
          >
            Send Files To Masters
          </button>
        </div>
      </div>
    );
  }
}

export default FileUploadMaster;
