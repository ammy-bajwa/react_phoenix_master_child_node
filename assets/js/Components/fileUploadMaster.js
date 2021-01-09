import React from "react";

import { RenderFileNames } from "./renderFileNames";

class FileUploadMaster extends React.Component {
  state = {
    filesArr: [],
    fileNamesArr: [],
    chunkSize: 16 * 1024,
  };
  handleChange = (event) => {
    const inputElement = document.getElementById("masterFileUpload");
    if (inputElement.files && inputElement.files.length > 0) {
      let fileNamesArr = [];
      let filesArr = [];
      for (const key in inputElement.files) {
        if (Object.hasOwnProperty.call(inputElement.files, key)) {
          const file = inputElement.files[key];
          fileNamesArr.push(file.name);
          filesArr.push(file);
        }
      }
      this.setState({ fileNamesArr, filesArr });
    } else {
      console.log("No file selected");
    }
  };

  handleFilesToMasters = (event) => {
    const { filesArr, chunkSize } = this.state;
    if (filesArr.length > 0) {
      filesArr.forEach((file) => {
        const reader = new FileReader();
        reader.addEventListener("load", (event) => {
          let fileArrBuffer = event.target.result;
          const chunksPromise = new Promise((resolve, reject) => {
            // Keep chunking, and sending the chunks to the other peer
            try {
              while (fileArrBuffer.byteLength) {
                const chunk = fileArrBuffer.slice(0, chunkSize);
                fileArrBuffer = fileArrBuffer.slice(
                  chunkSize,
                  fileArrBuffer.byteLength
                );

                // Off goes the chunk!
                // dataChannel.send(chunk);
                console.log("chunk: ", chunk);
                resolve({ allOk: true });
              }
            } catch (error) {
              reject({ allOk: false });
            }
          });
          chunksPromise
            .then(() => {
              console.log("All chunks sended");
            })
            .catch(() => {
              console.error("Error in sending file: ".file.name);
            });
        });
        reader.readAsArrayBuffer(file);
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
