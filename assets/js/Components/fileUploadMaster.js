import React, { Children } from "react";

import { RenderFileNames } from "./renderFileNames";

class FileUploadMaster extends React.Component {
  state = {
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

  getChunkOfFile = async (file, startSliceIndex, endSliceIndex) => {
    const fileChunkPromise = new Promise((resolve, reject) => {
      const slicedFilePart = file.slice(startSliceIndex, endSliceIndex);
      const fileReader = new FileReader();
      fileReader.addEventListener("load", (event) => {
        // let fileChunk = event.target.result;
        resolve(event.target.result);
      });
      fileReader.readAsArrayBuffer(slicedFilePart);
    });
    return await fileChunkPromise;
  };

  updateSliceIndexes = async (fileName) => {
    const { chunkSize, files } = this.state;
    const updateIndexPromise = new Promise((resolve, reject) => {
      files[fileName].startSliceIndex =
        files[fileName].startSliceIndex + chunkSize;
      files[fileName].endSliceIndex = files[fileName].endSliceIndex + chunkSize;
      this.setState(
        {
          files,
        },
        () => {
          resolve(`indexes updated for ${fileName}`);
        }
      );
    });

    return await updateIndexPromise;
  };

  chunkAndUpdateIndex = async (
    fileName,
    file,
    size,
    startSliceIndex,
    endSliceIndex
  ) => {
    let fileChunkToSend = await this.getChunkOfFile(
      file,
      startSliceIndex,
      endSliceIndex,
      size
    );
    await this.updateSliceIndexes(fileName);
  };

  createAndSendChunksOfFile = async ({
    fileName,
    file,
    size,
    startSliceIndex,
    endSliceIndex,
  }) => {
    const { chunkSize } = this.state;
    let counter = startSliceIndex;
    while (counter < size) {
      await this.chunkAndUpdateIndex(
        fileName,
        file,
        size,
        startSliceIndex,
        endSliceIndex
      );
      counter = counter + chunkSize;
      console.log(counter);
    }
    console.log("While loop end");
  };

  handleFilesToMasters = async (event) => {
    const { files } = this.state;
    if (Object.keys(files).length > 0) {
      for (const key in files) {
        if (Object.hasOwnProperty.call(files, key)) {
          const fileObj = files[key];
          await this.createAndSendChunksOfFile(fileObj);
        }
      }
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
